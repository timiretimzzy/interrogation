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

export interface UnsafeStateDiagnostic {
  fingerprint: string;
  missingCriticalFactIds: string[];
  missingEvidenceIds: string[];
  missingDeductionIds: string[];
  availableActions: StateSpaceAction[];
  reason: 'NO_LEGAL_ACTIONS' | 'ACTION_ECONOMY_EXHAUSTED' | 'NO_PATH_TO_SOLUTION';
}

export interface ValidationDiagnostic {
  code: 'NO_ELIGIBLE_RESPONSE' | 'UNREACHABLE_CRITICAL_FACT' | 'EXPLORATION_CAP_REACHED' | 'NO_SOLUTION_PATH' | 'UNSAFE_PROGRESSION_STATE';
  message: string;
  fingerprint?: string;
}

export interface StateSpaceValidationResult {
  /** Compatibility summary: true only when exploration is complete and universally safe. */
  valid: boolean;
  explorationComplete: boolean;
  solutionPathFound: boolean;
  existentialSolvabilityCertified: boolean | 'unknown';
  universalProgressionSafety: boolean | 'unknown';
  reachableStateCount: number;
  reachableFactIds: string[];
  unreachableFactIds: string[];
  reachableQuestionIds: string[];
  unreachableQuestionIds: string[];
  reachableDeductionIds: string[];
  unreachableDeductionIds: string[];
  unsafeStates: UnsafeStateDiagnostic[];
  diagnostics: ValidationDiagnostic[];
}

export interface StateSpaceValidationOptions {
  maxStates?: number;
  sessionSeed?: number;
}

interface ProgressionState {
  facts: string[];
  clues: string[];
  evidence: string[];
  statements: string[];
  asked: string[];
  unlocked: string[];
  contradictions: string[];
  flagged: string[];
  contexts: string[];
  understood: string[];
  availableDeductions: string[];
  actionsRemaining: number;
  status: PlayerState['status'];
}

const sorted = (values: readonly string[]) => [...new Set(values)].sort();

/**
 * This is the complete future-relevant projection of PlayerState. Each field
 * changes eligibility, question repeatability, effects, or solution readiness;
 * transcript text, sequence, seed, theory, notes, and UI-only data do not.
 */
function toProgressionState(state: PlayerState): ProgressionState {
  return {
    facts: sorted(state.discoveredFactIds),
    clues: sorted(state.discoveredClues),
    evidence: sorted(state.discoveredEvidence),
    statements: sorted(state.recordedStatements),
    asked: sorted(Object.entries(state.interrogations)
      .flatMap(([characterId, records]) => records.map((record) => `${characterId}:${record.questionId}`))),
    unlocked: sorted(state.unlockedQuestions),
    contradictions: sorted(state.activeContradictions),
    flagged: sorted(state.flaggedContradictions),
    contexts: sorted(state.contextSwitches),
    understood: sorted(state.understoodDeductionIds ?? []),
    availableDeductions: sorted(state.availableDeductionIds ?? []),
    actionsRemaining: state.actionsRemaining,
    status: state.status,
  };
}

export function createStateFingerprint(state: PlayerState): string {
  return JSON.stringify(toProgressionState(state));
}

function hasAsked(state: PlayerState, characterId: CharacterId, questionId: string): boolean {
  return (state.interrogations[characterId] ?? []).some((record) => record.questionId === questionId);
}

function criticalFactIds(caseFile: CaseFile): string[] {
  return caseFile.criticalFactIds ?? (caseFile.facts ?? [])
    .filter((fact) => fact.critical || fact.tier === 'A')
    .map((fact) => fact.id);
}

function requiredEvidenceIds(caseFile: CaseFile): string[] {
  return sorted((caseFile.solutionClaims ?? []).flatMap((claim) => claim.requiredEvidenceIds));
}

function requiredDeductionIds(caseFile: CaseFile): string[] {
  return sorted((caseFile.deductions ?? [])
    .filter((deduction) => deduction.surface === 'player_triggered')
    .map((deduction) => deduction.id));
}

function isSolutionReady(caseFile: CaseFile, state: PlayerState): boolean {
  const factsReady = criticalFactIds(caseFile).every((id) => state.discoveredFactIds.includes(id));
  const evidenceReady = requiredEvidenceIds(caseFile).every((id) => state.discoveredEvidence.includes(id));
  const deductionsReady = requiredDeductionIds(caseFile)
    .every((id) => (state.understoodDeductionIds ?? []).includes(id));
  return factsReady && evidenceReady && deductionsReady;
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
          diagnostics.push({
            code: 'NO_ELIGIBLE_RESPONSE',
            fingerprint: createStateFingerprint(state),
            message: `${question.id}/${characterId} is reachable but has no eligible response in context ${contextId}.`,
          });
          continue;
        }
        variants.forEach((variant) => actions.push({
          type: 'ask', questionId: question.id, characterId, responseVariantId: variant.id,
        }));
      }
    }
  }
  evaluateDeductions(caseFile, state).available.forEach((deduction) => {
    if (!(state.understoodDeductionIds ?? []).includes(deduction.id)) {
      actions.push({ type: 'claimDeduction', deductionId: deduction.id });
    }
  });
  return actions;
}

function missingRequirements(caseFile: CaseFile, state: PlayerState) {
  return {
    missingCriticalFactIds: criticalFactIds(caseFile).filter((id) => !state.discoveredFactIds.includes(id)),
    missingEvidenceIds: requiredEvidenceIds(caseFile).filter((id) => !state.discoveredEvidence.includes(id)),
    missingDeductionIds: requiredDeductionIds(caseFile).filter((id) => !(state.understoodDeductionIds ?? []).includes(id)),
  };
}

