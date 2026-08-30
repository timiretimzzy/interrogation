// Builds src/core/transcript.test.ts in the run_command filesystem.
const fs = require('fs');
const content = `import { describe, it, expect } from 'vitest';
import { cases } from '../data/cases/index.ts';
import { createInitialPlayerState, PlayerState } from './types.ts';
import { ask, availableQuestionsForCharacter } from './cardEngine.ts';
import { buildNotebook } from './notebook.ts';

const gold = cases.find((c) => c.caseId === 'gold-hh-001')!;

function askFirst(cf: typeof gold, s: PlayerState, cid: string): PlayerState {
  const q = availableQuestionsForCharacter(cf, s, cid)[0];
  if (!q) throw new Error('expected an available question for ' + cid);
  return ask(cf, s, cid, q.id).state;
}

describe('Phase 3.3 - conversation chronology', () => {
  it('global transcript preserves cross-character interaction order', () => {
    let s = createInitialPlayerState(gold, 7);
    const order = ['eleanor', 'daniel', 'theo'];
    for (const cid of order) s = askFirst(gold, s, cid);
    const nb = buildNotebook(gold, s);
    const names = nb.transcript.map((t) => t.characterName);
    const expected = order.map((id) => gold.characters.find((c) => c.id === id)!.name);
    expect(names).toEqual(expected);
  });

  it('records carry characterId + a monotonically increasing global sequence', () => {
    let s = createInitialPlayerState(gold, 7);
    const order = ['eleanor', 'daniel', 'theo'];
    for (const cid of order) s = askFirst(gold, s, cid);
    const allSeqs = Object.values(s.interrogations).flat().map((r) => r.sequence);
    expect(allSeqs).toEqual([0, 1, 2]);
    for (const cid of order) {
      const rec = s.interrogations[cid][0];
      expect(rec.characterId).toBe(cid);
      expect(typeof rec.sequence).toBe('number');
    }
  });

  it('back-to-back interleave (A -> B -> A) keeps chronology', () => {
    let s = createInitialPlayerState(gold, 11);
    s = askFirst(gold, s, 'eleanor');
    s = askFirst(gold, s, 'daniel');
    s = askFirst(gold, s, 'theo');
    const ids = buildNotebook(gold, s).transcript.map((t) => t.characterId);
    expect(ids).toEqual(['eleanor', 'daniel', 'theo']);
  });

  it('old saves without a sequence still project without throwing', () => {
    const s = createInitialPlayerState(gold, 3);
    const recs = (s.interrogations as Record<string, unknown>);
    recs['eleanor'] = [
      { questionId: 'Q001', variantId: 'v', text: 'r1', contextId: 'initial', kind: 'TRUTH' },
    ];
    recs['daniel'] = [
      { questionId: 'Q001', variantId: 'v', text: 'r2', contextId: 'initial', kind: 'TRUTH' },
    ];
    expect(() => buildNotebook(gold, s)).not.toThrow();
    const nb = buildNotebook(gold, s);
    expect(nb.transcript.length).toBe(2);
  });
});
`;
fs.writeFileSync('src/core/transcript.test.ts', content);
console.log('written bytes=' + content.length);
