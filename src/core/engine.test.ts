import { describe, it, expect, vi } from 'vitest';
import { hashSeed } from './hash.ts';
import {
  selectResponse,
  eligibleVariants,
  weightedPick,
  isResponseEligible,
} from './responseSelector.ts';
import { gatingSatisfied, GatingCondition } from './gating.ts';
import { ask, availableQuestionsForCharacter } from './cardEngine.ts';
import { executeTurn } from './turnEngine.ts';
import { computeActiveContradictions, activeConfrontationQuestions } from './contradictionEngine.ts';
import { evaluateAccusation, submitAccusation } from './accusationEngine.ts';
import { validateCase } from './caseLoader.ts';
import { buildNotebook } from './notebook.ts';
import { claimDeduction, evaluateDeductions } from './deductionEngine.ts';
import { createInitialPlayerState, PlayerState } from './types.ts';
import { legacyCases } from '../data/cases/index.ts';

const gold = legacyCases.find((c) => c.caseId === 'gold-hh-001')!;

function init(): PlayerState {
  return createInitialPlayerState(gold, 12345);
}

describe('deterministic hash + response selection', () => {
  it('hashSeed is stable and order-sensitive', () => {
    expect(hashSeed('a', 'b', 1)).toBe(hashSeed('a', 'b', 1));
    expect(hashSeed('a', 'b', 1)).not.toBe(hashSeed('b', 'a', 1));
  });

  it('selectResponse is deterministic for identical state (refresh-safe)', () => {
    const s = init();
    const a = selectResponse(gold, s, 'julian', 'Q001');
    const b = selectResponse(gold, s, 'julian', 'Q001');
    expect(a?.variant.id).toBe(b?.variant.id);
  });

  it('weightedPick is deterministic and respects weights', () => {
    const variants = [
      { id: 'x', text: '', kind: 'TRUTH', weight: 1 },
      { id: 'y', text: '', kind: 'TRUTH', weight: 99 },
    ] as any;
    expect(weightedPick(variants, 0).id).toBe(weightedPick(variants, 0).id);
  });

  it('requires and excludes filter eligible variants before weighing', () => {
    const s = init();
    const variants = [
      { id: 'a', text: '', kind: 'TRUTH', weight: 1, requires: ['C003'] },
      { id: 'b', text: '', kind: 'TRUTH', weight: 1, excludes: ['C003'] },
    ] as any;
    s.discoveredClues = ['C003'];
    const eligible = variants.filter((v: any) => {
      const known = new Set([...s.discoveredClues, ...s.discoveredEvidence]);
      const ok = (v.requires ?? []).every((id: string) => known.has(id));
      const blocked = (v.excludes ?? []).some((id: string) => known.has(id));
      return ok && !blocked;
    });
    expect(eligible.map((v: any) => v.id)).toContain('a');
    expect(eligible.map((v: any) => v.id)).not.toContain('b');
  });
});

describe('response eligibility', () => {
  it('accepts unrestricted variants and rejects missing requirements/exclusions', () => {
    const s = init();
    const unrestricted = { id: 'ok', text: '', kind: 'TRUTH', weight: 1 } as any;
    const requires = { id: 'needs', text: '', kind: 'TRUTH', weight: 1, requires: ['C003'] } as any;
    const excludes = { id: 'blocked', text: '', kind: 'TRUTH', weight: 1, excludes: ['C003'] } as any;
    expect(isResponseEligible(unrestricted, s)).toBe(true);
    expect(isResponseEligible(requires, s)).toBe(false);
    s.discoveredClues = ['C003'];
    expect(isResponseEligible(requires, s)).toBe(true);
    expect(isResponseEligible(excludes, s)).toBe(false);
    const multiBlock = { id: 'multi', text: '', kind: 'TRUTH', weight: 1, excludes: ['C001', 'C003'] } as any;
    expect(isResponseEligible(multiBlock, s)).toBe(false);
  });

  it('filters a whole pool before weighted selection', () => {
    const s = init();
    s.discoveredClues = ['C003'];
    const pool = [
      { id: 'a', text: '', kind: 'TRUTH', weight: 1, requires: ['C003'] },
      { id: 'b', text: '', kind: 'TRUTH', weight: 1, excludes: ['C003'] },
      { id: 'c', text: '', kind: 'TRUTH', weight: 1 },
    ] as any;
    const filtered = pool.filter((v: any) => isResponseEligible(v, s));
    expect(filtered.map((v: any) => v.id)).toEqual(['a', 'c']);
  });

  it('throws when a question has variants but none are eligible', () => {
    const s = init();
    s.discoveredClues = ['C003'];
    const noEligible: any = {
      caseId: 'empty-eligibility',
      questions: [{
        id: 'Q999',
        targetCharacterIds: ['julian'],
        responses: {
          julian: [{ context: 'initial', variants: [
            { id: 'a', text: 'blocked', kind: 'TRUTH', weight: 1, excludes: ['C003'] },
            { id: 'b', text: 'blocked-again', kind: 'TRUTH', weight: 1, requires: ['C999'] },
          ] }],
        },
      }],
    };
    expect(() => selectResponse(noEligible, s, 'julian', 'Q999')).toThrow(/No eligible response/);
  });

  it('does not mutate state or variant metadata during eligibility checks', () => {
    const s = init();
    const variant = { id: 'x', text: '', kind: 'TRUTH', weight: 1, requires: ['C003'], excludes: ['C999'] } as any;
    const beforeS = JSON.stringify(s);
    const beforeV = JSON.stringify(variant);
    expect(isResponseEligible(variant, s)).toBe(false);
    expect(JSON.stringify(s)).toBe(beforeS);
    expect(JSON.stringify(variant)).toBe(beforeV);
  });
});

