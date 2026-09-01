import { claimDeduction } from './deductionEngine.ts';
import { executeTurn } from './turnEngine.ts';
import {
  createStateFingerprint,
  isSolutionReady,
  legalProgressionActions,
} from './stateSpaceValidator.ts';
import { createInitialPlayerState } from './types.ts';
import type { CaseFile, PlayerState } from './types.ts';
import type { StateSpaceAction } from './stateSpaceValidator.ts';

export type SimulationPolicyId = 'tunnel-vision' | 'completionist' | 'minimalist' | 'contrarian' | 'random-legal';
export type SimulationTermination = 'ACCUSATION_READY' | 'NO_LEGAL_ACTIONS' | 'REPEATED_PROGRESSION_STATE' | 'ACTION_BUDGET_EXCEEDED';
export type SimulationFindingCode =
  | 'TUNNEL_VISION_NARROW_PROGRESS' | 'TUNNEL_VISION_FAILED_TO_RECONNECT'
  | 'COMPLETIONIST_EXCESSIVE_POST_READINESS' | 'MINIMALIST_PREMATURE_READINESS'
  | 'CONTRARIAN_STRANDED_LEAD' | 'RANDOM_PATH_STALL'
  | 'ACTION_BUDGET_EXCEEDED' | 'REPEATED_PROGRESSION_STATE';

export interface SimulationDecisionContext {
  caseFile: CaseFile;
  state: PlayerState;
  legalActions: StateSpaceAction[];
  step: number;
  focusedCharacterId?: string;
  recentCharacterId?: string;
}
export interface SimulationPolicy {
  id: SimulationPolicyId;
  selectAction(context: SimulationDecisionContext): { action: StateSpaceAction; reason: string } | undefined;
}
export interface SimulationStep {
  step: number;
  action: StateSpaceAction;
  reason: string;
  availableActionCount: number;
  fingerprintBefore: string;
  fingerprintAfter: string;
  discoveries: string[];
  deductions: string[];
  accusationReadinessChanged: boolean;
}
export interface SimulationFinding {
  code: SimulationFindingCode;
  message: string;
  actionPath: StateSpaceAction[];
  finalFingerprint: string;
  seed: number;
}
export interface SimulationResult {
  policyId: SimulationPolicyId;
  seed: number;
  steps: SimulationStep[];
  termination: SimulationTermination;
  firstReadinessStep?: number;
  finalFingerprint: string;
  focusedCharacterId?: string;
  distinctCharacterCount: number;
  focusedActionCount: number;
  actionsAfterReadiness: number;
  findings: SimulationFinding[];
}
export interface SimulationConfig {
  seed?: number;
  actionBudget?: number;
  stopAtReadiness?: boolean;
  initialState?: PlayerState;
}
export interface RandomSimulationSummary {
  runs: SimulationResult[];
  seeds: number[];
  readinessRate: number;
  averageActionsToReadiness?: number;
  terminationCounts: Record<SimulationTermination, number>;
}

const actionKey = (action: StateSpaceAction) => action.type === 'ask'
  ? `ask:${action.questionId}:${action.characterId}:${action.responseVariantId}`
  : `deduction:${action.deductionId}`;
const ordered = (actions: StateSpaceAction[]) => [...actions].sort((a, b) => actionKey(a).localeCompare(actionKey(b)));
const questionFor = (caseFile: CaseFile, action: StateSpaceAction) => caseFile.questions.find((question) => question.id === action.questionId);
const progressionScore = (caseFile: CaseFile, state: PlayerState, action: StateSpaceAction): number => {
  if (action.type === 'claimDeduction') return 4;
  const variant = questionFor(caseFile, action)?.responses[action.characterId!]
    ?.flatMap((context) => context.variants).find((item) => item.id === action.responseVariantId);
  return (variant?.discloses?.filter((item) => !state.discoveredFactIds.includes(item.factId)).length ?? 0) * 4
    + (variant?.reveals?.filter((id) => !state.discoveredClues.includes(id) && !state.discoveredEvidence.includes(id)).length ?? 0) * 3
    + (variant?.unlocks?.filter((id) => !state.unlockedQuestions.includes(id)).length ?? 0) * 2
    + (variant?.createsContradiction ? 2 : 0) + (variant?.leadResolution ? 1 : 0);
};
function ranked(context: SimulationDecisionContext, score: (action: StateSpaceAction) => number) {
  return ordered(context.legalActions).sort((a, b) => score(b) - score(a) || actionKey(a).localeCompare(actionKey(b)))[0];
}
function focus(context: SimulationDecisionContext): string | undefined {
  return context.focusedCharacterId ?? ordered(context.legalActions).find((action) => action.type === 'ask')?.characterId;
}

