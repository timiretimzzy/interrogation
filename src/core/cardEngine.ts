// Card engine: question availability + ask + applyEffects (the information graph).
// Pure over (CaseFile, PlayerState); returns a NEW PlayerState (no in-place mutation
// of the input). Spending one interrogation action per ask (INV-118).

import { applyActionCost } from './actionEconomy.ts';
import {
  activeConfrontationQuestions,
  computeActiveContradictions,
} from './contradictionEngine.ts';
import { isQuestionAvailable } from './gating.ts';
import { selectResponse } from './responseSelector.ts';
import type {
  CaseFile,
  CaseQuestion,
  CharacterId,
  PlayerState,
  StatementId,
} from './types.ts';

export class EngineError extends Error {}

function cloneState(state: PlayerState): PlayerState {
  return {
    ...state,
    interrogations: Object.fromEntries(
      Object.entries(state.interrogations).map(([k, v]) => [k, [...v]]),
    ),
    conversationSeq: state.conversationSeq,
    recordedStatements: [...state.recordedStatements],
    discoveredClues: [...state.discoveredClues],
    discoveredEvidence: [...state.discoveredEvidence],
    unlockedQuestions: [...state.unlockedQuestions],
    activeContradictions: [...state.activeContradictions],
    flaggedContradictions: [...state.flaggedContradictions],
    contextSwitches: [...state.contextSwitches],
    theory: state.theory ? { ...state.theory } : undefined,
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
  const question = caseFile.questions.find((q) => q.id === questionId);
  if (!question) throw new EngineError(`Unknown question: ${questionId}`);
  if (!question.targetCharacterIds.includes(characterId)) {
    throw new EngineError(`Question ${questionId} cannot be asked of ${characterId}`);
  }
  if (!isQuestionAvailable(caseFile, state, questionId)) {
    throw new EngineError(`Question ${questionId} is not available yet`);
  }
  const alreadyAsked = (state.interrogations[characterId] ?? []).some(
    (r) => r.questionId === questionId,
  );
  if (alreadyAsked) {
    throw new EngineError(`Question ${questionId} was already asked of ${characterId}`);
  }
  if (state.actionsRemaining <= 0) {
    throw new EngineError('No investigation actions remaining');
  }

  const selected = selectResponse(caseFile, state, characterId, questionId);
  if (!selected) throw new EngineError(`No response variant for ${characterId}/${questionId}`);

  const next = cloneState(state);
  const { variant, contextId } = selected;

  // 1. Record the interrogation.
  const seq = typeof next.conversationSeq === 'number' ? next.conversationSeq : 0;
  const record = {
    questionId,
    variantId: variant.id,
    text: variant.text,
    contextId,
    kind: variant.kind,
    characterId,
    sequence: seq,
  };
  const prior = next.interrogations[characterId] ?? [];
  next.interrogations = { ...next.interrogations, [characterId]: [...prior, record] };
  next.conversationSeq = seq + 1;

  // 2. Record the canonical statement (if any) for this character/question.
  const sid = statementIdFor(caseFile, characterId, questionId);
  if (sid) next.recordedStatements = addUnique(next.recordedStatements, sid);

  // 3. Reveal clues / evidence (variant + question-level fallback).
  // Evidence ids go ONLY to discoveredEvidence; clue ids go to discoveredClues.
  // Mixing them (as the old code did) made the Reveal mislabel evidence as "Clue:".
  const revealAll = [...(variant.reveals ?? []), ...(question.reveals ?? [])];
  const revealClues = revealAll.filter((id) => caseFile.clues?.some((c) => c.id === id));
  const revealEvidence = revealAll.filter((id) => caseFile.evidence?.some((e) => e.id === id));
  next.discoveredClues = addUnique(next.discoveredClues, ...revealClues);
  if (revealEvidence.length > 0) {
    next.discoveredEvidence = addUnique(next.discoveredEvidence, ...revealEvidence);
  }

  // 4. Unlock follow-up / confrontation questions.
  const unlockIds = [...(variant.unlocks ?? []), ...(question.unlocks ?? [])];
  next.unlockedQuestions = addUnique(next.unlockedQuestions, ...unlockIds);

  // 5. Created contradiction.
  const activated: string[] = [];
  if (variant.createsContradiction) {
    next.activeContradictions = addUnique(
      next.activeContradictions,
      variant.createsContradiction,
    );
    next.contextSwitches = addUnique(
      next.contextSwitches,
      `after_contradiction_${variant.createsContradiction}`,
    );
    activated.push(variant.createsContradiction);
  }

  // 6. Earned contexts from reveals + the question itself.
  const newContexts: string[] = [];
  for (const c of revealClues) newContexts.push(`after_clue_${c}`);
  for (const e of next.discoveredEvidence) newContexts.push(`after_evidence_${e}`);
  newContexts.push(`after_question_${questionId}`);
  next.contextSwitches = addUnique(next.contextSwitches, ...newContexts);

  // 7. Recompute contradictions + force-unlock confrontation cards.
  next.activeContradictions = computeActiveContradictions(caseFile, next);
  const confront = activeConfrontationQuestions(caseFile, next);
  if (confront.length > 0) {
    next.unlockedQuestions = addUnique(next.unlockedQuestions, ...confront);
  }

  // 8. Spend the interrogation action.
  next.actionsRemaining = applyActionCost(next, 'interrogation');

  // 9. Out of actions ends the playable phase (accusation still allowed).
  if (next.actionsRemaining <= 0) {
    next.status = next.status === 'won' ? 'won' : 'playing';
  }

  return {
    state: next,
    variantId: variant.id,
    text: variant.text,
    contextId,
    kind: variant.kind,
    revealedClues: revealClues,
    unlockedQuestions: unlockIds,
    activatedContradictions: activated,
  };
}
