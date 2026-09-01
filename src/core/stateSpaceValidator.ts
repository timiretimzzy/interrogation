import { claimDeduction, evaluateDeductions } from './deductionEngine.ts';
import { isQuestionAvailable } from './gating.ts';
import { eligibleVariants, resolveActiveContext } from './responseSelector.ts';
import { executeTurn } from './turnEngine.ts';
import { createInitialPlayerState } from './types.ts';
import type { CaseFile, CharacterId, PlayerState, ResponseVariant } from './types.ts';

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

export type ValidationDiagnosticCode =
  | 'NO_ELIGIBLE_RESPONSE' | 'UNREACHABLE_CRITICAL_FACT' | 'EXPLORATION_CAP_REACHED'
  | 'NO_SOLUTION_PATH' | 'UNSAFE_PROGRESSION_STATE' | 'LEAD_NO_MEANINGFUL_OUTCOME'
  | 'LEAD_PROGRESSION_UNREACHABLE' | 'LEAD_STRANDED' | 'FALSE_LEAD_UNCLOSED'
  | 'OBSOLETE_WITHOUT_CLOSURE' | 'PREMATURE_DISCLOSURE' | 'SOLUTION_SHORTCUT';

export interface ValidationDiagnostic {
  code: ValidationDiagnosticCode;
  message: string;
  fingerprint?: string;
  leadId?: string;
  revelationId?: string;
  missingRequirements?: string[];
  action?: StateSpaceAction;
  path?: StateSpaceAction[];
}

export interface StateSpaceValidationResult {
  valid: boolean;
  explorationComplete: boolean;
  solutionPathFound: boolean;
  existentialSolvabilityCertified: boolean | 'unknown';
  universalProgressionSafety: boolean | 'unknown';
  leadLifecycleSafety: boolean | 'unknown';
  disclosureSafety: boolean | 'unknown';
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
  facts: string[]; clues: string[]; evidence: string[]; statements: string[]; asked: string[];
  unlocked: string[]; contradictions: string[]; flagged: string[]; contexts: string[];
  understood: string[]; availableDeductions: string[]; actionsRemaining: number; status: PlayerState['status'];
}
interface Edge { from: string; to: string; action: StateSpaceAction; variant?: ResponseVariant; meaningful: boolean; }

