// Retargeted solver. Simulates investigation strategies over the (question,
// character, variant) graph and confirms the case is fair and solvable:
//   - Solvable: a state disclosing every Tier-A critical fact is reachable
//     (optimistic upper bound on information).
//   - INV-114 redundancy: every Tier-A critical fact is disclosed (any variant)
//     by >= 2 independent question routes.
//   - INV-115 worst-case: the minimum-disclosure variant of each asked question
//     still leaves every critical fact obtainable via >= 1 route, and the
//     worst-case graph remains solvable.
//   - Independent solution paths: >= minimumIndependentSolutionPaths distinct
//     starting questions can each reach a full-disclosure state.
//
// The solver reasons only over IDs and effect edges (discloses/reveals/unlocks/
// createsContradiction). It never reads case content.

import { gatingSatisfied } from './gating.ts';
import type { CaseFile, FactId, PlayerState, ResponseVariant } from './types.ts';

const MAX_STATES = 60000;

interface SimState {
  clues: Set<string>;
  evidence: Set<string>;
  statements: Set<string>;
  asked: Set<string>;
  contradictions: Set<string>;
  contexts: Set<string>;
  facts: Set<FactId>;
  unlocked: Set<string>;
}

function freshSim(): SimState {
  return {
    clues: new Set(),
    evidence: new Set(),
    statements: new Set(),
    asked: new Set(),
    contradictions: new Set(),
    contexts: new Set(['initial']),
    facts: new Set(),
    unlocked: new Set(),
  };
}

function keyOf(s: SimState): string {
  const arr = (x: Set<string>) => [...x].sort().join(',');
  return [
    arr(s.clues),
    arr(s.evidence),
    arr(s.statements),
    arr(s.asked),
    arr(s.contradictions),
    arr(s.contexts),
    arr(s.facts),
    arr(s.unlocked),
  ].join('|');
}

function toPlayerState(caseFile: CaseFile, s: SimState): PlayerState {
  return {
    caseId: caseFile.caseId,
    sessionSeed: 0,
    attemptNonce: 0,
    interrogations: Object.fromEntries(
      [...s.asked].map((qId) => [
        qId,
        [{ questionId: qId, variantId: 'sim', text: '', contextId: 'initial', kind: '' }],
      ]),
    ),
    recordedStatements: [...s.statements],
    discoveredClues: [...s.clues],
    discoveredEvidence: [...s.evidence],
    unlockedQuestions: [...s.unlocked],
    activeContradictions: [...s.contradictions],
    flaggedContradictions: [],
    contextSwitches: [...s.contexts],
    actionsRemaining: caseFile.playerRules.investigationActions,
    status: 'playing',
  };
}

function criticalFactIds(caseFile: CaseFile): FactId[] {
  return (caseFile.facts ?? [])
    .filter((f) => f.tier === 'A' && f.critical)
    .map((f) => f.id);
}

interface VariantOutcome {
  discloses: FactId[];
  reveals: string[];
  unlocks: string[];
  creates: string[];
}

function outcomeOf(variant: ResponseVariant): VariantOutcome {
  return {
    discloses: (variant.discloses ?? []).map((d) => d.factId),
    reveals: variant.reveals ?? [],
    unlocks: variant.unlocks ?? [],
    creates: variant.createsContradiction ? [variant.createsContradiction] : [],
  };
}

function eligibleVariants(variants: ResponseVariant[], contexts: Set<string>): ResponseVariant[] {
  return variants.filter(
    (v) => v.requiresContext === undefined || contexts.has(v.requiresContext),
  );
}

function worstVariant(variants: ResponseVariant[]): ResponseVariant {
  let best = variants[0];
  let bestDisclose = best.discloses?.length ?? 0;
  let bestFull = best.discloses?.filter((d) => d.clarity === 'full').length ?? 0;
  for (const v of variants) {
    const dis = v.discloses?.length ?? 0;
    const full = v.discloses?.filter((d) => d.clarity === 'full').length ?? 0;
    if (dis < bestDisclose || (dis === bestDisclose && full < bestFull)) {
      best = v;
      bestDisclose = dis;
      bestFull = full;
    }
  }
  return best;
}

