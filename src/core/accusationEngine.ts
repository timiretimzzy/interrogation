// Accusation engine. Builds the form from `accusation.dimensions` and evaluates
// the player's answers against `correctSolution`. Win iff every REQUIRED dimension
// matches (INV-013). Returns a graded score for the reveal (partial credit allowed).

import type {
  Accusation,
  AccusationDimension,
  CaseFile,
  PlayerState,
} from './types.ts';
export type { AccusationDimension } from './types.ts';

export interface AccusationOptionView {
  value: string;
  label: string;
}

export interface DimensionResult {
  id: string;
  prompt: string;
  value: string | undefined;
  expected: string;
  required: boolean;
  correct: boolean;
  answered: boolean;
}

export interface AccusationEvaluation {
  won: boolean;
  score: number;
  perDimension: DimensionResult[];
  missingRequired: string[];
  correctCount: number;
  requiredCount: number;
}

export function dimensionOptions(dim: AccusationDimension): AccusationOptionView[] {
  return dim.options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value },
  );
}

export function buildAccusationForm(caseFile: CaseFile): AccusationDimension[] {
  return caseFile.accusation.dimensions;
}

export function evaluateAccusation(
  caseFile: CaseFile,
  answers: Record<string, string>,
): AccusationEvaluation {
  const dims = caseFile.accusation.dimensions;
  const perDimension: DimensionResult[] = [];
  const missingRequired: string[] = [];
  let correctCount = 0;

  for (const dim of dims) {
    const value = answers[dim.id];
    const answered = value !== undefined && value !== '';
    const expected = caseFile.accusation.correctSolution[dim.id];
    const correct = answered && value === expected;
    if (correct) correctCount += 1;
    if (dim.required && !answered) missingRequired.push(dim.id);
    perDimension.push({
      id: dim.id,
      prompt: dim.prompt,
      value,
      expected,
      required: dim.required,
      correct,
      answered,
    });
  }

  const required = dims.filter((d) => d.required);
  const requiredTotal = required.length;
  const requiredCorrect = required.filter(
    (d) => answers[d.id] !== undefined && answers[d.id] === caseFile.accusation.correctSolution[d.id],
  ).length;
  const allRequiredCorrect = requiredCorrect === requiredTotal && missingRequired.length === 0;
  const won = allRequiredCorrect;
  const score = requiredTotal === 0 ? 0 : Math.round((requiredCorrect / requiredTotal) * 100);

  return {
    won,
    score,
    perDimension,
    missingRequired,
    correctCount,
    requiredCount: requiredTotal,
  };
}

/** Apply an accusation to the player state. Sets status to won/lost. */
export function submitAccusation(
  caseFile: CaseFile,
  state: PlayerState,
  answers: Record<string, string>,
): PlayerState {
  const result = evaluateAccusation(caseFile, answers);
  return {
    ...state,
    accusation: { ...answers },
    status: result.won ? 'won' : 'lost',
  };
}

export function emptyAccusation(dimensions: AccusationDimension[]): Record<string, string> {
  return Object.fromEntries(dimensions.map((d) => [d.id, '']));
}

export type { Accusation };
