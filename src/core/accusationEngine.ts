// Accusation engine. Evaluates authored IDs only. Diagnostics never expose an
// unselected canonical answer and are withheld until the player has the proof
// required to make the relevant claim fairly.

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
  required: boolean;
  correct: boolean;
  answered: boolean;
  proofRequirements: string[];
  discoveredProofRequirements: string[];
  missingProofRequirements: string[];
  hasSufficientProof: boolean;
  assessment: 'supported' | 'unsupported' | 'contradicted' | 'unanswered';
  diagnostic?: string;
}

export interface AccusationDiagnostic {
  dimensionId: string;
  kind: 'missing' | 'insufficient_proof' | 'mismatch';
  message: string;
}

export interface AccusationEvaluation {
  won: boolean;
  score: number;
  perDimension: DimensionResult[];
  diagnostics: AccusationDiagnostic[];
  missingRequired: string[];
  correctCount: number;
  supportedCount: number;
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

function proofRequirements(caseFile: CaseFile, dim: AccusationDimension): string[] {
  if (dim.proofRequirements) return [...new Set(dim.proofRequirements)];
  const claim = (caseFile.solutionClaims ?? []).find(
    (candidate) => candidate.dimension === dim.id || candidate.id === dim.id,
  );
  return [...new Set(claim?.requiredEvidenceIds ?? [])];
}

function knownInformation(state?: PlayerState): Set<string> {
  if (!state) return new Set();
  return new Set([
    ...state.discoveredClues,
    ...state.discoveredEvidence,
    ...state.discoveredFactIds,
    ...state.recordedStatements,
    ...(state.discovered ?? []),
    ...(state.understood ?? []),
    ...(state.understoodDeductionIds ?? []),
  ]);
}

export function evaluateAccusation(
  caseFile: CaseFile,
  answers: Record<string, string>,
): AccusationEvaluation;
export function evaluateAccusation(
  caseFile: CaseFile,
  state: PlayerState,
  answers: Record<string, string>,
): AccusationEvaluation;
export function evaluateAccusation(
  caseFile: CaseFile,
  stateOrAnswers: PlayerState | Record<string, string>,
  maybeAnswers?: Record<string, string>,
): AccusationEvaluation {
  const state = maybeAnswers ? stateOrAnswers as PlayerState : undefined;
  const answers = (maybeAnswers ?? stateOrAnswers) as Record<string, string>;
  const dims = caseFile.accusation.dimensions;
  const perDimension: DimensionResult[] = [];
  const diagnostics: AccusationDiagnostic[] = [];
  const missingRequired: string[] = [];
  const known = knownInformation(state);
  let correctCount = 0;
  let supportedCount = 0;

  for (const dim of dims) {
    const value = answers[dim.id];
    const answered = value !== undefined && value !== '';
    const correct = answered && value === dim.correctValue;
    const requirements = proofRequirements(caseFile, dim);
    const discoveredRequirements = requirements.filter((id) => known.has(id));
    const missingRequirements = requirements.filter((id) => !known.has(id));
    const hasSufficientProof = missingRequirements.length === 0;
    if (correct) correctCount += 1;
    if (correct && hasSufficientProof) supportedCount += 1;
    let assessment: DimensionResult['assessment'];
    let diagnostic: AccusationDiagnostic | undefined;
    if (!answered) {
      assessment = 'unanswered';
      if (dim.required) {
        missingRequired.push(dim.id);
        diagnostic = {
          dimensionId: dim.id,
          kind: 'missing',
          message: `You have not made a claim about: ${dim.prompt}`,
        };
      }
    } else if (!hasSufficientProof) {
      assessment = 'unsupported';
      diagnostic = {
        dimensionId: dim.id,
        kind: 'insufficient_proof',
        message: `Your evidence does not yet establish an answer to: ${dim.prompt}`,
      };
    } else if (correct) {
      assessment = 'supported';
    } else {
      assessment = 'contradicted';
      const message = dim.diagnosticOnMismatch?.[value];
      if (message) diagnostic = { dimensionId: dim.id, kind: 'mismatch', message };
    }
    if (diagnostic) diagnostics.push(diagnostic);
    perDimension.push({
      id: dim.id,
      prompt: dim.prompt,
      value,
      required: dim.required,
      correct,
      answered,
      proofRequirements: requirements,
      discoveredProofRequirements: discoveredRequirements,
      missingProofRequirements: missingRequirements,
      hasSufficientProof,
      assessment,
      diagnostic: diagnostic?.message,
    });
  }

  const required = dims.filter((d) => d.required);
  const requiredTotal = required.length;
  const requiredCorrect = required.filter(
    (d) => answers[d.id] !== undefined
      && answers[d.id] === d.correctValue
      && proofRequirements(caseFile, d).every((id) => known.has(id)),
  ).length;
  const allRequiredCorrect = requiredCorrect === requiredTotal && missingRequired.length === 0;
  const won = allRequiredCorrect;
  const score = requiredTotal === 0 ? 0 : Math.round((requiredCorrect / requiredTotal) * 100);

  return {
    won,
    score,
    perDimension,
    diagnostics,
    missingRequired,
    correctCount,
    supportedCount,
    requiredCount: requiredTotal,
  };
}

/** Apply an accusation to the player state. Sets status to won/lost. */
export function submitAccusation(
  caseFile: CaseFile,
  state: PlayerState,
  answers: Record<string, string>,
): PlayerState {
  const result = evaluateAccusation(caseFile, state, answers);
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
