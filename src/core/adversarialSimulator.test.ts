import { describe, expect, it } from 'vitest';
import { simulatePlaythrough, simulateRandomLegal } from './adversarialSimulator.ts';
import type { CaseFile, CaseQuestion } from './types.ts';

function question(id: string, characterId: string, factId: string): CaseQuestion {
  return { id, mechanic: 'EVENT', text: id, targetCharacterIds: [characterId], availability: { type: 'initial' },
    responses: { [characterId]: [{ context: 'initial', variants: [{ id: `R-${id}`, text: '', weight: 1, discloses: [{ factId, clarity: 'full' }] }] }] } };
}
function fixture(): CaseFile {
  return { caseId: 'sim', title: '', genre: 'mystery', tone: '', difficulty: 'easy', briefing: { hook: '' },
    playerRules: { investigationActions: 3, switchCharacterIsFree: true, notebookReviewIsFree: true, evidenceReviewIsFree: true, theoryBuildingIsFree: true, accusationAvailableAtAnyTime: true, externalKnowledgeRequired: false, runtimeLLMRequired: false },
    truth: { incident: '', culpritId: 'a', whatHappened: '', motive: '', method: '', timeline: [], criticalFacts: [] },
    characters: ['a', 'b', 'c'].map((id) => ({ id, name: id, role: 'suspect', visibleDescription: '', personality: '', knowledge: {} })),
    facts: ['F1', 'F2', 'F3'].map((id) => ({ id, statement: '' })), criticalFactIds: ['F1'],
    questions: [question('QA', 'a', 'F1'), question('QB', 'b', 'F2'), question('QC', 'c', 'F3')],
    contradictions: [], deductions: [], accusation: { dimensions: [], correctSolution: {} }, reveal: { headline: '', narrative: [], truthBreakdown: [] } };
}

describe('adversarial simulation', () => {
  it('is deterministic and executes canonical legal turns', () => {
    const a = simulatePlaythrough(fixture(), 'tunnel-vision');
    const b = simulatePlaythrough(fixture(), 'tunnel-vision');
    expect(a.steps).toEqual(b.steps);
    expect(a.steps[0].discoveries).toContain('F1');
  });
  it('tunnel vision prefers its first target then falls back', () => {
    const result = simulatePlaythrough(fixture(), 'tunnel-vision', { stopAtReadiness: false });
    expect(result.steps[0].action.characterId).toBe('a');
    expect(result.distinctCharacterCount).toBeGreaterThan(1);
  });
  it('completionist records actions after readiness', () => {
    const result = simulatePlaythrough(fixture(), 'completionist');
    expect(result.firstReadinessStep).toBe(1);
    expect(result.actionsAfterReadiness).toBeGreaterThan(0);
  });
  it('minimalist stops at first readiness', () => {
    const result = simulatePlaythrough(fixture(), 'minimalist');
    expect(result.termination).toBe('ACCUSATION_READY');
    expect(result.steps).toHaveLength(1);
  });
  it('contrarian moves away from the focused target', () => {
    const result = simulatePlaythrough(fixture(), 'contrarian', { actionBudget: 2 });
    expect(result.steps[0].action.characterId).toBe('b');
  });
  it('seeded random paths reproduce and aggregate', () => {
    const a = simulatePlaythrough(fixture(), 'random-legal', { seed: 2 });
    const b = simulatePlaythrough(fixture(), 'random-legal', { seed: 2 });
    expect(a.steps).toEqual(b.steps);
    expect(simulateRandomLegal(fixture(), [1, 2]).runs).toHaveLength(2);
  });
  it('reports action-budget exhaustion with a reproducible trace', () => {
    const result = simulatePlaythrough(fixture(), 'completionist', { actionBudget: 1, stopAtReadiness: false });
    expect(result.termination).toBe('ACTION_BUDGET_EXCEEDED');
    expect(result.findings[0].actionPath).toEqual(result.steps.map((step) => step.action));
  });
});