describe('deduction engine', () => {
  it('automatic deductions require all prerequisites and do not mutate input', () => {
    const s = init();
    const before = JSON.stringify(s);
    const initial = evaluateDeductions(gold, s);
    expect(initial.newlyUnderstood).toHaveLength(0);
    expect(JSON.stringify(s)).toBe(before);
    s.discoveredFactIds = ['F004'];
    const partial = evaluateDeductions(gold, s);
    expect(partial.newlyUnderstood.map((d) => d.id)).not.toContain('D001');
    s.discoveredFactIds = ['F004', 'F003'];
    const ready = evaluateDeductions(gold, s);
    expect(ready.newlyUnderstood.map((d) => d.id)).toContain('D001');
  });

  it('player-triggered deductions become available but stay un-understood until claimed', () => {
    const s = init();
    s.discoveredFactIds = ['F004', 'F005'];
    const result = evaluateDeductions(gold, s);
    expect(result.newlyAvailable.map((d) => d.id)).toContain('D003');
    expect(result.newlyUnderstood.map((d) => d.id)).not.toContain('D003');
    expect(s.understoodDeductionIds ?? []).not.toContain('D003');
    const claimed = claimDeduction(gold, s, 'D003');
    expect(claimed.understoodDeductionIds).toContain('D003');
    expect(claimed.availableDeductionIds ?? []).not.toContain('D003');
    expect(claimed.theory).toBeUndefined();
  });

  it('claiming invalid or duplicate deductions fails explicitly and leaves state untouched', () => {
    const s = init();
    s.discoveredFactIds = ['F004', 'F005'];
    expect(() => claimDeduction(gold, s, 'D001')).toThrow(/automatic/i);
    expect(() => claimDeduction(gold, s, 'D003')).not.toThrow();
    expect(() => claimDeduction(gold, claimDeduction(gold, s, 'D003'), 'D003')).toThrow(/already been understood/i);
  });

  it('a turn that discovers the final prerequisite records the deduction atomically', () => {
    const s0 = init();
    const s1 = ask(gold, s0, 'eleanor', 'Q001').state;
    s1.discoveredFactIds = [...new Set([...s1.discoveredFactIds, 'F003'])];
    const evalResult = evaluateDeductions(gold, s1);
    expect(evalResult.newlyUnderstood.map((d) => d.id)).toContain('D001');
    expect(s1.theory).toBeUndefined();
  });

  it('gold-hh-001 deductions are reachable through legitimate gameplay state', () => {
    const s = init();
    s.discoveredFactIds = ['F001', 'F002'];
    s.discoveredClues = ['C001'];
    const result = evaluateDeductions(gold, s);
    expect(result.newlyUnderstood.map((d) => d.id)).toContain('D002');
  });
});

describe('no runtime LLM / RNG in selection', () => {
  it('selectResponse does not call Math.random', () => {
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used at runtime');
    });
    const s = init();
    const r = selectResponse(gold, s, 'eleanor', 'Q001');
    expect(r).not.toBeNull();
    spy.mockRestore();
  });
});