const sorted = (values: readonly string[]) => [...new Set(values)].sort();
function toProgressionState(state: PlayerState): ProgressionState {
  return {
    facts: sorted(state.discoveredFactIds), clues: sorted(state.discoveredClues), evidence: sorted(state.discoveredEvidence),
    statements: sorted(state.recordedStatements),
    asked: sorted(Object.entries(state.interrogations).flatMap(([characterId, records]) => records.map((record) => `${characterId}:${record.questionId}`))),
    unlocked: sorted(state.unlockedQuestions), contradictions: sorted(state.activeContradictions),
    flagged: sorted(state.flaggedContradictions), contexts: sorted(state.contextSwitches),
    understood: sorted(state.understoodDeductionIds ?? []), availableDeductions: sorted(state.availableDeductionIds ?? []),
    actionsRemaining: state.actionsRemaining, status: state.status,
  };
}
export function createStateFingerprint(state: PlayerState): string { return JSON.stringify(toProgressionState(state)); }
function hasAsked(state: PlayerState, characterId: CharacterId, questionId: string): boolean {
  return (state.interrogations[characterId] ?? []).some((record) => record.questionId === questionId);
}
function criticalFactIds(caseFile: CaseFile): string[] {
  return caseFile.criticalFactIds ?? (caseFile.facts ?? []).filter((fact) => fact.critical || fact.tier === 'A').map((fact) => fact.id);
}
function requiredEvidenceIds(caseFile: CaseFile): string[] {
  return sorted((caseFile.solutionClaims ?? []).flatMap((claim) => claim.requiredEvidenceIds));
}
function requiredDeductionIds(caseFile: CaseFile): string[] {
  return sorted((caseFile.deductions ?? []).filter((deduction) => deduction.surface === 'player_triggered').map((deduction) => deduction.id));
}
export function isSolutionReady(caseFile: CaseFile, state: PlayerState): boolean {
  return criticalFactIds(caseFile).every((id) => state.discoveredFactIds.includes(id))
    && requiredEvidenceIds(caseFile).every((id) => state.discoveredEvidence.includes(id))
    && requiredDeductionIds(caseFile).every((id) => (state.understoodDeductionIds ?? []).includes(id));
}
export function legalProgressionActions(caseFile: CaseFile, state: PlayerState, diagnostics: ValidationDiagnostic[] = []): StateSpaceAction[] {
  const actions: StateSpaceAction[] = [];
  if (state.actionsRemaining > 0) for (const question of caseFile.questions) {
    if (!isQuestionAvailable(caseFile, state, question.id)) continue;
    for (const characterId of question.targetCharacterIds) {
      if (hasAsked(state, characterId, question.id)) continue;
      const contexts = question.responses[characterId] ?? [];
      if (contexts.length === 0) continue;
      const contextId = resolveActiveContext(state, contexts);
      const context = contexts.find((item) => item.context === contextId) ?? contexts[0];
      const variants = eligibleVariants(context, state);
      if (variants.length === 0) {
        diagnostics.push({ code: 'NO_ELIGIBLE_RESPONSE', fingerprint: createStateFingerprint(state), message: `${question.id}/${characterId} is reachable but has no eligible response in context ${contextId}.` });
        continue;
      }
      variants.forEach((variant) => actions.push({ type: 'ask', questionId: question.id, characterId, responseVariantId: variant.id }));
    }
  }
  evaluateDeductions(caseFile, state).available.forEach((deduction) => {
    if (!(state.understoodDeductionIds ?? []).includes(deduction.id)) actions.push({ type: 'claimDeduction', deductionId: deduction.id });
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
function knownIds(state: PlayerState): Set<string> {
  return new Set([...state.discoveredFactIds, ...state.discoveredClues, ...state.discoveredEvidence, ...state.recordedStatements,
    ...state.unlockedQuestions, ...state.activeContradictions, ...state.flaggedContradictions, ...state.contextSwitches,
    ...(state.understoodDeductionIds ?? []), ...(state.availableDeductionIds ?? [])]);
}
function meaningfulTransition(before: PlayerState, after: PlayerState, variant?: ResponseVariant): boolean {
  if (variant?.leadResolution) return true;
  const fields: (keyof PlayerState)[] = ['discoveredFactIds', 'discoveredClues', 'discoveredEvidence', 'unlockedQuestions', 'activeContradictions', 'flaggedContradictions', 'understoodDeductionIds', 'availableDeductionIds'];
  return fields.some((field) => (after[field] as string[]).length > (before[field] as string[]).length);
}
function authoredProgression(questionId: string, caseFile: CaseFile): boolean {
  const question = caseFile.questions.find((item) => item.id === questionId)!;
  if ((question.reveals?.length ?? 0) > 0 || (question.unlocks?.length ?? 0) > 0) return true;
  return Object.values(question.responses).flat().flatMap((context) => context.variants).some((variant) =>
    (variant.discloses?.length ?? 0) > 0 || (variant.reveals?.length ?? 0) > 0 || (variant.unlocks?.length ?? 0) > 0
    || Boolean(variant.createsContradiction) || Boolean(variant.leadResolution));
}

export function validateCaseReachability(caseFile: CaseFile, options: StateSpaceValidationOptions = {}): StateSpaceValidationResult {
  const maxStates = options.maxStates ?? 10_000;
  const queue = [createInitialPlayerState(caseFile, options.sessionSeed ?? 0)];
  const states = new Map<string, PlayerState>(); const forward = new Map<string, Set<string>>(); const reverse = new Map<string, Set<string>>();
  const edges: Edge[] = []; const parents = new Map<string, { from: string; action: StateSpaceAction }>();
  const facts = new Set<string>(); const questions = new Set<string>(); const deductions = new Set<string>(); const diagnostics: ValidationDiagnostic[] = [];
  let explorationComplete = true;
  while (queue.length > 0) {
    const state = queue.shift()!; const fingerprint = createStateFingerprint(state);
    if (states.has(fingerprint)) continue;
    if (states.size >= maxStates) { explorationComplete = false; diagnostics.push({ code: 'EXPLORATION_CAP_REACHED', message: `Exploration stopped at the ${maxStates}-state safety cap.` }); break; }
    states.set(fingerprint, state); forward.set(fingerprint, new Set()); state.discoveredFactIds.forEach((id) => facts.add(id)); (state.understoodDeductionIds ?? []).forEach((id) => deductions.add(id));
    for (const action of legalProgressionActions(caseFile, state, diagnostics)) {
      const variant = action.type === 'ask'
        ? (caseFile.questions.find((q) => q.id === action.questionId)?.responses[action.characterId!]
          ?.flatMap((context) => context.variants).find((item) => item.id === action.responseVariantId))
        : undefined;
      if (action.type === 'ask') questions.add(action.questionId!);
      const next = action.type === 'ask'
        ? executeTurn(caseFile, state, action.characterId!, action.questionId!, action.responseVariantId!).state
        : claimDeduction(caseFile, state, action.deductionId!);
      const to = createStateFingerprint(next); forward.get(fingerprint)!.add(to); (reverse.get(to) ?? reverse.set(to, new Set()).get(to)!).add(fingerprint);
      edges.push({ from: fingerprint, to, action, variant, meaningful: meaningfulTransition(state, next, variant) });
      if (!states.has(to)) { queue.push(next); if (!parents.has(to)) parents.set(to, { from: fingerprint, action }); }
    }
  }
  const pathFor = (fingerprint: string): StateSpaceAction[] => {
    const path: StateSpaceAction[] = []; let current = fingerprint;
    while (parents.has(current)) { const parent = parents.get(current)!; path.unshift(parent.action); current = parent.from; }
    return path;
  };
  const solutionStates = [...states].filter(([, state]) => isSolutionReady(caseFile, state)).map(([id]) => id);
  const solutionPathFound = solutionStates.length > 0;
  const canReachSolution = new Set(solutionStates); const backwardQueue = [...solutionStates];
  while (backwardQueue.length) {
    for (const predecessor of reverse.get(backwardQueue.shift()!) ?? []) {
      if (!canReachSolution.has(predecessor)) {
        canReachSolution.add(predecessor);
        backwardQueue.push(predecessor);
      }
    }
  }
  const unsafeStates: UnsafeStateDiagnostic[] = [];
  if (explorationComplete) for (const [fingerprint, state] of states) if (!isSolutionReady(caseFile, state) && !canReachSolution.has(fingerprint)) {
    const availableActions = legalProgressionActions(caseFile, state, []); const reason = availableActions.length === 0 ? state.actionsRemaining <= 0 ? 'ACTION_ECONOMY_EXHAUSTED' : 'NO_LEGAL_ACTIONS' : 'NO_PATH_TO_SOLUTION';
    unsafeStates.push({ fingerprint, ...missingRequirements(caseFile, state), availableActions, reason });
    diagnostics.push({ code: 'UNSAFE_PROGRESSION_STATE', fingerprint, message: `Reachable state cannot reach solution readiness (${reason}).`, path: pathFor(fingerprint) });
  }
  if (explorationComplete) {
    const actionEdges = edges.filter((edge) => edge.action.type === 'ask');
    for (const question of caseFile.questions) {
      const leadEdges = actionEdges.filter((edge) => edge.action.questionId === question.id);
      const reachableButUnaskable = [...states.entries()].find(([, state]) =>
        state.actionsRemaining > 0 && isQuestionAvailable(caseFile, state, question.id)
          && question.targetCharacterIds.some((characterId) => !hasAsked(state, characterId, question.id)));
      if (leadEdges.length === 0) {
        if (reachableButUnaskable && authoredProgression(question.id, caseFile)) {
          diagnostics.push({ code: 'LEAD_PROGRESSION_UNREACHABLE', leadId: question.id, fingerprint: reachableButUnaskable[0], path: pathFor(reachableButUnaskable[0]), message: `Lead ${question.id} is reachable, but no authored progression response is eligible.` });
        }
        continue;
      }
      const meaningful = leadEdges.some((edge) => edge.meaningful);
      if (!meaningful) diagnostics.push({ code: authoredProgression(question.id, caseFile) ? 'LEAD_PROGRESSION_UNREACHABLE' : 'LEAD_NO_MEANINGFUL_OUTCOME', leadId: question.id, fingerprint: leadEdges[0].from, action: leadEdges[0].action, path: pathFor(leadEdges[0].from), message: `Lead ${question.id} has no reachable meaningful outcome${authoredProgression(question.id, caseFile) ? ' although authored progression exists' : ''}.` });
      const closureStarts = new Set(edges.filter((edge) => edge.variant?.leadResolution?.leadIds.includes(question.id)).map((edge) => edge.from));
      const canReachClosure = new Set(closureStarts); const closureQueue = [...closureStarts];
      while (closureQueue.length) {
        for (const predecessor of reverse.get(closureQueue.shift()!) ?? []) {
          if (!canReachClosure.has(predecessor)) {
            canReachClosure.add(predecessor);
            closureQueue.push(predecessor);
          }
        }
      }
      const unresolved = leadEdges.filter((edge) => !edge.meaningful && !canReachClosure.has(edge.to));
      if (unresolved.length) {
        const edge = unresolved[0];
        diagnostics.push({ code: closureStarts.size ? 'LEAD_STRANDED' : 'FALSE_LEAD_UNCLOSED', leadId: question.id, fingerprint: edge.to, action: edge.action, path: [...pathFor(edge.from), edge.action], message: `Lead ${question.id} can be pursued without progression and has ${closureStarts.size ? 'a reachable stranded branch' : 'no explicit closure route'}.` });
      }
      for (const edge of edges.filter((edge) => edge.action.type === 'ask' && edge.action.questionId !== question.id)) {
        const before = states.get(edge.from)!; const after = states.get(edge.to)!;
        const wasActive = legalProgressionActions(caseFile, before, []).some((action) => action.type === 'ask' && action.questionId === question.id);
        const remainsActive = legalProgressionActions(caseFile, after, []).some((action) => action.type === 'ask' && action.questionId === question.id);
        const pursued = Object.values(before.interrogations).flat().some((record) => record.questionId === question.id);
        if (wasActive && !remainsActive && !pursued && after.actionsRemaining > 0 && !canReachClosure.has(edge.to)) diagnostics.push({ code: 'OBSOLETE_WITHOUT_CLOSURE', leadId: question.id, fingerprint: edge.to, action: edge.action, path: [...pathFor(edge.from), edge.action], message: `Lead ${question.id} becomes unavailable after an unrelated transition without an explicit closure route.` });
      }
    }
    const material = new Map<string, string[][]>();
    for (const item of [...(caseFile.facts ?? []), ...(caseFile.clues ?? []), ...(caseFile.evidence ?? [])]) material.set(item.id, item.disclosureRequirements ?? []);
    for (const edge of actionEdges) {
      const before = states.get(edge.from)!; const after = states.get(edge.to)!; const known = knownIds(before);
      const revealed = [...after.discoveredFactIds.filter((id) => !before.discoveredFactIds.includes(id)), ...after.discoveredClues.filter((id) => !before.discoveredClues.includes(id)), ...after.discoveredEvidence.filter((id) => !before.discoveredEvidence.includes(id))];
      for (const id of revealed) {
        const routes = material.get(id) ?? []; if (routes.length === 0 || routes.some((route) => route.every((requirement) => known.has(requirement)))) continue;
        const missing = routes
          .map((route) => route.filter((requirement) => !known.has(requirement)))
          .sort((a, b) => a.length - b.length)[0];
        diagnostics.push({ code: criticalFactIds(caseFile).includes(id) ? 'SOLUTION_SHORTCUT' : 'PREMATURE_DISCLOSURE', revelationId: id, missingRequirements: sorted(missing), fingerprint: edge.from, action: edge.action, path: [...pathFor(edge.from), edge.action], message: `${criticalFactIds(caseFile).includes(id) ? 'Solution-level information' : 'Information'} ${id} is disclosed before any authored foundation route is complete.` });
      }
    }
  }
  criticalFactIds(caseFile).filter((id) => !facts.has(id)).forEach((id) => diagnostics.push({ code: 'UNREACHABLE_CRITICAL_FACT', message: `Critical fact ${id} is unreachable in explored states.` }));
  if (explorationComplete && !solutionPathFound) diagnostics.push({ code: 'NO_SOLUTION_PATH', message: 'No reachable state satisfies the mechanical solution requirements.' });
  const uniqueDiagnostics = [...new Map(diagnostics.map((item) => [`${item.code}:${item.fingerprint ?? ''}:${item.message}`, item])).values()];
  const lifecycleDiagnostics = uniqueDiagnostics.filter((item) => ['LEAD_NO_MEANINGFUL_OUTCOME', 'LEAD_PROGRESSION_UNREACHABLE', 'LEAD_STRANDED', 'FALSE_LEAD_UNCLOSED', 'OBSOLETE_WITHOUT_CLOSURE'].includes(item.code));
  const disclosureDiagnostics = uniqueDiagnostics.filter((item) => item.code === 'PREMATURE_DISCLOSURE' || item.code === 'SOLUTION_SHORTCUT');
  return {
    valid: explorationComplete && solutionPathFound && unsafeStates.length === 0 && lifecycleDiagnostics.length === 0 && disclosureDiagnostics.length === 0,
    explorationComplete, solutionPathFound, existentialSolvabilityCertified: explorationComplete ? solutionPathFound : 'unknown',
    universalProgressionSafety: explorationComplete ? unsafeStates.length === 0 : 'unknown',
    leadLifecycleSafety: explorationComplete ? lifecycleDiagnostics.length === 0 : 'unknown',
    disclosureSafety: explorationComplete ? disclosureDiagnostics.length === 0 : 'unknown',
    reachableStateCount: states.size, reachableFactIds: sorted([...facts]), unreachableFactIds: (caseFile.facts ?? []).map((fact) => fact.id).filter((id) => !facts.has(id)).sort(),
    reachableQuestionIds: sorted([...questions]), unreachableQuestionIds: caseFile.questions.map((question) => question.id).filter((id) => !questions.has(id)).sort(),
    reachableDeductionIds: sorted([...deductions]), unreachableDeductionIds: (caseFile.deductions ?? []).map((deduction) => deduction.id).filter((id) => !deductions.has(id)).sort(),
    unsafeStates, diagnostics: uniqueDiagnostics,
  };
}
