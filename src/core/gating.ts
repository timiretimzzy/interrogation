// Gating evaluation. Pure function over (CaseFile, PlayerState).
// Evaluates a GatingCondition's `all`/`any` atom lists against the player's
// discovered set, recorded statements, asked questions, active contradictions,
// and earned context switches. Engine-agnostic: only IDs and effect edges.

import type {
  CaseFile,
  GatingAtom,
  GatingCondition,
  PlayerState,
} from './types.ts';
export type { GatingCondition, GatingAtom } from './types.ts';

function atomSatisfied(caseFile: CaseFile, state: PlayerState, atom: GatingAtom): boolean {
  switch (atom.kind) {
    case 'clue':
      return state.discoveredClues.includes(atom.id);
    case 'evidence':
      return state.discoveredEvidence.includes(atom.id);
    case 'statement':
      return state.recordedStatements.includes(atom.id);
    case 'questionAsked': {
      for (const records of Object.values(state.interrogations)) {
        if (records.some((r) => r.questionId === atom.id)) return true;
      }
      return false;
    }
    case 'contradictionActive':
      return state.activeContradictions.includes(atom.id);
    case 'context':
      return state.contextSwitches.includes(atom.id);
    default:
      return false;
  }
}

export function gatingSatisfied(
  caseFile: CaseFile,
  state: PlayerState,
  condition: GatingCondition | undefined,
): boolean {
  if (!condition) return true;
  if (condition.all && condition.all.length > 0) {
    if (!condition.all.every((a) => atomSatisfied(caseFile, state, a))) return false;
  }
  if (condition.any && condition.any.length > 0) {
    if (!condition.any.some((a) => atomSatisfied(caseFile, state, a))) return false;
  }
  return true;
}

/** True if a question is currently askable of the given character. */
export function isQuestionAvailable(
  caseFile: CaseFile,
  state: PlayerState,
  questionId: string,
): boolean {
  const q = caseFile.questions.find((x) => x.id === questionId);
  if (!q) return false;
  if (q.availability.type === 'initial') return true;
  if (state.unlockedQuestions.includes(questionId)) return true;
  return gatingSatisfied(caseFile, state, q.availability.when);
}