describe('gating', () => {
  it('satisfies when required clue discovered', () => {
    const s = init();
    s.discoveredClues = ['C003'];
    expect(gatingSatisfied(gold, s, { any: [{ kind: 'clue', id: 'C003' }] })).toBe(true);
    expect(gatingSatisfied(gold, s, { any: [{ kind: 'clue', id: 'C001' }] })).toBe(false);
  });
  it('requires ALL for `all`', () => {
    const s = init();
    s.discoveredClues = ['C001'];
    s.contextSwitches = ['initial', 'after_question_Q015'];
    const cond: GatingCondition = { all: [{ kind: 'clue', id: 'C001' }, { kind: 'context', id: 'after_question_Q015' }] };
    expect(gatingSatisfied(gold, s, cond)).toBe(true);
    expect(gatingSatisfied(gold, s, { all: [{ kind: 'clue', id: 'C001' }, { kind: 'clue', id: 'C002' }] })).toBe(false);
  });
});

describe('turn engine', () => {
  it('rejects unavailable question without mutating live state', () => {
    const s0 = init();
    const before = JSON.stringify(s0);
    expect(() => executeTurn(gold, s0, 'theo', 'Q015')).toThrow();
    expect(JSON.stringify(s0)).toBe(before);
  });

  it('applies the response and exposes the post-turn transition details', () => {
    const s0 = init();
    const res = executeTurn(gold, s0, 'daniel', 'Q001');
    expect(res.response).toBeTruthy();
    expect(res.state.discoveredClues).toContain('C003');
    expect(res.state.recordedStatements).toContain('S-DANIEL-SEE');
    expect(res.state.actionsRemaining).toBe(gold.playerRules.investigationActions - 1);
    expect(res.newlyAvailableQuestions).toEqual(expect.arrayContaining(['Q013']));
    expect(s0.discoveredClues).not.toContain('C003');
  });
});

describe('cardEngine.ask applies effects', () => {
  it('delegates to the canonical turn transaction', () => {
    const s0 = init();
    const runtime = ask(gold, s0, 'daniel', 'Q001');
    const canonical = executeTurn(gold, s0, 'daniel', 'Q001');
    expect(runtime.state).toEqual(canonical.state);
    expect(canonical.response).toBeTruthy();
    expect(runtime.variantId).toBe(canonical.response!.id);
  });

  it('reveals clues, records statement, unlocks, spends an action', () => {
    const s0 = init();
    const res = ask(gold, s0, 'daniel', 'Q001');
    const s = res.state;
    expect(res.revealedClues).toContain('C003');
    expect(s.discoveredClues).toContain('C003');
    expect(s.actionsRemaining).toBe(gold.playerRules.investigationActions - 1);
    expect(s.recordedStatements).toContain('S-DANIEL-SEE');
    expect(s.activeContradictions).toContain('CON002');
    expect(s.unlockedQuestions).toContain('Q013');
  });

  it('throws when out of actions', () => {
    const s = init();
    s.actionsRemaining = 0;
    expect(() => ask(gold, s, 'eleanor', 'Q001')).toThrow();
  });
});

describe('context-gated variants unlock when the earned context is present', () => {
  it('ravi Q010 admission requires after_clue_C001 context', () => {
    const ravi10 = gold.questions.find((q) => q.id === 'Q010')!;
    const rc = ravi10.responses['julian'][0];
    const without = eligibleVariants(rc, init());
    expect(without.some((v) => v.requiresContext === 'after_clue_C001')).toBe(false);
    const withCtx = init();
    withCtx.discoveredClues = ['C001'];
    withCtx.contextSwitches = ['initial', 'after_clue_C001'];
    const withElig = eligibleVariants(rc, withCtx);
    expect(withElig.some((v) => v.requiresContext === 'after_clue_C001')).toBe(true);
  });
});

describe('contradiction engine', () => {
  it('surfaceWhen activates CON003 once a clue is discovered', () => {
    const s = init();
    expect(computeActiveContradictions(gold, s)).not.toContain('CON003');
    s.discoveredClues = ['C001'];
    const active = computeActiveContradictions(gold, s);
    expect(active).toContain('CON003');
    expect(activeConfrontationQuestions(gold, s)).toContain('Q011');
  });

  it('statementRefs activate CON002 when the statement is recorded', () => {
    const s0 = init();
    const s = ask(gold, s0, 'daniel', 'Q001').state;
    expect(computeActiveContradictions(gold, s)).toContain('CON002');
  });
});