function applyMove(
  caseFile: CaseFile,
  s: SimState,
  qId: string,
  outcome: VariantOutcome,
): SimState {
  const next: SimState = {
    clues: new Set(s.clues),
    evidence: new Set(s.evidence),
    statements: new Set(s.statements),
    asked: new Set(s.asked),
    contradictions: new Set(s.contradictions),
    contexts: new Set(s.contexts),
    facts: new Set(s.facts),
    unlocked: new Set(s.unlocked),
  };
  next.asked.add(qId);
  next.contexts.add(`after_question_${qId}`);
  for (const f of outcome.discloses) next.facts.add(f);
  for (const c of outcome.reveals) {
    next.clues.add(c);
    next.contexts.add(`after_clue_${c}`);
      if (caseFile.evidence?.some((e) => e.id === c)) {
        next.evidence.add(c);
        next.contexts.add(`after_evidence_${c}`);
      }
  }
  for (const u of outcome.unlocks) next.unlocked.add(u);
  for (const c of outcome.creates) {
    next.contradictions.add(c);
    next.contexts.add(`after_contradiction_${c}`);
  }
  // Force-unlock confrontation cards of active contradictions.
  for (const c of caseFile.contradictions) {
    if (c.confrontationQuestionId && next.contradictions.has(c.id)) {
      next.unlocked.add(c.confrontationQuestionId);
    }
  }
  return next;
}

function availableQuestions(caseFile: CaseFile, s: SimState): { qId: string; charId: string }[] {
  const ps = toPlayerState(caseFile, s);
  const out: { qId: string; charId: string }[] = [];
  for (const q of caseFile.questions) {
    const available =
      q.availability.type === 'initial' ||
      s.unlocked.has(q.id) ||
      gatingSatisfied(caseFile, ps, q.availability.when);
    if (!available) continue;
    for (const c of q.targetCharacterIds) out.push({ qId: q.id, charId: c });
  }
  return out;
}

function moveOutcome(
  caseFile: CaseFile,
  s: SimState,
  qId: string,
  charId: string,
  mode: 'optimistic' | 'worst',
): VariantOutcome {
  const q = caseFile.questions.find((x) => x.id === qId)!;
  const contexts = q.responses[charId] ?? [];
  const qUnlocks = q.unlocks ?? [];
  const rc = contexts.find((c) => c.context === 'initial') ?? contexts[0];
  if (!rc) return { discloses: [], reveals: [], unlocks: [...qUnlocks], creates: [] };
  if (mode === 'optimistic') {
    const merged: VariantOutcome = { discloses: [], reveals: [], unlocks: [], creates: [] };
    for (const v of rc.variants) {
      const o = outcomeOf(v);
      merged.discloses.push(...o.discloses);
      merged.reveals.push(...o.reveals);
      merged.unlocks.push(...o.unlocks, ...qUnlocks);
      merged.creates.push(...o.creates);
    }
    return merged;
  }
  const eligible = eligibleVariants(rc.variants, s.contexts);
  const pool = eligible.length > 0 ? eligible : rc.variants;
  const worst = outcomeOf(worstVariant(pool));
  worst.unlocks.push(...qUnlocks);
  return worst;
}

function simulate(caseFile: CaseFile, mode: 'optimistic' | 'worst'): { allReached: boolean; disclosed: Set<FactId> } {
  const critical = criticalFactIds(caseFile);
  const start = freshSim();
  const visited = new Set<string>([keyOf(start)]);
  let queue: SimState[] = [start];
  const best = new Set<FactId>();
  let states = 0;

  while (queue.length > 0 && states < MAX_STATES) {
    const curr = queue.shift()!;
    states++;
    for (const f of curr.facts) best.add(f);
    if (critical.every((f) => curr.facts.has(f))) return { allReached: true, disclosed: best };
    for (const m of availableQuestions(caseFile, curr)) {
      const outcome = moveOutcome(caseFile, curr, m.qId, m.charId, mode);
      const next = applyMove(caseFile, curr, m.qId, outcome);
      const k = keyOf(next);
      if (visited.has(k)) continue;
      visited.add(k);
      queue.push(next);
    }
  }
  return { allReached: critical.every((f) => best.has(f)), disclosed: best };
}

function simulateFrom(caseFile: CaseFile, start: SimState): boolean {
  const critical = criticalFactIds(caseFile);
  if (critical.every((f) => start.facts.has(f))) return true;
  const visited = new Set<string>([keyOf(start)]);
  let queue: SimState[] = [start];
  let states = 0;
  while (queue.length > 0 && states < MAX_STATES) {
    const curr = queue.shift()!;
    states++;
    if (critical.every((f) => curr.facts.has(f))) return true;
    for (const m of availableQuestions(caseFile, curr)) {
      const outcome = moveOutcome(caseFile, curr, m.qId, m.charId, 'optimistic');
      const next = applyMove(caseFile, curr, m.qId, outcome);
      const k = keyOf(next);
      if (visited.has(k)) continue;
      visited.add(k);
      queue.push(next);
    }
  }
  return false;
}

