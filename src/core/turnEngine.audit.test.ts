import { describe, expect, it } from 'vitest';
import { ask } from './cardEngine.ts';
import { claimDeduction, evaluateDeductions } from './deductionEngine.ts';
import { selectResponse } from './responseSelector.ts';
import { validateCaseReachability } from './stateSpaceValidator.ts';
import { executeTurn } from './turnEngine.ts';
import { createInitialPlayerState } from './types.ts';
import type { CaseFile, PlayerState } from './types.ts';

function auditCase(): CaseFile {
  return {
    caseId: 'turn-engine-audit',
    title: 'Turn engine audit fixture',
    genre: 'murder',
    tone: 'test',
    difficulty: 'easy',
    briefing: { hook: 'test' },
    playerRules: {
      investigationActions: 3,
      switchCharacterIsFree: true,
      notebookReviewIsFree: true,
      evidenceReviewIsFree: true,
      theoryBuildingIsFree: true,
      accusationAvailableAtAnyTime: true,
      externalKnowledgeRequired: false,
      runtimeLLMRequired: false,
    },
    truth: {
      incident: 'test',
      culpritId: 'witness',
      whatHappened: 'test',
      motive: 'test',
      method: 'test',
      timeline: [],
      criticalFacts: ['F1'],
    },
    characters: [{
      id: 'witness',
      name: 'Witness',
      role: 'witness',
      visibleDescription: 'test',
      personality: 'test',
      knowledge: {},
    }],
    facts: [{ id: 'F1', statement: 'A final prerequisite', critical: true, tier: 'A' }],
    clues: [{ id: 'C1', title: 'Context', description: 'test' }],
    questions: [{
      id: 'Q1',
      mechanic: 'EVENT',
      text: 'test',
      targetCharacterIds: ['witness'],
      availability: { type: 'initial' },
      responses: {
        witness: [{
          context: 'initial',
          variants: [
            { id: 'excluded-high', text: 'excluded', weight: 10000, excludes: ['C1'] },
            { id: 'requires-high', text: 'requires', weight: 9000, requires: ['C-missing'] },
            { id: 'eligible-low', text: 'eligible', weight: 1, discloses: [{ factId: 'F1', clarity: 'full' }] },
          ],
        }],
      },
    }],
    contradictions: [],
    deductions: [
      { id: 'D-auto', requires: ['F1'], result: { statement: 'F1 is understood.' }, surface: 'automatic' },
      { id: 'D-claim', requires: ['F1'], result: { statement: 'F1 can be synthesized.' }, surface: 'player_triggered' },
    ],
    criticalFactIds: ['F1'],
    accusation: {
      dimensions: [{ id: 'who', prompt: 'Who?', required: true, options: ['witness'], correctValue: 'witness' }],
      correctSolution: { who: 'witness' },
    },
    reveal: { headline: 'test', narrative: [], truthBreakdown: [] },
  };
}

function initial(): PlayerState {
  const state = createInitialPlayerState(auditCase(), 7);
  state.discoveredClues = ['C1'];
  return state;
}

