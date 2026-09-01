import { applyActionCost } from './actionEconomy.ts';
import {
  activeConfrontationQuestions,
  computeActiveContradictions,
} from './contradictionEngine.ts';
import { evaluateDeductions } from './deductionEngine.ts';
import { isQuestionAvailable } from './gating.ts';
import { eligibleVariants, resolveActiveContext, selectResponse } from './responseSelector.ts';
import type { CaseFile, CharacterId, PlayerState, StatementId } from './types.ts';

export class TurnEngineError extends Error {}

function cloneState(state: PlayerState): PlayerState {
  return {
    ...state,
    interrogations: Object.fromEntries(
      Object.entries(state.interrogations).map(([k, v]) => [k, [...v]]),
    ),
    recordedStatements: [...state.recordedStatements],
    discoveredClues: [...state.discoveredClues],
    discoveredEvidence: [...state.discoveredEvidence],
    discoveredFactIds: [...state.discoveredFactIds],
    understoodDeductionIds: [...(state.understoodDeductionIds ?? [])],
    availableDeductionIds: [...(state.availableDeductionIds ?? [])],
    unlockedQuestions: [...state.unlockedQuestions],
    activeContradictions: [...state.activeContradictions],
    flaggedContradictions: [...state.flaggedContradictions],
    contextSwitches: [...state.contextSwitches],
    theory: state.theory ? { ...state.theory } : undefined,
    theoryBoard: state.theoryBoard ? { ...state.theoryBoard, citedEvidence: [...state.theoryBoard.citedEvidence] } : undefined,
    questionsAsked: state.questionsAsked ? [...state.questionsAsked] : [],
    recentTopics: state.recentTopics ? [...state.recentTopics] : [],
    closedLeads: state.closedLeads ? [...state.closedLeads] : [],
    accusation: state.accusation ? { ...state.accusation } : undefined,
  };
}

function addUnique<T>(arr: T[], ...items: T[]): T[] {
  const set = new Set(arr);
  for (const it of items) set.add(it);
  return [...set];
}

function statementIdFor(
  caseFile: CaseFile,
  characterId: CharacterId,
  questionId: string,
): StatementId | null {
  const stmt = (caseFile.statements ?? []).find(
    (s) => s.characterId === characterId && s.sourceQuestionId === questionId,
  );
  return stmt ? stmt.id : null;
}

export interface TurnResult {
  state: PlayerState;
  response: { id: string; text: string; contextId: string; kind?: string } | null;
  discoveries: string[];
  newlyAvailableQuestions: string[];
  newlyClosedQuestions: string[];
  contradictions: string[];
}

