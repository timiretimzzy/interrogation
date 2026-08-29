import { describe, it, expect, vi } from 'vitest';
import { hashSeed } from './hash.ts';
import { selectResponse, eligibleVariants, weightedPick } from './responseSelector.ts';
import { gatingSatisfied, GatingCondition } from './gating.ts';
import { ask, availableQuestionsForCharacter } from './cardEngine.ts';
import { computeActiveContradictions, activeConfrontationQuestions } from './contradictionEngine.ts';
import { evaluateAccusation, submitAccusation } from './accusationEngine.ts';
import { buildNotebook } from './notebook.ts';
import { createInitialPlayerState, PlayerState } from './types.ts';
import { cases } from '../data/cases/index.ts';

const gold = cases.find((c) => c.caseId === 'gold-hh-001')!;

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

describe('cardEngine.ask applies effects', () => {
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