describe('accusation engine', () => {
  it('wins only when all required dimensions match', () => {
    const wrong = evaluateAccusation(gold, { culprit: 'mara', what: 'insider_theft_and_swap', motive: 'debt_and_insurance' });
    expect(wrong.won).toBe(false);
    const right = evaluateAccusation(gold, { culprit: 'julian', what: 'insider_theft_and_swap', motive: 'debt_and_insurance' });
    expect(right.won).toBe(true);
    expect(right.score).toBe(100);
  });

  it('submit sets status and records answers', () => {
    const s0 = init();
    const s = submitAccusation(gold, s0, { culprit: 'julian', what: 'insider_theft_and_swap', motive: 'debt_and_insurance' });
    expect(s.status).toBe('won');
    expect(s.accusation?.culprit).toBe('julian');
  });

  it('requires discovered proof and emits only an authored mismatch diagnostic', () => {
    const caseWithProof = {
      ...gold,
      accusation: {
        dimensions: [{
          id: 'who',
          prompt: 'Who committed the crime?',
          required: true,
          options: ['julian', 'mara'],
          correctValue: 'julian',
          proofRequirements: ['F001'],
          diagnosticOnMismatch: {
            mara: 'That theory does not account for the access record.',
          },
        }],
        correctSolution: { who: 'julian' },
      },
    };
    const unsupported = evaluateAccusation(caseWithProof, init(), { who: 'mara' });
    expect(unsupported.won).toBe(false);
    expect(unsupported.perDimension[0].assessment).toBe('unsupported');
    expect(unsupported.diagnostics).toEqual([{
      dimensionId: 'who',
      kind: 'insufficient_proof',
      message: 'Your evidence does not yet establish an answer to: Who committed the crime?',
    }]);

    const state = init();
    state.discoveredFactIds = ['F001'];
    const contradicted = evaluateAccusation(caseWithProof, state, { who: 'mara' });
    expect(contradicted.perDimension[0].assessment).toBe('contradicted');
    expect(contradicted.diagnostics[0].message).toBe(
      'That theory does not account for the access record.',
    );
    expect(evaluateAccusation(caseWithProof, state, { who: 'julian' }).won).toBe(true);
  });

  it('uses SolutionClaim proof requirements when a dimension has none', () => {
    const caseWithClaimProof = {
      ...gold,
      accusation: {
        dimensions: [{
          id: 'who',
          prompt: 'Who committed the crime?',
          required: true,
          options: ['julian', 'mara'],
          correctValue: 'julian',
        }],
        correctSolution: { who: 'julian' },
      },
      solutionClaims: [{
        id: 'claim-who',
        dimension: 'who',
        correctValue: 'julian',
        requiredEvidenceIds: ['E001'],
      }],
    };
    expect(evaluateAccusation(caseWithClaimProof, init(), { who: 'julian' }).won).toBe(false);
    const state = init();
    state.discoveredEvidence = ['E001'];
    expect(evaluateAccusation(caseWithClaimProof, state, { who: 'julian' }).won).toBe(true);
  });

  it('rejects solution claims that do not align with accusation dimensions', () => {
    const invalid = {
      ...gold,
      solutionClaims: [{
        id: 'bad-claim',
        dimension: 'unknown',
        correctValue: 'julian',
        requiredEvidenceIds: ['missing-evidence'],
      }],
    };
    const validation = validateCase(invalid);
    expect(validation.errors).toEqual(expect.arrayContaining([
      'Solution claim bad-claim references unknown accusation dimension unknown',
      'Solution claim bad-claim requires unknown evidence missing-evidence',
    ]));
  });
});

describe('notebook projection', () => {
  it('builds people, transcript, clues, contradictions, leads', () => {
    const s0 = init();
    const s = ask(gold, s0, 'eleanor', 'Q001').state;
    const nb = buildNotebook(gold, s);
    expect(nb.people.length).toBe(gold.characters.length);
    expect(nb.transcript.length).toBe(1);
    expect(nb.clues.some((c) => c.id === 'C003')).toBe(true);
    expect(nb.leads.length).toBeGreaterThan(0);
  });
});

describe('available questions', () => {
  it('initial questions available; locked ones hidden at start', () => {
    const s = init();
    const theoAvail = availableQuestionsForCharacter(gold, s, 'theo').map((q) => q.id);
    expect(theoAvail).not.toContain('Q015');
    expect(theoAvail).toContain('Q001');
  });
});
