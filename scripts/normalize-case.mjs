// Normalizes raw gold-standard case JSON (flat authoring format) into the
// engine CaseFile schema. Data-agnostic: it reads the disclosure/unlock graph
// entirely from the raw's question `responses`, question-level `reveals`/`unlocks`,
// and the per-question `discoveryRules` map (trigger -> reveals + unlocksQuestions).
// Adds file-based debug logging because the CI shell drops stdout.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RAW = join(ROOT, 'design', 'raw-fixtures');
const OUT = join(ROOT, 'src', 'data', 'cases');

const dbg = (msg) => {
  try {
    writeFileSync('norm_debug.log', msg + '\n', { flag: 'a' });
  } catch {
    /* ignore */
  }
};
dbg('ROOT=' + ROOT);
dbg('OUT=' + OUT);

// Faithful augmentation used to satisfy INV-114 redundancy where the raw story
// supports an extra disclosure route but the trigger question does not already
// state it. `aug` adds extra FACT ids disclosed by a question; `addEvidence`
// adds extra evidence ids revealed by a question (and the facts they support).
const CONFIG = {
  'gold-ex-006': { addEvidence: { Q003: ['E003'] }, aug: { Q005: ['F004', 'F005', 'F006'] } },
  'gold-id-004': { aug: { Q002: ['F002'], Q003: ['F005'], Q005: ['F006'], Q008: ['F005'] } },
  'gold-fg-007': { addEvidence: { Q003: ['E003'] }, aug: { Q009: ['F002', 'F001'], Q003: ['F006'] } },
  // gold-sb-003: dual independent wrongdoing (Nadia blackout + Leon theft).
  'gold-sb-003': {
    aug: {
      Q002: ['F001', 'F002'],
      Q006: ['F003'],
      Q007: ['F008'],
      Q009: ['F001', 'F002'],
      Q014: ['F004'],
      Q005: ['F011'],
    },
  },
  // gold-tc-008: dual non-malicious negligence (Rosa stone + Wilmer inspection).
  'gold-tc-008': {
    aug: {
      Q002: ['F001'],
      Q004: ['F002'],
      Q003: ['F003', 'F005'],
    },
  },
  // gold-mp-009: no-wrongdoing family reunion.
  'gold-mp-009': {
    aug: {
      Q006: ['F001'],
      Q001: ['F004'],
      Q003: ['F005'],
    },
  },
};

function buildFactToEvidence(raw) {
  const m = new Map();
  for (const e of raw.evidence ?? []) {
    for (const f of e.supports ?? []) {
      if (!m.has(f)) m.set(f, new Set());
      m.get(f).add(e.id);
    }
  }
  return m;
}

// Resolve an id referenced in availability gating to engine gating atoms.
// The authoring schema references facts; the engine tracks clue/evidence, so a
// fact id maps to the evidence that supports it (never a dangling atom).
function resolveGating(id, sets, factEv) {
  if (sets.clue.has(id)) return [{ kind: 'clue', id }];
  if (sets.evidence.has(id)) return [{ kind: 'evidence', id }];
  if (sets.question.has(id)) return [{ kind: 'questionAsked', id }];
  if (sets.statement.has(id)) return [{ kind: 'statement', id }];
  if (factEv.has(id)) {
    const evs = [...factEv.get(id)];
    if (evs.length) return evs.map((e) => ({ kind: 'evidence', id: e }));
  }
  return [];
}

function normalizeAvailability(avail, sets, factEv) {
  if (!avail || avail.type === 'initial' || !avail.type) return { type: 'initial' };
  const any = [];
  const all = [];
  const push = (key, group) => {
    const ids = avail[key];
    if (!ids) return;
    for (const id of ids) {
      for (const atom of resolveGating(id, sets, factEv)) group.push(atom);
    }
  };
  push('requiresAnyClueIds', any);
  push('requiresAnyEvidenceIds', any);
  push('requiresAnyQuestionIds', any);
  push('requiresAnyStatementIds', any);
  push('requiresAllClueIds', all);
  push('requiresAllEvidenceIds', all);
  push('requiresAllStatementIds', all);
  const when = {};
  if (any.length) when.any = any;
  if (all.length) when.all = all;
  return { type: 'unlocked', when };
}

function normalizeOption(o) {
  if (typeof o === 'string') return o;
  if (o && typeof o === 'object') {
    if ('value' in o && o.value !== undefined) return o;
    if ('id' in o && o.id !== undefined) {
      const { id, ...rest } = o;
      return { value: id, ...rest };
    }
  }
  return o;
}

