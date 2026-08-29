import { describe, it, expect } from 'vitest';
import { cases } from '../data/cases/index.ts';
import { validateCase } from './caseLoader.ts';
import { solveCase } from './solver.ts';
import {
  createInitialPlayerState,
  CaseFile,
  PlayerState,
} from './types.ts';
import { allAvailableQuestions, ask } from './cardEngine.ts';
import { selectResponse } from './responseSelector.ts';
import { submitAccusation, evaluateAccusation } from './accusationEngine.ts';

function valueOf(o: string | { value: string; label?: string }): string {
  return typeof o === 'string' ? o : o.value;
}

// Facts disclosed by asking a question of a character (union over that char's
// variants, since the normalizer assigns each char a uniform disclosure set).
function disclosedBy(caseFile: CaseFile, qId: string, charId: string): Set<string> {
  const out = new Set<string>();
  const contexts = caseFile.questions.find((q) => q.id === qId)?.responses[charId] ?? [];
  for (const rc of contexts) {
    for (const v of rc.variants) {
      for (const d of v.discloses ?? []) out.add(d.factId);
    }
  }
  return out;
}

// Greedy, path-faithful walk: prefer questions that disclose the path's
// critical facts until they are all disclosed (or actions run out).
function walkPath(caseFile: CaseFile, criticalFacts: string[], seed: number) {
  let state = createInitialPlayerState(caseFile, seed);
  const disclosed = new Set<string>();
  const asked = new Set<string>();
  const availableConfrontations = new Set<string>();
  let guard = 0;
  while (guard++ < 500 && state.actionsRemaining > 0) {
    const avail = allAvailableQuestions(caseFile, state);
    for (const q of caseFile.questions) {
      if (
        q.availability.type === 'unlocked' &&
        avail.some((a) => a.id === q.id) &&
        caseFile.contradictions.some((c) => c.confrontationQuestionId === q.id)
      ) {
        availableConfrontations.add(q.id);
      }
    }
    const unasked = avail.filter((q) => !asked.has(q.id));
    if (unasked.length === 0) break;
    const unscored = unasked.map((q) => {
      const char = q.targetCharacterIds[0];
      let score = 0;
      for (const f of disclosedBy(caseFile, q.id, char)) {
        if (criticalFacts.includes(f)) score += 1;
      }
      return { q, char, score };
    });
    unscored.sort((a, b) => b.score - a.score);
    const pick = unscored[0];
    const sel = selectResponse(caseFile, state, pick.char, pick.q.id);
    if (sel) for (const d of sel.variant.discloses ?? []) disclosed.add(d.factId);
    state = ask(caseFile, state, pick.char, pick.q.id).state;
    asked.add(pick.q.id);
    if (criticalFacts.every((f) => disclosed.has(f))) break;
  }
  return { state, disclosed, asked, availableConfrontations };
}

function correctAnswers(caseFile: CaseFile): Record<string, string> {
  const ans: Record<string, string> = {};
  for (const d of caseFile.accusation.dimensions) ans[d.id] = d.correctValue;
  return ans;
}

function wrongAnswers(caseFile: CaseFile): Record<string, string> {
  const ans = correctAnswers(caseFile);
  const d0 = caseFile.accusation.dimensions[0];
  const values = d0.options.map(valueOf);
  const wrong = values.find((v) => v !== d0.correctValue) ?? values[0];
  ans[d0.id] = wrong;
  return ans;
}

describe('seed cases pass schema + solver gates', () => {
  for (const c of cases) {
    it(`${c.caseId}: schema valid`, () => {
      const v = validateCase(c);
      if (!v.ok) console.error(`${c.caseId} schema errors:`, v.errors);
      expect(v.ok, v.errors.join('; ')).toBe(true);
    });

    it(`${c.caseId}: solver ok (INV-114 / INV-115 / paths)`, () => {
      const r = solveCase(c);
      if (!r.ok) console.error(`${c.caseId} solver:`, JSON.stringify(r, null, 2));
      expect(r.ok, `solvable=${r.solvable} worst=${r.worstCaseSolvable} paths=${r.independentPaths} errors=${r.errors.join('|')}`).toBe(true);
    });
  }
});