export const simulationPolicies: Record<SimulationPolicyId, SimulationPolicy> = {
  'tunnel-vision': {
    id: 'tunnel-vision',
    selectAction(context) {
      const target = focus(context);
      const action = ranked(context, (candidate) => progressionScore(context.caseFile, context.state, candidate)
        + (candidate.type === 'ask' && candidate.characterId === target ? 10 : 0));
      return action ? { action, reason: `prioritizes focus target ${target ?? 'none'} then immediate progression` } : undefined;
    },
  },
  completionist: {
    id: 'completionist',
    selectAction(context) {
      const action = ranked(context, (candidate) => progressionScore(context.caseFile, context.state, candidate));
      return action ? { action, reason: 'exhausts legal unasked actions before stopping' } : undefined;
    },
  },
  minimalist: {
    id: 'minimalist',
    selectAction(context) {
      const action = ranked(context, (candidate) => progressionScore(context.caseFile, context.state, candidate));
      return action ? { action, reason: 'maximizes immediate authored progression' } : undefined;
    },
  },
  contrarian: {
    id: 'contrarian',
    selectAction(context) {
      const action = ranked(context, (candidate) => progressionScore(context.caseFile, context.state, candidate)
        + (candidate.type === 'ask' && candidate.characterId !== context.recentCharacterId ? 5 : 0)
        + (candidate.type === 'ask' && candidate.characterId !== context.focusedCharacterId ? 2 : 0));
      return action ? { action, reason: 'prefers a different target from recent and focused investigation' } : undefined;
    },
  },
  'random-legal': {
    id: 'random-legal',
    selectAction(context) {
      const values = ordered(context.legalActions);
      if (!values.length) return undefined;
      const seed = hash(`${context.caseFile.caseId}:${context.step}:${context.state.sessionSeed}`);
      return { action: values[seed % values.length], reason: 'seeded legal-action selection' };
    },
  },
};

function hash(value: string): number {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return result >>> 0;
}