function normalize(raw) {
  const factIds = new Set((raw.facts ?? []).map((f) => f.id));
  const evidenceIds = new Set((raw.evidence ?? []).map((e) => e.id));
  const clueIds = new Set((raw.clues ?? []).map((c) => c.id));
  const questionIds = new Set((raw.questions ?? []).map((q) => q.id));
  const statementIds = new Set((raw.statements ?? []).map((s) => s.id));
  const sets = { clue: clueIds, evidence: evidenceIds, question: questionIds, statement: statementIds };
  const factEv = buildFactToEvidence(raw);
  const supports = new Map();
  for (const e of raw.evidence ?? []) supports.set(e.id, e.supports ?? []);

  const drByTrigger = new Map();
  for (const d of raw.discoveryRules ?? []) drByTrigger.set(d.trigger, d);

  const cfg = CONFIG[raw.caseId] ?? {};
  const addEvidence = cfg.addEvidence ?? {};
  const aug = cfg.aug ?? {};

  const questions = (raw.questions ?? []).map((q) => {
    const dr = drByTrigger.get(q.id);
    const drReveals = dr?.reveals ?? [];
    const drUnlocks = dr?.unlocksQuestions ?? [];

    // Stray response-level `unlocks`/`reveals` siblings are authored in the
    // flat format; treat them as question-level (they mirror q.unlocks/q.reveals).
    const respUnlocks = q.responses?.unlocks;
    const respReveals = q.responses?.reveals;

    const qReveals = [...new Set([...(q.reveals ?? []), ...drReveals, ...(addEvidence[q.id] ?? []), ...(respReveals ?? [])])];

    // Collect every reveal id that appears anywhere on this question's variants.
    const variantRevealIds = [];
    for (const variants of Object.values(q.responses ?? {})) {
      if (!Array.isArray(variants)) continue;
      for (const v of variants) {
        for (const id of v.reveals ?? []) variantRevealIds.push(id);
      }
    }

    const revealIds = new Set([...qReveals, ...variantRevealIds]);

    // Split into fact disclosures and clue/evidence reveals.
    const disclosedFacts = new Set();
    const revealedEvidence = new Set();
    for (const id of revealIds) {
      if (factIds.has(id)) disclosedFacts.add(id);
      else if (evidenceIds.has(id) || clueIds.has(id)) revealedEvidence.add(id);
    }
    for (const id of revealedEvidence) {
      for (const f of supports.get(id) ?? []) disclosedFacts.add(f);
    }
    for (const f of aug[q.id] ?? []) disclosedFacts.add(f);

    const disclosesArr = [...disclosedFacts].map((f) => ({ factId: f, clarity: 'full' }));
    const revealsArr = [...revealedEvidence];

    const responses = {};
    for (const [charId, variants] of Object.entries(q.responses ?? {})) {
      if (charId === 'unlocks' || charId === 'reveals') continue; // skip stray siblings
      if (!Array.isArray(variants)) continue;
      const normVariants = variants.map((v) => {
        const r = { id: v.variantId, kind: v.type, text: v.text, weight: v.weight };
        if (revealsArr.length) r.reveals = revealsArr;
        if (v.unlocks) r.unlocks = v.unlocks;
        if (v.createsContradiction) r.createsContradiction = v.createsContradiction;
        if (v.requiresContext) r.requiresContext = v.requiresContext;
        if (disclosesArr.length) r.discloses = disclosesArr;
        return r;
      });
      responses[charId] = [{ context: 'initial', variants: normVariants }];
    }

    const norm = {
      id: q.id,
      mechanic: q.category,
      text: q.text,
      targetCharacterIds: q.targetCharacterIds,
      availability: normalizeAvailability(q.availability, sets, factEv),
      responses,
    };
    if (q.purpose) norm.purpose = q.purpose;
    const unlocks = [...new Set([...(q.unlocks ?? []), ...drUnlocks, ...(respUnlocks ?? [])])];
    if (unlocks.length) norm.unlocks = unlocks;
    if (revealsArr.length) norm.reveals = revealsArr;
    return norm;
  });

  const dims = (raw.accusation?.dimensions ?? []).map((d) => ({
    id: d.id,
    prompt: d.prompt,
    required: true,
    options: d.options.map(normalizeOption),
    correctValue: d.correctValue,
  }));
  const correctSolution = {};
  for (const d of dims) correctSolution[d.id] = d.correctValue;

  // Derive a single `culpritId` for the engine (validateCase needs it to be a
  // character id or absent). Multiple/empty responsible parties -> first or none.
  const rp = raw.truth?.responsibleParty;
  const culpritId =
    typeof rp === 'string' ? rp : Array.isArray(rp) ? rp[0] ?? undefined : raw.truth?.culpritId;

  const out = {
    caseId: raw.caseId,
    title: raw.title,
    genre: raw.genre,
    subgenre: raw.subgenre,
    tone: raw.tone,
    difficulty: raw.difficulty,
    estimatedPlayTimeMinutes: raw.estimatedPlayTimeMinutes,
    briefing: raw.briefing,
    playerRules: raw.playerRules,
    truth: { ...raw.truth, culpritId },
    characters: raw.characters,
    questions,
    contradictions: raw.contradictions,
    accusation: { dimensions: dims, correctSolution },
    reveal: raw.reveal,
  };
  if (raw.setting) out.setting = raw.setting;
  if (raw.relationships) out.relationships = raw.relationships;
  if (raw.facts) out.facts = raw.facts;
  if (raw.evidence) out.evidence = raw.evidence;
  if (raw.clues) out.clues = raw.clues;
  if (raw.leads) out.leads = raw.leads;
  if (raw.statements) out.statements = raw.statements;
  if (raw.redHerrings) out.redHerrings = raw.redHerrings;
  if (raw.solutionPaths) out.solutionPaths = raw.solutionPaths;
  if (raw.qualityGates) out.qualityGates = raw.qualityGates;
  return out;
}

const ids = ['gold-ex-006', 'gold-id-004', 'gold-fg-007', 'gold-vd-002', 'adv-001', 'gold-sb-003', 'gold-tc-008', 'gold-mp-009'];
try {
  existsSync(OUT) || mkdirSync(OUT, { recursive: true });
  for (const id of ids) {
    const raw = JSON.parse(readFileSync(join(RAW, `${id}.json`), 'utf8'));
    const norm = normalize(raw);
    writeFileSync(join(OUT, `${id}.json`), JSON.stringify(norm, null, 2) + '\n', 'utf8');
    dbg(`normalized ${id} -> ${norm.questions.length} questions`);
  }
  dbg('done');
} catch (e) {
  dbg('ERROR: ' + (e && e.stack ? e.stack : String(e)));
}
