// Contradiction engine. Contradictions surface ONLY via authored entries
// (INV-116) - never by runtime text comparison. A contradiction is active when:
//   (a) all of its `statementRefs` are recorded, OR
//   (b) its `surfaceWhen` gating condition is satisfied.
// When active, the confrontation card is unlocked and shown as a neutral
// "Possible inconsistency" - never "X is lying" (INV-107 / INV-116).
//
// IMPORTANT: the `confrontationQuestionId` is NOT used to decide whether the
// contradiction text surfaces. Surfacing it on the confrontation card's own
// availability would leak discoveries the player has not yet earned (e.g. a
// contradiction that mentions a piece of evidence revealed BY that very card).
// `confrontationQuestionId` is only consumed by activeConfrontationQuestions()
// to force-unlock the matching card once the contradiction is genuinely active.

import { gatingSatisfied } from './gating.ts';
import type {
  CaseFile,
  Contradiction,
  ContradictionId,
  PlayerState,
  QuestionId,
} from './types.ts';

function isActive(caseFile: CaseFile, state: PlayerState, c: Contradiction): boolean {
  if (c.statementRefs && c.statementRefs.length > 0) {
    const allRecorded = c.statementRefs.every((ref) => state.recordedStatements.includes(ref));
    if (allRecorded) return true;
  }
  if (c.surfaceWhen && gatingSatisfied(caseFile, state, c.surfaceWhen)) {
    return true;
  }
  // `confrontationQuestionId` is deliberately NOT a surfacing condition here.
  return false;
}

/** Full set of active contradictions = authored-active union previously-recorded. */
export function computeActiveContradictions(
  caseFile: CaseFile,
  state: PlayerState,
): ContradictionId[] {
  const set = new Set<ContradictionId>(state.activeContradictions);
  for (const c of caseFile.contradictions) {
    if (isActive(caseFile, state, c)) set.add(c.id);
  }
  return [...set];
}

/** Confrontation questions that should be force-unlocked because a contradiction is active. */
export function activeConfrontationQuestions(
  caseFile: CaseFile,
  state: PlayerState,
): QuestionId[] {
  const result: QuestionId[] = [];
  for (const c of caseFile.contradictions) {
    if (c.confrontationQuestionId && isActive(caseFile, state, c)) {
      result.push(c.confrontationQuestionId);
    }
  }
  return result;
}
