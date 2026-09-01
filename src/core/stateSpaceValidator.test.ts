import { describe, expect, it } from 'vitest';
import { createInitialPlayerState } from './types.ts';
import { createStateFingerprint, validateCaseReachability } from './stateSpaceValidator.ts';
import type { CaseFile, CaseQuestion } from './types.ts';

function question(id: string, variants: object[], availability: CaseQuestion['availability'] = { type: 'initial' }): CaseQuestion {
  return { id, mechanic: 'EVENT', text: id, targetCharacterIds: ['a'], availability, responses: { a: [{ context: 'initial', variants: variants as any }] } };
}

function fixture(overrides: Partial<CaseFile> = {}): CaseFile {
  return {
    caseId: 'validator-fixture', title: 'Fixture', genre: 'mystery', tone: 'test', difficulty: 'easy', briefing: { hook: 'test' },
    playerRules: { investigationActions: 2, switchCharacterIsFree: true, notebookReviewIsFree: true, evidenceReviewIsFree: true, theoryBuildingIsFree: true, accusationAvailableAtAnyTime: true, externalKnowledgeRequired: false, runtimeLLMRequired: false },
    truth: { incident: '', culpritId: 'a', whatHappened: '', motive: '', method: '', timeline: [], criticalFacts: [] },
    characters: [{ id: 'a', name: 'A', role: 'suspect', visibleDescription: '', personality: '', knowledge: {} }],
    facts: [{ id: 'F1', statement: '' }], criticalFactIds: ['F1'],
    questions: [question('Q1', [{ id: 'R1', text: '', weight: 1, discloses: [{ factId: 'F1', clarity: 'full' }] }])],
    contradictions: [], deductions: [], accusation: { dimensions: [], correctSolution: {} }, reveal: { headline: '', narrative: [], truthBreakdown: [] },
    ...overrides,
  };
}

describe('state-space validator correctness', () => {
  it('certifies an existentially solvable and universally safe scenario', () => {
    const result = validateCaseReachability(fixture({ questions: [question('Q1', [
      { id: 'R1', text: '', weight: 1, discloses: [{ factId: 'F1', clarity: 'full' }] },
      { id: 'R2', text: 'cosmetic', weight: 1, discloses: [{ factId: 'F1', clarity: 'full' }] },
    ])] }));
    expect(result.solutionPathFound).toBe(true);
    expect(result.existentialSolvabilityCertified).toBe(true);
    expect(result.universalProgressionSafety).toBe(true);
    expect(result.explorationComplete).toBe(true);
  });

  it('distinguishes an existential solution from an unsafe legal branch', () => {
    const result = validateCaseReachability(fixture({ playerRules: { ...fixture().playerRules, investigationActions: 1 }, questions: [question('Q1', [
      { id: 'good', text: '', weight: 1, discloses: [{ factId: 'F1', clarity: 'full' }] },
      { id: 'bad', text: '', weight: 1 },
    ])] }));
    expect(result.solutionPathFound).toBe(true);
    expect(result.existentialSolvabilityCertified).toBe(true);
    expect(result.universalProgressionSafety).toBe(false);
    expect(result.unsafeStates).toHaveLength(1);
    expect(result.unsafeStates[0].reason).toBe('ACTION_ECONOMY_EXHAUSTED');
  });

  it('certifies no solution only after complete exploration', () => {
    const result = validateCaseReachability(fixture({ questions: [question('Q1', [{ id: 'R1', text: '', weight: 1 }])] }));
    expect(result.explorationComplete).toBe(true);
    expect(result.solutionPathFound).toBe(false);
    expect(result.existentialSolvabilityCertified).toBe(false);
    expect(result.diagnostics.some((item) => item.code === 'NO_SOLUTION_PATH')).toBe(true);
  });

  it('requires claiming a player-triggered deduction when it is a solution requirement', () => {
    const result = validateCaseReachability(fixture({
      deductions: [{ id: 'D1', requires: ['F1'], result: { statement: '' }, surface: 'player_triggered' }],
    }));
    expect(result.reachableDeductionIds).toContain('D1');
    expect(result.solutionPathFound).toBe(true);
  });

  it('includes solution-claim evidence requirements in solution readiness', () => {
    const result = validateCaseReachability(fixture({
      evidence: [{ id: 'E1', name: '', description: '', discoverability: '', supports: [] }],
      solutionClaims: [{ id: 'WHO', dimension: 'who', correctValue: 'a', requiredEvidenceIds: ['E1'] }],
    }));
    expect(result.solutionPathFound).toBe(false);
    expect(result.existentialSolvabilityCertified).toBe(false);
  });

  it('branches only across eligible response variants', () => {
    const result = validateCaseReachability(fixture({ questions: [question('Q1', [
      { id: 'legal', text: '', weight: 1, discloses: [{ factId: 'F1', clarity: 'full' }] },
      { id: 'illegal', text: '', weight: 1, requires: ['missing'] },
    ])] }));
    expect(result.reachableStateCount).toBe(2);
    expect(result.solutionPathFound).toBe(true);
  });

  it('collapses cosmetic history and theory-board differences', () => {
    const caseFile = fixture();
    const a = createInitialPlayerState(caseFile, 1);
    const b = createInitialPlayerState(caseFile, 9);
    a.theoryBoard = { who: 'a', citedEvidence: [] };
    b.theoryBoard = { who: 'wrong', citedEvidence: ['F1'], notes: { ignored: 'yes' } };
    a.discoveredFactIds = ['F2', 'F1'];
    b.discoveredFactIds = ['F1', 'F2'];
    expect(createStateFingerprint(a)).toBe(createStateFingerprint(b));
  });

  it('reports incomplete exploration without certifying safety or unsolvability', () => {
    const result = validateCaseReachability(fixture(), { maxStates: 1 });
    expect(result.explorationComplete).toBe(false);
    expect(result.solutionPathFound).toBe(false);
    expect(result.existentialSolvabilityCertified).toBe('unknown');
    expect(result.universalProgressionSafety).toBe('unknown');
  });
});
