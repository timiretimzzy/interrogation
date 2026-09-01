// Card engine: question availability + ask + applyEffects (the information graph).
// Pure over (CaseFile, PlayerState); returns a NEW PlayerState (no in-place mutation
// of the input). Spending one interrogation action per ask (INV-118).

import { isQuestionAvailable } from './gating.ts';
import { executeTurn, TurnEngineError } from './turnEngine.ts';
import type {
  CaseFile,
  CaseQuestion,
  CharacterId,
  PlayerState,
} from './types.ts';

export class EngineError extends Error {}

/** Questions available to ask of a specific character right now. */
export function availableQuestionsForCharacter(
  caseFile: CaseFile,
  state: PlayerState,
  characterId: CharacterId,
): CaseQuestion[] {
  return caseFile.questions.filter(
    (q) => q.targetCharacterIds.includes(characterId) && isQuestionAvailable(caseFile, state, q.id),
  );
}

/** All currently-available questions across any character. */
export function allAvailableQuestions(caseFile: CaseFile, state: PlayerState): CaseQuestion[] {
  const seen = new Set<string>();
  const out: CaseQuestion[] = [];
  for (const q of caseFile.questions) {
    if (seen.has(q.id)) continue;
    if (isQuestionAvailable(caseFile, state, q.id)) {
      out.push(q);
      seen.add(q.id);
    }
  }
  return out;
}

export interface AskResult {
  state: PlayerState;
  variantId: string;
  text: string;
  contextId: string;
  kind: string;
  revealedClues: string[];
  unlockedQuestions: string[];
  activatedContradictions: string[];
}

/**
 * Ask `questionId` of `characterId`. Returns the next PlayerState with all
 * effects applied, or throws EngineError if unavailable or unaffordable.
 */
export function ask(
  caseFile: CaseFile,
  state: PlayerState,
  characterId: CharacterId,
  questionId: string,
): AskResult {
  try {
    const result = executeTurn(caseFile, state, characterId, questionId);
    return {
      state: result.state,
      variantId: result.response!.id,
      text: result.response!.text,
      contextId: result.response!.contextId,
      kind: result.response!.kind ?? 'UNCERTAIN',
      revealedClues: result.discoveries.filter((id) => caseFile.clues?.some((clue) => clue.id === id)),
      unlockedQuestions: result.newlyAvailableQuestions,
      activatedContradictions: result.contradictions,
    };
  } catch (error) {
    if (error instanceof TurnEngineError) throw new EngineError(error.message);
    throw error;
  }
}