/**
 * Enumerates every eligible authored outcome through the canonical transaction.
 * A found solution proves existence even in a capped search; only a complete
 * graph can certify unsolvability or universal progression safety.
 */
export function validateCaseReachability(
  caseFile: CaseFile,
  options: StateSpaceValidationOptions = {},
): StateSpaceValidationResult {
  const maxStates = options.maxStates ?? 10_000;
  const initial = createInitialPlayerState(caseFile, options.sessionSeed ?? 0);
  const queue = [initial];
  const states = new Map<string, PlayerState>();
  const forward = new Map<string, Set<string>>();
  const reverse = new Map<string, Set<string>>();
  const facts = new Set<string>();
  const questions = new Set<string>();
  const deductions = new Set<string>();
  const diagnostics: ValidationDiagnostic[] = [];
  let explorationComplete = true;

  while (queue.length > 0) {
    const state = queue.shift()!;
    const fingerprint = createStateFingerprint(state);
    if (states.has(fingerprint)) continue;
    if (states.size >= maxStates) {
      explorationComplete = false;
      diagnostics.push({ code: 'EXPLORATION_CAP_REACHED', message: `Exploration stopped at the ${maxStates}-state safety cap.` });
      break;
    }
    states.set(fingerprint, state);
    forward.set(fingerprint, new Set());
    state.discoveredFactIds.forEach((id) => facts.add(id));
    (state.understoodDeductionIds ?? []).forEach((id) => deductions.add(id));

    for (const action of actionsFor(caseFile, state, diagnostics)) {
      let next: PlayerState;
      if (action.type === 'ask') {
        questions.add(action.questionId!);
        next = executeTurn(caseFile, state, action.characterId!, action.questionId!, action.responseVariantId!).state;
      } else {
        next = claimDeduction(caseFile, state, action.deductionId!);
      }
      const nextFingerprint = createStateFingerprint(next);
      forward.get(fingerprint)!.add(nextFingerprint);
      const predecessors = reverse.get(nextFingerprint) ?? new Set<string>();
      predecessors.add(fingerprint);
      reverse.set(nextFingerprint, predecessors);
      if (!states.has(nextFingerprint)) queue.push(next);
    }
  }

  const solutionStates = [...states].filter(([, state]) => isSolutionReady(caseFile, state)).map(([id]) => id);
  const solutionPathFound = solutionStates.length > 0;
  const canReachSolution = new Set(solutionStates);
  const backwardQueue = [...solutionStates];
  while (backwardQueue.length > 0) {
    const node = backwardQueue.shift()!;
    for (const predecessor of reverse.get(node) ?? []) {
      if (!canReachSolution.has(predecessor)) {
        canReachSolution.add(predecessor);
        backwardQueue.push(predecessor);
      }
    }
  }

  const unsafeStates: UnsafeStateDiagnostic[] = [];
  if (explorationComplete) {
    for (const [fingerprint, state] of states) {
      if (isSolutionReady(caseFile, state) || canReachSolution.has(fingerprint)) continue;
      const availableActions = actionsFor(caseFile, state, []);
      const reason = availableActions.length === 0
        ? state.actionsRemaining <= 0 ? 'ACTION_ECONOMY_EXHAUSTED' : 'NO_LEGAL_ACTIONS'
        : 'NO_PATH_TO_SOLUTION';
      unsafeStates.push({ fingerprint, ...missingRequirements(caseFile, state), availableActions, reason });
      diagnostics.push({
        code: 'UNSAFE_PROGRESSION_STATE',
        fingerprint,
        message: `Reachable state cannot reach solution readiness (${reason}).`,
      });
    }
  }

  const allFacts = (caseFile.facts ?? []).map((fact) => fact.id);
  const allQuestions = caseFile.questions.map((question) => question.id);
  const allDeductions = (caseFile.deductions ?? []).map((deduction) => deduction.id);
  criticalFactIds(caseFile).filter((id) => !facts.has(id)).forEach((id) => diagnostics.push({
    code: 'UNREACHABLE_CRITICAL_FACT', message: `Critical fact ${id} is unreachable in explored states.`,
  }));
  if (explorationComplete && !solutionPathFound) {
    diagnostics.push({ code: 'NO_SOLUTION_PATH', message: 'No reachable state satisfies the mechanical solution requirements.' });
  }
  const uniqueDiagnostics = [...new Map(diagnostics.map((item) => [
    `${item.code}:${item.fingerprint ?? ''}:${item.message}`, item,
  ])).values()];
  return {
    valid: explorationComplete && solutionPathFound && unsafeStates.length === 0,
    explorationComplete,
    solutionPathFound,
    existentialSolvabilityCertified: explorationComplete ? solutionPathFound : 'unknown',
    universalProgressionSafety: explorationComplete ? unsafeStates.length === 0 : 'unknown',
    reachableStateCount: states.size,
    reachableFactIds: sorted([...facts]),
    unreachableFactIds: allFacts.filter((id) => !facts.has(id)).sort(),
    reachableQuestionIds: sorted([...questions]),
    unreachableQuestionIds: allQuestions.filter((id) => !questions.has(id)).sort(),
    reachableDeductionIds: sorted([...deductions]),
    unreachableDeductionIds: allDeductions.filter((id) => !deductions.has(id)).sort(),
    unsafeStates,
    diagnostics: uniqueDiagnostics,
  };
}