describe('runtime playthrough per case (engine, not just solver)', () => {
  for (const c of cases) {
    const initialQs = c.questions.filter((q) => q.availability.type === 'initial').length;

    it(`${c.caseId}: full investigation walk is traversable and a correct accusation wins`, () => {
      // Greedy walk asking every available question in turn.
      let state = createInitialPlayerState(c, 4242);
      const asked = new Set<string>();
      const confrontUnlocked = new Set<string>();
      let guard = 0;
      while (guard++ < 500 && state.actionsRemaining > 0) {
        const avail = allAvailableQuestions(c, state);
        for (const q of c.questions) {
          if (
            q.availability.type === 'unlocked' &&
            avail.some((a) => a.id === q.id) &&
            c.contradictions.some((c2) => c2.confrontationQuestionId === q.id)
          ) {
            confrontUnlocked.add(q.id);
          }
        }
        const next = avail.find((q) => !asked.has(q.id));
        if (!next) break;
        state = ask(c, state, next.targetCharacterIds[0], next.id).state;
        asked.add(next.id);
      }
      expect(asked.size).toBeGreaterThanOrEqual(initialQs);
      if (c.contradictions.some((x) => x.confrontationQuestionId)) {
        expect(confrontUnlocked.size).toBeGreaterThan(0);
      }
      const won = submitAccusation(c, state, correctAnswers(c));
      expect(won.status).toBe('won');
      const lost = submitAccusation(c, state, wrongAnswers(c));
      expect(lost.status).toBe('lost');
      expect(evaluateAccusation(c, wrongAnswers(c)).won).toBe(false);
    });

    it(`${c.caseId}: response selection is deterministic per seed and varies across seeds`, () => {
      const q0 = c.questions.find((q) => q.availability.type === 'initial')!;
      const char0 = q0.targetCharacterIds[0];
      const a1 = selectResponse(c, createInitialPlayerState(c, 1), char0, q0.id)?.variant.id;
      const a1b = selectResponse(c, createInitialPlayerState(c, 1), char0, q0.id)?.variant.id;
      expect(a1).toBe(a1b); // same seed -> same response (refresh-safe)
      const seen = new Set<string>();
      for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const id = selectResponse(c, createInitialPlayerState(c, seed), char0, q0.id)?.variant.id;
        if (id) seen.add(id);
      }
      expect(seen.size).toBeGreaterThanOrEqual(1);
      // Variation: with weighted questions, multiple seeds should not collapse to one variant.
      expect(seen.size).toBeGreaterThan(1);
    });
  }
});

describe('each documented solution path reaches its critical facts through the engine', () => {
  for (const c of cases) {
    const paths = c.solutionPaths ?? [];
    it(`${c.caseId}: has >= minimumIndependentSolutionPaths documented paths`, () => {
      const min = c.qualityGates?.minimumIndependentSolutionPaths ?? 2;
      expect(paths.length).toBeGreaterThanOrEqual(min);
    });

    for (const p of paths) {
      it(`${c.caseId} / ${p.id}: path discloses all its critical facts and supports a win`, () => {
        const criticalFacts = p.criticalFacts ?? [];
        if (criticalFacts.length === 0) return;
        const { disclosed, state } = walkPath(c, criticalFacts, 99);
        const missing = criticalFacts.filter((f) => !disclosed.has(f));
        if (missing.length > 0) {
          console.error(`${c.caseId}/${p.id} missing facts:`, missing, 'disclosed=', [...disclosed]);
        }
        expect(missing.length, `missing=${missing.join(',')}`).toBe(0);
        expect(submitAccusation(c, state, correctAnswers(c)).status).toBe('won');
      });
    }
  }
});
