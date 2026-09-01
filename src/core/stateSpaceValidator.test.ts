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

  it('accepts a healthy progressing lead', () => {
    const result = validateCaseReachability(fixture());
    expect(result.leadLifecycleSafety).toBe(true);
  });

  it('diagnoses an inert lead', () => {
    const result = validateCaseReachability(fixture({ questions: [question('Q1', [{ id: 'R1', text: 'flavor', weight: 1 }])] }));
    expect(result.diagnostics.some((item) => item.code === 'LEAD_NO_MEANINGFUL_OUTCOME')).toBe(true);
  });

  it('diagnoses authored progression that is never eligible', () => {
    const result = validateCaseReachability(fixture({ questions: [question('Q1', [
      { id: 'R1', text: '', weight: 1, requires: ['never'], discloses: [{ factId: 'F1', clarity: 'full' }] },
    ])] }));
    expect(result.diagnostics.some((item) => item.code === 'LEAD_PROGRESSION_UNREACHABLE')).toBe(true);
  });

  it('accepts an explicitly closed false lead', () => {
    const result = validateCaseReachability(fixture({ questions: [
      question('Q1', [{ id: 'R1', text: '', weight: 1, leadResolution: { kind: 'closed', leadIds: ['Q1'] } }]),
    ] }));
    expect(result.diagnostics.some((item) => item.code === 'FALSE_LEAD_UNCLOSED')).toBe(false);
    expect(result.diagnostics.some((item) => item.code === 'LEAD_NO_MEANINGFUL_OUTCOME')).toBe(false);
  });

  it('diagnoses a false lead that silently ends', () => {
    const result = validateCaseReachability(fixture({ questions: [question('Q1', [{ id: 'R1', text: '', weight: 1 }])] }));
    expect(result.diagnostics.some((item) => item.code === 'FALSE_LEAD_UNCLOSED')).toBe(true);
  });

  it('diagnoses a lead with a stranded legal branch', () => {
    const result = validateCaseReachability(fixture({ playerRules: { ...fixture().playerRules, investigationActions: 2 }, questions: [
      question('Q1', [
        { id: 'good', text: '', weight: 1, leadResolution: { kind: 'closed', leadIds: ['Q1'] } },
        { id: 'bad', text: '', weight: 1 },
      ]),
    ] }));
    expect(result.diagnostics.some((item) => item.code === 'LEAD_STRANDED')).toBe(true);
  });

  it('allows either of two nonlinear disclosure foundations', () => {
    const result = validateCaseReachability(fixture({ facts: [
      { id: 'F1', statement: '', disclosureRequirements: [['A'], ['B']] }, { id: 'A', statement: '' }, { id: 'B', statement: '' },
    ], questions: [
      question('QA', [{ id: 'RA', text: '', weight: 1, discloses: [{ factId: 'A', clarity: 'full' }] }]),
      question('QB', [{ id: 'RB', text: '', weight: 1, discloses: [{ factId: 'B', clarity: 'full' }] }]),
      question('Q1', [
        { id: 'RA', text: '', weight: 1, requires: ['A'], discloses: [{ factId: 'F1', clarity: 'full' }] },
        { id: 'RB', text: '', weight: 1, requires: ['B'], discloses: [{ factId: 'F1', clarity: 'full' }] },
      ]),
    ], playerRules: { ...fixture().playerRules, investigationActions: 2 },
    })).diagnostics;
    expect(result.some((item) => item.code === 'PREMATURE_DISCLOSURE' || item.code === 'SOLUTION_SHORTCUT')).toBe(false);
  });

  it('diagnoses a critical fact disclosed before its foundation', () => {
    const result = validateCaseReachability(fixture({ facts: [
      { id: 'F1', statement: '', disclosureRequirements: [['A']] }, { id: 'A', statement: '' },
    ], questions: [question('Q1', [{ id: 'R1', text: '', weight: 1, discloses: [{ factId: 'F1', clarity: 'full' }] }])]}));
    const diagnostic = result.diagnostics.find((item) => item.code === 'SOLUTION_SHORTCUT');
    expect(diagnostic?.missingRequirements).toEqual(['A']);
    expect(diagnostic?.path).toHaveLength(1);
  });

  it('accepts correctly gated critical disclosure', () => {
    const result = validateCaseReachability(fixture({ facts: [
      { id: 'F1', statement: '', disclosureRequirements: [['A']] }, { id: 'A', statement: '' },
    ], playerRules: { ...fixture().playerRules, investigationActions: 2 }, questions: [
      question('QA', [{ id: 'RA', text: '', weight: 1, discloses: [{ factId: 'A', clarity: 'full' }] }]),
      question('Q1', [{ id: 'R1', text: '', weight: 1, requires: ['A'], discloses: [{ factId: 'F1', clarity: 'full' }] }]),
    ] }));
    expect(result.disclosureSafety).toBe(true);
  });

  it('returns unknown lifecycle and disclosure certification when capped', () => {
    const result = validateCaseReachability(fixture(), { maxStates: 1 });
    expect(result.leadLifecycleSafety).toBe('unknown');
    expect(result.disclosureSafety).toBe('unknown');
  });
});
