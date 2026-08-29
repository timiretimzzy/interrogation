// Reveal engine. Renders the authored `reveal` plus a per-player "what you
// found / missed" derived from PlayerState. The full truth is always shown here
// (this is the single correctness event); nothing about lying is labelled in play.

import type { CaseFile, PlayerState } from './types.ts';
import type { AccusationEvaluation } from './accusationEngine.ts';

export interface RevealView {
  headline: string;
  narrative: string[];
  truthBreakdown: { fact: string; importance: string; discoveredThrough?: string[] }[];
  foundClues: string[];
  foundEvidence: string[];
  foundContradictions: string[];
  missedClues: string[];
  missedContradictions: string[];
  evaluation: AccusationEvaluation;
}

export function buildReveal(
  caseFile: CaseFile,
  state: PlayerState,
  evaluation: AccusationEvaluation,
): RevealView {
  const clueTitles = new Map((caseFile.clues ?? []).map((c) => [c.id, c.title]));
  const evidenceNames = new Map((caseFile.evidence ?? []).map((e) => [e.id, e.name]));
  const contradictionDescs = new Map(
    caseFile.contradictions.map((c) => [c.id, c.description]),
  );

  const foundClues = state.discoveredClues.map((id) => clueTitles.get(id) ?? id);
  const foundEvidence = state.discoveredEvidence.map((id) => evidenceNames.get(id) ?? id);
  const foundContradictions = state.activeContradictions.map(
    (id) => contradictionDescs.get(id) ?? id,
  );

  const missedClues = (caseFile.clues ?? [])
    .map((c) => c.id)
    .filter((id) => !state.discoveredClues.includes(id))
    .map((id) => clueTitles.get(id) ?? id);
  const missedContradictions = caseFile.contradictions
    .map((c) => c.id)
    .filter((id) => !state.activeContradictions.includes(id))
    .map((id) => contradictionDescs.get(id) ?? id);

  return {
    headline: caseFile.reveal.headline,
    narrative: caseFile.reveal.narrative,
    truthBreakdown: caseFile.reveal.truthBreakdown,
    foundClues,
    foundEvidence,
    foundContradictions,
    missedClues,
    missedContradictions,
    evaluation,
  };
}