export interface SolverReport {
  caseId: string;
  solvable: boolean;
  worstCaseSolvable: boolean;
  criticalFactsTotal: number;
  criticalFactsDisclosed: number;
  independentPaths: number;
  minimumIndependentPaths: number;
  inv114: { fact: FactId; routes: number; ok: boolean }[];
  inv115: { fact: FactId; worstRoutes: number; ok: boolean }[];
  ok: boolean;
  errors: string[];
}

export function solveCase(caseFile: CaseFile): SolverReport {
  const errors: string[] = [];
  const critical = criticalFactIds(caseFile);
  const minimumIndependentPaths = caseFile.qualityGates?.minimumIndependentSolutionPaths ?? 2;

  const routesByFact = new Map<FactId, Set<string>>();
  for (const f of critical) routesByFact.set(f, new Set());
  for (const q of caseFile.questions) {
    for (const charId of Object.keys(q.responses)) {
      const contexts = q.responses[charId];
      for (const rc of contexts) {
        for (const v of rc.variants) {
          for (const d of v.discloses ?? []) {
            if (routesByFact.has(d.factId)) routesByFact.get(d.factId)!.add(q.id);
          }
        }
      }
    }
  }
  const inv114 = critical.map((f) => {
    const routes = routesByFact.get(f)!.size;
    return { fact: f, routes, ok: routes >= 2 };
  });

  const worstRoutesByFact = new Map<FactId, Set<string>>();
  for (const f of critical) worstRoutesByFact.set(f, new Set());
  for (const q of caseFile.questions) {
    for (const charId of Object.keys(q.responses)) {
      const contexts = q.responses[charId];
      const rc = contexts.find((c) => c.context === 'initial') ?? contexts[0];
      if (!rc) continue;
      const wv = worstVariant(rc.variants);
      for (const d of wv.discloses ?? []) {
        if (worstRoutesByFact.has(d.factId)) worstRoutesByFact.get(d.factId)!.add(q.id);
      }
    }
  }
  const inv115 = critical.map((f) => {
    const worstRoutes = worstRoutesByFact.get(f)!.size;
    return { fact: f, worstRoutes, ok: worstRoutes >= 1 };
  });

  const opt = simulate(caseFile, 'optimistic');
  const worst = simulate(caseFile, 'worst');

  let independentPaths = 0;
  const initialQs = caseFile.questions.filter((q) => q.availability.type === 'initial');
  for (const q0 of initialQs) {
    const s0 = freshSim();
    let reached = false;
    for (const charId of q0.targetCharacterIds) {
      const outcome = moveOutcome(caseFile, s0, q0.id, charId, 'optimistic');
      const after = applyMove(caseFile, s0, q0.id, outcome);
      if (simulateFrom(caseFile, after)) {
        reached = true;
        break;
      }
    }
    if (reached) independentPaths += 1;
  }

  const solvable = opt.allReached;
  const worstCaseSolvable = worst.allReached;
  if (critical.length === 0) errors.push('No Tier-A critical facts defined');
  if (!solvable) errors.push('Case is not solvable (cannot disclose all critical facts)');
  if (!worstCaseSolvable) errors.push('Case fails worst-case solvability (INV-115)');
  if (inv114.some((r) => !r.ok)) errors.push('Some critical fact lacks >=2 independent routes (INV-114)');
  if (inv115.some((r) => !r.ok)) errors.push('Some critical fact lacks a worst-case route (INV-115)');
  if (independentPaths < minimumIndependentPaths) {
    errors.push(`Only ${independentPaths} independent solution paths (need >= ${minimumIndependentPaths})`);
  }

  const ok =
    solvable &&
    worstCaseSolvable &&
    inv114.every((r) => r.ok) &&
    inv115.every((r) => r.ok) &&
    independentPaths >= minimumIndependentPaths &&
    errors.length === 0;

  return {
    caseId: caseFile.caseId,
    solvable,
    worstCaseSolvable,
    criticalFactsTotal: critical.length,
    criticalFactsDisclosed: opt.disclosed.size,
    independentPaths,
    minimumIndependentPaths,
    inv114,
    inv115,
    ok,
    errors,
  };
}