export function simulatePlaythrough(caseFile: CaseFile, policyId: SimulationPolicyId, config: SimulationConfig = {}): SimulationResult {
  const policy = simulationPolicies[policyId];
  const seed = config.seed ?? 0;
  const budget = config.actionBudget ?? caseFile.playerRules.investigationActions;
  const stopAtReadiness = config.stopAtReadiness ?? policyId === 'minimalist';
  let state = config.initialState ?? createInitialPlayerState(caseFile, seed);
  const steps: SimulationStep[] = []; const seen = new Set<string>(); let firstReadinessStep: number | undefined;
  const focusedCharacterId = focus({ caseFile, state, legalActions: legalProgressionActions(caseFile, state), step: 0 });
  let termination: SimulationTermination = 'NO_LEGAL_ACTIONS';
  while (steps.length < budget) {
    const before = createStateFingerprint(state);
    if (seen.has(before)) { termination = 'REPEATED_PROGRESSION_STATE'; break; }
    seen.add(before);
    const ready = isSolutionReady(caseFile, state);
    if (ready && firstReadinessStep === undefined) firstReadinessStep = steps.length;
    if (ready && stopAtReadiness) { termination = 'ACCUSATION_READY'; break; }
    const legalActions = legalProgressionActions(caseFile, state);
    const choice = policy.selectAction({ caseFile, state, legalActions, step: steps.length, focusedCharacterId, recentCharacterId: steps.at(-1)?.action.characterId });
    if (!choice) { termination = 'NO_LEGAL_ACTIONS'; break; }
    const next = choice.action.type === 'ask'
      ? executeTurn(caseFile, state, choice.action.characterId!, choice.action.questionId!, choice.action.responseVariantId!).state
      : claimDeduction(caseFile, state, choice.action.deductionId!);
    const after = createStateFingerprint(next);
    steps.push({ step: steps.length, action: choice.action, reason: choice.reason, availableActionCount: legalActions.length, fingerprintBefore: before, fingerprintAfter: after,
      discoveries: [...next.discoveredFactIds.filter((id) => !state.discoveredFactIds.includes(id)), ...next.discoveredClues.filter((id) => !state.discoveredClues.includes(id)), ...next.discoveredEvidence.filter((id) => !state.discoveredEvidence.includes(id))],
      deductions: (next.understoodDeductionIds ?? []).filter((id) => !(state.understoodDeductionIds ?? []).includes(id)),
      accusationReadinessChanged: !ready && isSolutionReady(caseFile, next) });
    state = next;
  }
  if (steps.length >= budget && termination === 'NO_LEGAL_ACTIONS') termination = 'ACTION_BUDGET_EXCEEDED';
  if (isSolutionReady(caseFile, state) && firstReadinessStep === undefined) firstReadinessStep = steps.length;
  const finalFingerprint = createStateFingerprint(state);
  const targets = new Set(steps.map((step) => step.action.characterId).filter(Boolean));
  const focusedActionCount = steps.filter((step) => step.action.characterId === focusedCharacterId).length;
  const findings: SimulationFinding[] = [];
  const add = (code: SimulationFindingCode, message: string) => findings.push({ code, message, actionPath: steps.map((step) => step.action), finalFingerprint, seed });
  if (termination === 'ACTION_BUDGET_EXCEEDED') add('ACTION_BUDGET_EXCEEDED', `Simulation exhausted its configured ${budget}-action budget.`);
  if (termination === 'REPEATED_PROGRESSION_STATE') add('REPEATED_PROGRESSION_STATE', 'Simulation revisited an identical progression state.');
  if (policyId === 'tunnel-vision' && steps.length && focusedActionCount / steps.length >= 0.75 && targets.size < 2) add('TUNNEL_VISION_NARROW_PROGRESS', `Focused target consumed ${focusedActionCount}/${steps.length} actions without a second target.`);
  if (policyId === 'tunnel-vision' && !firstReadinessStep && termination !== 'ACCUSATION_READY') add('TUNNEL_VISION_FAILED_TO_RECONNECT', 'Focused route did not reach accusation readiness.');
  if (policyId === 'completionist' && firstReadinessStep !== undefined && steps.length - firstReadinessStep > 0) add('COMPLETIONIST_EXCESSIVE_POST_READINESS', `${steps.length - firstReadinessStep} actions occurred after first readiness.`);
  if (policyId === 'minimalist' && firstReadinessStep !== undefined && targets.size < 2) add('MINIMALIST_PREMATURE_READINESS', 'Readiness was reached after exploring fewer than two character targets.');
  if (policyId === 'contrarian' && !firstReadinessStep && termination !== 'ACCUSATION_READY') add('CONTRARIAN_STRANDED_LEAD', 'Alternative-first route did not reach accusation readiness.');
  if (policyId === 'random-legal' && !firstReadinessStep && termination === 'NO_LEGAL_ACTIONS') add('RANDOM_PATH_STALL', 'Seeded legal path ended before accusation readiness.');
  return { policyId, seed, steps, termination, firstReadinessStep, finalFingerprint, focusedCharacterId, distinctCharacterCount: targets.size, focusedActionCount, actionsAfterReadiness: firstReadinessStep === undefined ? 0 : steps.length - firstReadinessStep, findings };
}

export function simulateRandomLegal(caseFile: CaseFile, seeds: number[], config: Omit<SimulationConfig, 'seed'> = {}): RandomSimulationSummary {
  const runs = seeds.map((seed) => simulatePlaythrough(caseFile, 'random-legal', { ...config, seed }));
  const ready = runs.filter((run) => run.firstReadinessStep !== undefined);
  return { runs, seeds, readinessRate: runs.length ? ready.length / runs.length : 0,
    averageActionsToReadiness: ready.length ? ready.reduce((sum, run) => sum + run.firstReadinessStep!, 0) / ready.length : undefined,
    terminationCounts: Object.fromEntries(['ACCUSATION_READY', 'NO_LEGAL_ACTIONS', 'REPEATED_PROGRESSION_STATE', 'ACTION_BUDGET_EXCEEDED'].map((reason) => [reason, runs.filter((run) => run.termination === reason).length])) as Record<SimulationTermination, number> };
}
