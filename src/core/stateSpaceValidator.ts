import { claimDeduction, evaluateDeductions } from './deductionEngine.ts';
import { isQuestionAvailable } from './gating.ts';
import { eligibleVariants, resolveActiveContext } from './responseSelector.ts';
import { executeTurn } from './turnEngine.ts';
import { createInitialPlayerState } from './types.ts';
import type { CaseFile, CharacterId, PlayerState } from './types.ts';

export interface StateSpaceAction {
  type: 'ask' | 'claimDeduction';
  questionId?: string;
  characterId?: CharacterId;
  responseVariantId?: string;
  deductionId?: string;
}

export interface DeadEndDiagnostic {
  fingerprint: string;
  missingCriticalFactIds: string[];
}

export interface ValidationDiagnostic {
  code: 'NO_ELIGIBLE_RESPONSE' | 'UNREACHABLE_CRITICAL_FACT' | 'EXPLORATION_CAP_REACHED' | 'ACCUSATION_READINESS_UNDEFINED';
  message: string;
  fingerprint?: string;
}

export interface StateSpaceValidationResult {
  valid: boolean;
  complete: boolean;
  reachableStateCount: number;
  reachableFactIds: string[];
  unreachableFactIds: string[];
  reachableQuestionIds: string[];
  unreachableQuestionIds: string[];
  reachableDeductionIds: string[];
  unreachableDeductionIds: string[];
  deadEndStates: DeadEndDiagnostic[];
  accusationReady: boolean | null;
  diagnostics: ValidationDiagnostic[];
}

export interface StateSpaceValidationOptions {
  maxStates?: number;
  sessionSeed?: number;
}

const sorted = (values: readonly string[]) => [...new Set(values)].sort();

/** Progression-only identity; theory and transcript text are intentionally omitted. */
export function createStateFingerprint(state: PlayerState): string {
  const asked = Object.entries(state.interrogations)
    .flatMap(([characterId, records]) => records.map((record) => `${characterId}:${record.questionId}`));
  return JSON.stringify({
    facts: sorted(state.discoveredFactIds),
    clues: sorted(state.discoveredClues),
    evidence: sorted(state.discoveredEvidence),
    statements: sorted(state.recordedStatements),
    asked: sorted(asked),
    unlocked: sorted(state.unlockedQuestions),
    contradictions: sorted(state.activeContradictions),
    flagged: sorted(state.flaggedContradictions),
    contexts: sorted(state.contextSwitches),
    understood: sorted(state.understoodDeductionIds ?? []),
    availableDeductions: sorted(state.availableDeductionIds ?? []),
    actionsRemaining: state.actionsRemaining,
    status: state.status,
  });
}

function hasAsked(state: PlayerState, characterId: CharacterId, questionId: string): boolean {
  return (state.interrogations[characterId] ?? []).some((record) => record.questionId === questionId);
}

function criticalFactIds(caseFile: CaseFile): string[] {
  return caseFile.criticalFactIds ?? (caseFile.facts ?? [])
    .filter((fact) => fact.critical || fact.tier === 'A')
    .map((fact) => fact.id);
}

function actionsFor(caseFile: CaseFile, state: PlayerState, diagnostics: ValidationDiagnostic[]): StateSpaceAction[] {
  const actions: StateSpaceAction[] = [];
  if (state.actionsRemaining > 0) {
    for (const question of caseFile.questions) {
      if (!isQuestionAvailable(caseFile, state, question.id)) continue;
      for (const characterId of question.targetCharacterIds) {
        if (hasAsked(state, characterId, question.id)) continue;
        const contexts = question.responses[characterId] ?? [];
        if (contexts.length === 0) continue;
        const contextId = resolveActiveContext(state, contexts);
        const context = contexts.find((item) => item.context === contextId) ?? contexts[0];
        const variants = eligibleVariants(context, state);
        if (variants.length === 0) {
          const gates = context.variants.map((variant) => {
            const requirements = variant.requires?.join(',') || 'none';
            const exclusions = variant.excludes?.join(',') || 'none';
            return `${variant.id}(requires=${requirements}; excludes=${exclusions}; context=${variant.requiresContext ?? 'none'})`;
          }).join(', ');
          diagnostics.push({
            code: 'NO_ELIGIBLE_RESPONSE',
            fingerprint: createStateFingerprint(state),
            message: `${question.id}/${characterId} is reachable but all response variants are ineligible in context ${contextId}: ${gates}.`,
          });
          continue;
        }
        for (const variant of variants) {
          actions.push({ type: 'ask', questionId: question.id, characterId, responseVariantId: variant.id });
        }
      }
    }
  }
  for (const deduction of evaluateDeductions(caseFile, state).available) {
    if (!(state.understoodDeductionIds ?? []).includes(deduction.id)) {
      actions.push({ type: 'claimDeduction', deductionId: deduction.id });
    }
  }
  return actions;
}