export function executeTurn(
  caseFile: CaseFile,
  state: PlayerState,
  characterId: CharacterId,
  questionId: string,
  responseVariantId?: string,
): TurnResult {
  const question = caseFile.questions.find((q) => q.id === questionId);
  if (!question) throw new TurnEngineError(`Unknown question: ${questionId}`);
  if (!question.targetCharacterIds.includes(characterId)) {
    throw new TurnEngineError(`Question ${questionId} cannot be asked of ${characterId}`);
  }
  if (!isQuestionAvailable(caseFile, state, questionId)) {
    throw new TurnEngineError(`Question ${questionId} is not available yet`);
  }

  const alreadyAsked = (state.interrogations[characterId] ?? []).some(
    (r) => r.questionId === questionId,
  );
  if (alreadyAsked) {
    throw new TurnEngineError(`Question ${questionId} was already asked of ${characterId}`);
  }
  if (state.actionsRemaining <= 0) {
    throw new TurnEngineError('No investigation actions remaining');
  }

  const selected = responseVariantId === undefined
    ? selectResponse(caseFile, state, characterId, questionId)
    : selectResponseVariant(caseFile, state, characterId, questionId, responseVariantId);
  if (!selected) {
    throw new TurnEngineError(`No eligible response for ${characterId}/${questionId}`);
  }

  const draft = cloneState(state);
  const seq = draft.conversationSeq ?? 0;
  const record = {
    questionId,
    variantId: selected.variant.id,
    text: selected.variant.text,
    contextId: selected.contextId,
    kind: selected.variant.kind ?? 'TRUTH',
    characterId,
    sequence: seq,
  };

  draft.interrogations = {
    ...draft.interrogations,
    [characterId]: [...(draft.interrogations[characterId] ?? []), record],
  };
  draft.conversationSeq = seq + 1;

  const sid = statementIdFor(caseFile, characterId, questionId);
  if (sid) draft.recordedStatements = addUnique(draft.recordedStatements, sid);

  const revealAll = [...(selected.variant.reveals ?? []), ...(question.reveals ?? [])];
  const revealClues = revealAll.filter((id) => caseFile.clues?.some((c) => c.id === id));
  const revealEvidence = revealAll.filter((id) => caseFile.evidence?.some((e) => e.id === id));
  const disclosedFacts = (selected.variant.discloses ?? []).map((d) => d.factId);
  draft.discoveredClues = addUnique(draft.discoveredClues, ...revealClues);
  draft.discoveredEvidence = addUnique(draft.discoveredEvidence, ...revealEvidence);
  draft.discoveredFactIds = addUnique(draft.discoveredFactIds, ...disclosedFacts);

  const discovered = [...revealClues, ...revealEvidence];
  draft.unlockedQuestions = addUnique(draft.unlockedQuestions, ...(selected.variant.unlocks ?? []), ...(question.unlocks ?? []));

  const questionUnlocks = [...(selected.variant.unlocks ?? []), ...(question.unlocks ?? [])];
  const activated: string[] = [];
  if (selected.variant.createsContradiction) {
    draft.activeContradictions = addUnique(draft.activeContradictions, selected.variant.createsContradiction);
    draft.contextSwitches = addUnique(draft.contextSwitches, `after_contradiction_${selected.variant.createsContradiction}`);
    activated.push(selected.variant.createsContradiction);
  }

  const newContexts: string[] = [];
  for (const clue of revealClues) newContexts.push(`after_clue_${clue}`);
  for (const evidence of revealEvidence) newContexts.push(`after_evidence_${evidence}`);
  newContexts.push(`after_question_${questionId}`);
  draft.contextSwitches = addUnique(draft.contextSwitches, ...newContexts);

  draft.activeContradictions = computeActiveContradictions(caseFile, draft);
  const confrontation = activeConfrontationQuestions(caseFile, draft);
  if (confrontation.length > 0) {
    draft.unlockedQuestions = addUnique(draft.unlockedQuestions, ...confrontation);
  }

  draft.actionsRemaining = applyActionCost(draft, 'interrogation');

  const deductionState = evaluateDeductions(caseFile, draft);
  draft.understoodDeductionIds = addUnique(
    draft.understoodDeductionIds ?? [],
    ...deductionState.newlyUnderstood.map((d) => d.id),
  );
  draft.availableDeductionIds = addUnique(
    draft.availableDeductionIds ?? [],
    ...deductionState.newlyAvailable.map((d) => d.id),
  );
  draft.understood = addUnique(draft.understood ?? [], ...deductionState.newlyUnderstood.map((d) => d.id));

  const nextAvailable = caseFile.questions
    .filter((q) => q.id !== questionId && isQuestionAvailable(caseFile, draft, q.id))
    .map((q) => q.id);

  const previousAvailable = caseFile.questions
    .filter((q) => q.id !== questionId && isQuestionAvailable(caseFile, state, q.id))
    .map((q) => q.id);

  const newlyAvailableQuestions = nextAvailable.filter((id) => !previousAvailable.includes(id));
  const newlyClosedQuestions = previousAvailable.filter((id) => !nextAvailable.includes(id));

  const result: TurnResult = {
    state: draft,
    response: {
      id: selected.variant.id,
      text: selected.variant.text,
      contextId: selected.contextId,
      kind: selected.variant.kind,
    },
    discoveries: discovered,
    newlyAvailableQuestions,
    newlyClosedQuestions,
    contradictions: activated,
  };

  const theoryMismatch = draft.theoryBoard && state.theoryBoard && JSON.stringify(state.theoryBoard) !== JSON.stringify(draft.theoryBoard);
  if (theoryMismatch) {
    throw new TurnEngineError('Normal turn transition cannot mutate TheoryBoard');
  }

  return result;
}

/**
 * Resolve one explicitly chosen eligible response through the canonical turn
 * transaction. Runtime callers omit `responseVariantId`; exhaustive validators
 * provide it to explore every legal authored response outcome.
 */
function selectResponseVariant(
  caseFile: CaseFile,
  state: PlayerState,
  characterId: CharacterId,
  questionId: string,
  responseVariantId: string,
) {
  const question = caseFile.questions.find((q) => q.id === questionId);
  const contexts = question?.responses[characterId];
  if (!contexts || contexts.length === 0) {
    throw new TurnEngineError(`No response variants for ${characterId}/${questionId}`);
  }
  const contextId = resolveActiveContext(state, contexts);
  const context = contexts.find((item) => item.context === contextId) ?? contexts[0];
  const variant = eligibleVariants(context, state).find((item) => item.id === responseVariantId);
  if (!variant) {
    throw new TurnEngineError(
      `Response ${responseVariantId} is not eligible for ${characterId}/${questionId}`,
    );
  }
  return { variant, contextId };
}
