import { describe, expect, it } from 'vitest';
import { createInitialPlayerState } from './types.ts';
import { createStateFingerprint, validateCaseReachability } from './stateSpaceValidator.ts';
import type { CaseFile } from './types.ts';
import { cases } from '../data/cases/index.ts';

function fixture(overrides: Partial<CaseFile> = {}): CaseFile {
  return {
    caseId: 'validator-fixture',
    title: 'Fixture',
    genre: 'mystery',
    tone: 'test',
    difficulty: 'easy',
    briefing: { hook: 'test' },
    playerRules: {
      investigationActions: 3, switchCharacterIsFree: true, notebookReviewIsFree: true,
      evidenceReviewIsFree: true, theoryBuildingIsFree: true, accusationAvailableAtAnyTime: true,
      externalKnowledgeRequired: false, runtimeLLMRequired: false,
    },
    truth: { incident: 'test', culpritId: 'a', whatHappened: 'test', motive: 'test', method: 'test', timeline: [], criticalFacts: [] },
    characters: [{ id: 'a', name: 'A', role: 'suspect', visibleDescription: '', personality: '', knowledge: {} }],
    facts: [{ id: 'F1', statement: 'reachable' }],
    questions: [{
      id: 'Q1', mechanic: 'EVENT', text: 'Question', targetCharacterIds: ['a'],
      availability: { type: 'initial' },
      responses: { a: [{ context: 'initial', variants: [{ id: 'R1', text: '', weight: 1, discloses: [{ factId: 'F1', clarity: 'full' }] }] }] },
    }],
    contradictions: [],
    accusation: { dimensions: [{ id: 'culprit', prompt: '', required: true, options: ['a'], correctValue: 'a' }], correctSolution: { culprit: 'a' } },
    reveal: { headline: '', narrative: [], truthBreakdown: [] },
    ...overrides,
  };
}

describe('state-space validator', () => {
  it('reports reachable facts and unreachable authored facts', () => {
    const result = validateCaseReachability(fixture({ facts: [{ id: 'F1', statement: '' }, { id: 'F2', statement: '' }] }));
    expect(result.reachableFactIds).toEqual(['F1']);
    expect(result.unreachableFactIds).toEqual(['F2']);
  });

  it('deduplicates equivalent progression state fingerprints independent of theory', () => {
    const caseFile = fixture();
    const a = createInitialPlayerState(caseFile, 1);
    const b = createInitialPlayerState(caseFile, 99);
    a.theoryBoard = { who: 'a', citedEvidence: [] };
    b.theoryBoard = { who: 'wrong', citedEvidence: ['F1'], notes: { n: 'x' } };
    expect(createStateFingerprint(a)).toBe(createStateFingerprint(b));
  });

  it('reaches automatic deductions regardless of prerequisite acquisition order', () => {
    const base = fixture({
      playerRules: { ...fixture().playerRules, investigationActions: 2 },
      facts: [{ id: 'F1', statement: '' }, { id: 'F2', statement: '' }],
      deductions: [{ id: 'D1', requires: ['F1', 'F2'], result: { statement: '' }, surface: 'automatic' }],
      questions: ['F1', 'F2'].map((factId, index) => ({
        id: `Q${index + 1}`, mechanic: 'EVENT', text: '', targetCharacterIds: ['a'], availability: { type: 'initial' as const },
        responses: { a: [{ context: 'initial', variants: [{ id: `R${index + 1}`, text: '', weight: 1, discloses: [{ factId, clarity: 'full' as const }] }] }] },
      })),
    });
    const result = validateCaseReachability(base);
    expect(result.reachableDeductionIds).toContain('D1');
    expect(result.reachableStateCount).toBeLessThanOrEqual(5);
  });

  it('models player-triggered availability as a separate claim action', () => {
    const result = validateCaseReachability(fixture({
      deductions: [{ id: 'D1', requires: ['F1'], result: { statement: '' }, surface: 'player_triggered' }],
    }));
    expect(result.reachableDeductionIds).toContain('D1');
    expect(result.reachableStateCount).toBeGreaterThanOrEqual(3);
  });

  it('reports response eligibility dead ends and unreachable critical facts', () => {
    const result = validateCaseReachability(fixture({
      criticalFactIds: ['F1'],
      questions: [{
        id: 'Q1', mechanic: 'EVENT', text: '', targetCharacterIds: ['a'], availability: { type: 'initial' },
        responses: { a: [{ context: 'initial', variants: [{ id: 'R1', text: '', weight: 1, requires: ['missing'] }] }] },
      }],
    }));
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((item) => item.code === 'NO_ELIGIBLE_RESPONSE')).toBe(true);
    expect(result.diagnostics.some((item) => item.code === 'UNREACHABLE_CRITICAL_FACT')).toBe(true);
  });

  it('explores gold-hh-001 as a real-case smoke test', () => {
    const gold = cases.find((caseFile) => caseFile.caseId === 'gold-hh-001')!;
    const result = validateCaseReachability(gold);
    expect(result.reachableStateCount).toBeGreaterThan(1);
    expect(result.reachableFactIds.length).toBeGreaterThan(0);
  });
});