/**
 * Explores every currently eligible response variant, rather than only the
 * deterministic weighted pick, so an unfavorable legal response cannot hide a
 * dead end. Each response is still resolved by the canonical turn transaction.
 */
export function validateCaseReachability(
  caseFile: CaseFile,
  options: StateSpaceValidationOptions = {},
): StateSpaceValidationResult {
  const maxStates = options.maxStates ?? 10_000;
  const queue = [createInitialPlayerState(caseFile, options.sessionSeed ?? 0)];
  const seen = new Set<string>();
  const facts = new Set<string>();
  const questions = new Set<string>();
  const deductions = new Set<string>();
  const deadEnds: DeadEndDiagnostic[] = [];
  const diagnostics: ValidationDiagnostic[] = [];
  let complete = true;

  while (queue.length > 0) {
    const state = queue.shift()!;
    const fingerprint = createStateFingerprint(state);
    if (seen.has(fingerprint)) continue;
    if (seen.size >= maxStates) {
      complete = false;
      diagnostics.push({ code: 'EXPLORATION_CAP_REACHED', message: `Exploration stopped at the ${maxStates}-state safety cap.` });
      break;
    }
    seen.add(fingerprint);
    state.discoveredFactIds.forEach((id) => facts.add(id));
    (state.understoodDeductionIds ?? []).forEach((id) => deductions.add(id));

    const actions = actionsFor(caseFile, state, diagnostics);
    for (const action of actions) {
      if (action.type === 'ask') {
        questions.add(action.questionId!);
        queue.push(executeTurn(
          caseFile, state, action.characterId!, action.questionId!, action.responseVariantId!,
        ).state);
      } else {
        queue.push(claimDeduction(caseFile, state, action.deductionId!));
      }
    }
    const missing = criticalFactIds(caseFile).filter((id) => !state.discoveredFactIds.includes(id));
    if (actions.length === 0 && missing.length > 0) {
      deadEnds.push({ fingerprint, missingCriticalFactIds: missing });
    }
  }

  const allFacts = (caseFile.facts ?? []).map((fact) => fact.id);
  const allQuestions = caseFile.questions.map((question) => question.id);
  const allDeductions = (caseFile.deductions ?? []).map((deduction) => deduction.id);
  const unreachableCritical = criticalFactIds(caseFile).filter((id) => !facts.has(id));
  for (const id of unreachableCritical) {
    diagnostics.push({
      code: 'UNREACHABLE_CRITICAL_FACT',
      message: `Critical fact ${id} is unreachable in all explored legal states.`,
    });
  }
  const accusationReady = caseFile.playerRules.accusationAvailableAtAnyTime
    ? seen.size > 0 && caseFile.accusation.dimensions.length > 0
    : null;
  if (accusationReady === null) {
    diagnostics.push({
      code: 'ACCUSATION_READINESS_UNDEFINED',
      message: 'The current schema has no investigation-state accusation readiness requirement to validate.',
    });
  }
  const uniqueDiagnostics = [...new Map(diagnostics.map((item) => [
    `${item.code}:${item.fingerprint ?? ''}:${item.message}`, item,
  ])).values()];
  return {
    valid: complete && unreachableCritical.length === 0 && deadEnds.length === 0,
    complete,
    reachableStateCount: seen.size,
    reachableFactIds: sorted([...facts]),
    unreachableFactIds: allFacts.filter((id) => !facts.has(id)).sort(),
    reachableQuestionIds: sorted([...questions]),
    unreachableQuestionIds: allQuestions.filter((id) => !questions.has(id)).sort(),
    reachableDeductionIds: sorted([...deductions]),
    unreachableDeductionIds: allDeductions.filter((id) => !deductions.has(id)).sort(),
    deadEndStates: deadEnds,
    accusationReady,
    diagnostics: uniqueDiagnostics,
  };
}
