// Persistence regression tests. These exercise the REAL LocalStorage-backed
// persistence code (jsdom provides a working `localStorage`, which the module
// uses directly). The contract under test:
//   - valid state round-trips through saveState/loadState
//   - corrupt / structurally-invalid / case-id-mismatched state is discarded
//     (loadState returns null and clears the bad key) so a refresh never
//     re-parses a broken blob; the app re-inits a fresh, recoverable case.
//   - the loader never throws on malformed input of any shape.
//
// NOTE: the storage key format below mirrors persistence.ts (STORAGE_PREFIX +
// VERSION). This is a contract test; if the prefix/version changes, update both.

import { describe, it, expect, beforeEach } from 'vitest';
import { cases } from '../data/cases/index.ts';
import {
  loadState,
  saveState,
  clearState,
  computeSessionSeed,
} from './persistence.ts';
import { createInitialPlayerState, PlayerState } from './types.ts';

const cf = cases.find((c) => c.caseId === 'gold-hh-001') ?? cases[0];
const caseId = cf.caseId;
const KEY = `the-interrogation:state:v1:${caseId}`;

function freshState(): PlayerState {
  return createInitialPlayerState(cf, computeSessionSeed(caseId, 0));
}

function writeRaw(value: string): void {
  localStorage.setItem(KEY, value);
}

function writeObj(obj: unknown): void {
  writeRaw(JSON.stringify(obj));
}

describe('persistence: valid state', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a valid PlayerState through save/load', () => {
    const s = freshState();
    saveState(s);
    const loaded = loadState(caseId);
    expect(loaded).not.toBeNull();
    expect(loaded).toMatchObject({ caseId, sessionSeed: s.sessionSeed, status: 'playing' });
    expect(loaded!.discoveredClues).toEqual([]);
    expect(loaded!.actionsRemaining).toBe(cf.playerRules.investigationActions);
  });

  it('preserves an in-progress investigation (clues, evidence, unlocks, theory)', () => {
    const s = freshState();
    s.discoveredClues = ['C001', 'C002'];
    s.discoveredEvidence = ['E001'];
    s.unlockedQuestions = ['Q013'];
    s.activeContradictions = ['CON002'];
    (s as any).theory = { suspect: 'julian', note: 'I think he lied about the timeline.' };
    saveState(s);
    const loaded = loadState(caseId);
    expect(loaded).not.toBeNull();
    expect(loaded!.discoveredClues).toEqual(['C001', 'C002']);
    expect(loaded!.unlockedQuestions).toEqual(['Q013']);
    expect(loaded!.theory).toEqual({ suspect: 'julian', note: 'I think he lied about the timeline.' });
  });

  it('preserves a completed (won) case across reload', () => {
    const s = freshState();
    s.status = 'won';
    (s as any).accusation = { culprit: 'julian', what: 'x', motive: 'y' };
    saveState(s);
    const loaded = loadState(caseId);
    expect(loaded!.status).toBe('won');
    expect(loaded!.accusation).toEqual({ culprit: 'julian', what: 'x', motive: 'y' });
  });
});

describe('persistence: corrupted / structurally-invalid state recovers without crashing', () => {
  beforeEach(() => localStorage.clear());

  it('Case 1 - malformed JSON string: rejected, discarded, no crash', () => {
    writeRaw('}{ this is not json');
    expect(() => loadState(caseId)).not.toThrow();
    expect(loadState(caseId)).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull(); // bad blob cleared
  });

  it('Case 2 - valid JSON but missing player-state properties: rejected', () => {
    writeObj({ caseId }); // no sessionSeed / actionsRemaining / status / arrays
    expect(loadState(caseId)).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('Case 3 - invalid action count (wrong type): rejected', () => {
    writeObj({ ...freshState(), actionsRemaining: 'lots' });
    expect(loadState(caseId)).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('Case 4 - unknown case ID stored under this key: rejected (no cross-case bleed)', () => {
    writeObj({ ...freshState(), caseId: 'ghost-case-that-does-not-exist' });
    expect(loadState(caseId)).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('Case 9 - impossible status transition (invalid status enum): rejected', () => {
    writeObj({ ...freshState(), status: 'winning' as unknown as string });
    expect(loadState(caseId)).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('Case 5/6 - unknown character/question IDs: loads without crashing (ID validity enforced by engine)', () => {
    const s = freshState();
    (s.interrogations as Record<string, unknown>)['ghost-character'] = [
      { questionId: 'Q999', variantId: 'v', text: 'x', contextId: 'initial', kind: 'TRUTH' },
    ];
    s.unlockedQuestions = ['Q999', 'Q1000'];
    writeObj(s);
    expect(() => loadState(caseId)).not.toThrow();
    const loaded = loadState(caseId);
    expect(loaded).not.toBeNull(); // structurally valid -> loads
    expect(loaded!.unlockedQuestions).toEqual(['Q999', 'Q1000']);
  });

  it('Case 7 - invalid accusation state object: loads without crashing (evaluated by engine)', () => {
    const s = freshState();
    s.status = 'won';
    (s as any).accusation = {}; // no dimension answers
    writeObj(s);
    expect(() => loadState(caseId)).not.toThrow();
    expect(loadState(caseId)).not.toBeNull();
  });

  it('Case 8 - malformed theory data: loads without crashing (theory never validity-checked at load)', () => {
    const s = freshState();
    (s as any).theory = { culprit: 123, motive: { nested: true } };
    writeObj(s);
    expect(() => loadState(caseId)).not.toThrow();
    const loaded = loadState(caseId);
    expect(loaded).not.toBeNull();
    expect(loaded!.theory).toEqual({ culprit: 123, motive: { nested: true } });
  });

  it('recovery produces a valid, fresh recoverable state (mirrors store.startCase)', () => {
    writeRaw('}{corrupt');
    expect(loadState(caseId)).toBeNull(); // corrupt discarded
    const recovered = createInitialPlayerState(cf, computeSessionSeed(caseId, 0));
    saveState(recovered);
    const loaded = loadState(caseId);
    expect(loaded).not.toBeNull();
    expect(loaded!.status).toBe('playing');
    expect(loaded!.actionsRemaining).toBe(cf.playerRules.investigationActions);
    expect(loaded!.discoveredClues).toEqual([]);
  });
});

describe('persistence: empty / cleared storage', () => {
  beforeEach(() => localStorage.clear());
  it('returns null when nothing is stored', () => {
    expect(loadState(caseId)).toBeNull();
  });
  it('clearState removes a stored key', () => {
    saveState(freshState());
    expect(loadState(caseId)).not.toBeNull();
    clearState(caseId);
    expect(loadState(caseId)).toBeNull();
  });
});