describe('Phase 4.2.2 current-branch turn audit', () => {
  it('uses the same canonical transition through the runtime wrapper and applies post-turn deductions', () => {
    const caseFile = auditCase();
    const state = initial();

    const runtime = ask(caseFile, state, 'witness', 'Q1');
    const canonical = executeTurn(caseFile, state, 'witness', 'Q1');

    expect(runtime.state).toEqual(canonical.state);
    expect(canonical.response?.id).toBe('eligible-low');
    expect(canonical.state.discoveredFactIds).toEqual(['F1']);
    expect(canonical.state.understoodDeductionIds).toEqual(['D-auto']);
    expect(canonical.state.availableDeductionIds).toEqual(['D-claim']);
    expect(canonical.state.actionsRemaining).toBe(2);
  });

  it('filters eligibility before weighting and fails atomically when a forced ineligible variant is selected', () => {
    const caseFile = auditCase();
    const state = initial();
    const before = JSON.stringify(state);

    expect(selectResponse(caseFile, state, 'witness', 'Q1')?.variant.id).toBe('eligible-low');
    expect(() => executeTurn(caseFile, state, 'witness', 'Q1', 'excluded-high')).toThrow(/not eligible/i);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('does not commit draft effects when the post-effect theory firewall rejects a turn', () => {
    const caseFile = auditCase();
    const state = initial();
    let reads = 0;
    const theoryBoard = { who: 'player-owned' } as { who: string; citedEvidence: string[] };
    Object.defineProperty(theoryBoard, 'citedEvidence', {
      configurable: true,
      enumerable: true,
      get: () => reads++ < 2 ? [] : ['changed'],
    });
    state.theoryBoard = theoryBoard;
    const beforeProgression = {
      facts: [...state.discoveredFactIds],
      evidence: [...state.discoveredEvidence],
      clues: [...state.discoveredClues],
      unlocked: [...state.unlockedQuestions],
      deductions: [...(state.understoodDeductionIds ?? [])],
      available: [...(state.availableDeductionIds ?? [])],
      contradictions: [...state.activeContradictions],
      actions: state.actionsRemaining,
      contexts: [...state.contextSwitches],
      status: state.status,
    };

    expect(() => executeTurn(caseFile, state, 'witness', 'Q1')).toThrow(/cannot mutate TheoryBoard/i);
    expect({
      facts: state.discoveredFactIds,
      evidence: state.discoveredEvidence,
      clues: state.discoveredClues,
      unlocked: state.unlockedQuestions,
      deductions: state.understoodDeductionIds ?? [],
      available: state.availableDeductionIds ?? [],
      contradictions: state.activeContradictions,
      actions: state.actionsRemaining,
      contexts: state.contextSwitches,
      status: state.status,
    }).toEqual(beforeProgression);
  });

  it('replays identical inputs deterministically and keeps theory outside progression', () => {
    const caseFile = auditCase();
    const plain = initial();
    const theoryState = initial();
    theoryState.theory = { who: 'arbitrary', why: 'unproven', __note__: 'player-owned' };
    theoryState.theoryBoard = { who: 'arbitrary', citedEvidence: ['irrelevant'] };

    const first = executeTurn(caseFile, plain, 'witness', 'Q1');
    const replay = executeTurn(caseFile, plain, 'witness', 'Q1');
    const withTheory = executeTurn(caseFile, theoryState, 'witness', 'Q1');

    expect(first).toEqual(replay);
    expect(withTheory.state.discoveredFactIds).toEqual(first.state.discoveredFactIds);
    expect(withTheory.state.unlockedQuestions).toEqual(first.state.unlockedQuestions);
    expect(withTheory.state.understoodDeductionIds).toEqual(first.state.understoodDeductionIds);
    expect(withTheory.state.theory).toEqual(theoryState.theory);
    expect(withTheory.state.theoryBoard).toEqual(theoryState.theoryBoard);
  });

  it('keeps player-triggered deductions available until explicitly claimed, then records them once', () => {
    const caseFile = auditCase();
    const afterTurn = executeTurn(caseFile, initial(), 'witness', 'Q1').state;

    expect(evaluateDeductions(caseFile, afterTurn).available.map((deduction) => deduction.id)).toContain('D-claim');
    expect(afterTurn.understoodDeductionIds).not.toContain('D-claim');

    const claimed = claimDeduction(caseFile, afterTurn, 'D-claim');
    expect(claimed.understoodDeductionIds).toEqual(['D-auto', 'D-claim']);
    expect(claimed.availableDeductionIds).not.toContain('D-claim');
    expect(claimed.theory).toEqual(afterTurn.theory);
    expect(() => claimDeduction(caseFile, claimed, 'D-claim')).toThrow(/already been understood/i);
  });

  it('validates the same synthetic legal transition space through canonical turns', () => {
    const result = validateCaseReachability(auditCase(), { maxStates: 100, sessionSeed: 7 });

    expect(result.explorationComplete).toBe(true);
    expect(result.solutionPathFound).toBe(true);
    expect(result.reachableFactIds).toContain('F1');
    expect(result.reachableDeductionIds).toContain('D-auto');
    expect(result.reachableDeductionIds).toContain('D-claim');
  });
});
