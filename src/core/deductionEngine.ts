import type { CaseFile, Deduction, PlayerState } from './types.ts';

export interface DeductionEvaluationResult {
  satisfied: Deduction[];
  newlyUnderstood: Deduction[];
  newlyAvailable: Deduction[];
  available: Deduction[];
  understood: Deduction[];
}

export function knownIds(state: PlayerState): Set<string> {
  const ids = new Set<string>();
  for (const list of [
    state.discoveredFactIds ?? [],
    state.discoveredClues ?? [],
    state.discoveredEvidence ?? [],
    state.recordedStatements ?? [],
    state.contextSwitches ?? [],
    state.unlockedQuestions ?? [],
    state.activeContradictions ?? [],
    state.flaggedContradictions ?? [],
    state.discovered ?? [],
    state.understood ?? [],
    state.understoodDeductionIds ?? [],
    state.availableDeductionIds ?? [],
    state.questionsAsked ?? [],
    state.closedLeads ?? [],
  ]) {
    for (const id of list) ids.add(String(id));
  }
  return ids;
}

export function evaluateDeductions(
  caseFile: CaseFile,
  state: PlayerState,
): DeductionEvaluationResult {
  const understood = new Set(state.understoodDeductionIds ?? []);
  const available = new Set(state.availableDeductionIds ?? []);
  const all = caseFile.deductions ?? [];

  const satisfied: Deduction[] = [];
  const newlyUnderstood: Deduction[] = [];
  const newlyAvailable: Deduction[] = [];
  const allAvailable: Deduction[] = [];
  const allUnderstood: Deduction[] = [];
  const known = knownIds(state);

  for (const deduction of all) {
    const met = deduction.requires.every((id) => known.has(String(id)));
    if (!met) continue;
    satisfied.push(deduction);

    if (deduction.surface === 'automatic') {
      allUnderstood.push(deduction);
      if (!understood.has(deduction.id)) {
        newlyUnderstood.push(deduction);
      }
      continue;
    }

    allAvailable.push(deduction);
    if (!understood.has(deduction.id) && !available.has(deduction.id)) {
      newlyAvailable.push(deduction);
    }
  }

  return {
    satisfied,
    newlyUnderstood,
    newlyAvailable,
    available: allAvailable,
    understood: allUnderstood,
  };
}

export function claimDeduction(
  caseFile: CaseFile,
  state: PlayerState,
  deductionId: string,
): PlayerState {
  const deduction = (caseFile.deductions ?? []).find((d) => d.id === deductionId);
  if (!deduction) {
    throw new Error(`Unknown deduction: ${deductionId}`);
  }
  if (deduction.surface !== 'player_triggered') {
    throw new Error(`Deduction ${deductionId} is automatic and cannot be claimed manually`);
  }

  const understood = new Set(state.understoodDeductionIds ?? []);
  if (understood.has(deductionId)) {
    throw new Error(`Deduction ${deductionId} has already been understood`);
  }

  const available = evaluateDeductions(caseFile, state).available;
  if (!available.some((d) => d.id === deductionId)) {
    throw new Error(`Deduction ${deductionId} is not currently available`);
  }

  const next: PlayerState = {
    ...state,
    understoodDeductionIds: [...new Set([...(state.understoodDeductionIds ?? []), deductionId])],
    availableDeductionIds: (state.availableDeductionIds ?? []).filter((id) => id !== deductionId),
    understood: [...new Set([...(state.understood ?? []), deductionId])],
  };
  return next;
}
