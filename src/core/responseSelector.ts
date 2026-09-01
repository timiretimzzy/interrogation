// Deterministic response selection. NO runtime RNG, NO LLM, NO clock.
// Same (sessionSeed, case, question, character, context) -> identical variant,
// across refresh and device (INV-113 / INV-120). Variants are selected by a
// weighted pick over a seed derived from a stable hash of the inputs.

import { hashSeed } from './hash.ts';
import type {
  CaseFile,
  CharacterId,
  ContextId,
  PlayerState,
  ResponseVariant,
  ResolutionContext,
} from './types.ts';

/**
 * Choose the active ResolutionContext for a character: the most specific one
 * whose `context` is among the player's earned context switches, else 'initial'.
 */
export function resolveActiveContext(
  state: PlayerState,
  contexts: ResolutionContext[],
): ContextId {
  const available = contexts.filter((c) => state.contextSwitches.includes(c.context));
  if (available.length === 0) return 'initial';
  // Prefer a non-initial (earned) context when present.
  const earned = available.find((c) => c.context !== 'initial');
  return (earned ?? available[0]).context;
}

/** Variants whose `requiresContext` (if any) is satisfied by earned contexts. */
export function eligibleVariants(
  context: ResolutionContext,
  state: PlayerState,
): ResponseVariant[] {
  const discovered = new Set([
    ...(state.discovered ?? []),
    ...state.discoveredClues,
    ...state.discoveredEvidence,
    ...state.recordedStatements,
    ...state.activeContradictions,
  ]);
  return context.variants.filter((v) =>
    (v.requiresContext === undefined || state.contextSwitches.includes(v.requiresContext))
    && (v.requires ?? []).every((id) => discovered.has(id))
    && !(v.excludes ?? []).some((id) => discovered.has(id)),
  );
}

/**
 * Weighted pick: r = seed mod totalWeight, then the first variant whose
 * cumulative weight exceeds r. Deterministic for a given seed.
 */
export function weightedPick(variants: ResponseVariant[], seed: number): ResponseVariant {
  const total = variants.reduce((acc, v) => acc + Math.max(0, v.weight), 0);
  if (total <= 0) {
    // Degenerate weights: fall back to first variant (still deterministic).
    return variants[0];
  }
  const r = seed % total;
  let cumulative = 0;
  for (const v of variants) {
    cumulative += Math.max(0, v.weight);
    if (r < cumulative) return v;
  }
  return variants[variants.length - 1];
}

export interface SelectedResponse {
  variant: ResponseVariant;
  contextId: ContextId;
}

/**
 * Select the response variant for (character, question) under the player's
 * current state. Returns null if the character has no responses for the question.
 */
export function selectResponse(
  caseFile: CaseFile,
  state: PlayerState,
  characterId: CharacterId,
  questionId: string,
): SelectedResponse | null {
  const question = caseFile.questions.find((q) => q.id === questionId);
  if (!question) return null;
  const contexts = question.responses[characterId];
  if (!contexts || contexts.length === 0) return null;

  const contextId = resolveActiveContext(state, contexts);
  const context = contexts.find((c) => c.context === contextId) ?? contexts[0];
  const eligible = eligibleVariants(context, state);
  if (eligible.length === 0) return null;

  const seed = hashSeed(
    state.sessionSeed,
    caseFile.caseId,
    questionId,
    characterId,
    contextId,
  );
  const variant = weightedPick(eligible, seed);
  return { variant, contextId };
}
