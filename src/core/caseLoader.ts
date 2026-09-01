// Case loader + schema/referential validation. Validates a CaseFile structurally
// and for referential integrity (no dangling ids). The engine is data-agnostic;
// this module only checks that the data it receives is well-formed. "Lazy truth"
// is realised by keeping each CaseFile in its own module so it can be loaded on
// demand; the runtime never surfaces `truth` to the player.

import type {
  CaseFile,
  ContradictionId,
  FactId,
  QuestionId,
} from './types.ts';

export interface CaseValidation {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCase(caseFile: CaseFile): CaseValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const e = (msg: string) => errors.push(msg);

  if (!caseFile.caseId) e('Missing caseId');
  if (!caseFile.title) e('Missing title');
  if (!caseFile.characters || caseFile.characters.length === 0) e('No characters');
  if (!caseFile.questions || caseFile.questions.length === 0) e('No questions');

  const charIds = new Set(caseFile.characters.map((c) => c.id));
  for (const c of caseFile.characters) {
    if (!c.knowledge) e(`Character ${c.id} missing knowledge`);
  }

  const clueIds = new Set((caseFile.clues ?? []).map((c) => c.id));
  const evidenceIds = new Set((caseFile.evidence ?? []).map((e2) => e2.id));
  const factIds = new Set((caseFile.facts ?? []).map((f) => f.id));
  const questionIds = new Set(caseFile.questions.map((q) => q.id));
  const statementIds = new Set((caseFile.statements ?? []).map((s) => s.id));
  const contradictionIds = new Set(caseFile.contradictions.map((c) => c.id));

  // Truth consistency.
  if (caseFile.truth?.culpritId && !charIds.has(caseFile.truth.culpritId)) {
    e(`truth.culpritId ${caseFile.truth.culpritId} is not in characters`);
  }

  // Questions.
  for (const q of caseFile.questions) {
    for (const target of q.targetCharacterIds) {
      if (!charIds.has(target)) e(`Question ${q.id} targets unknown character ${target}`);
    }
    if (!q.responses || Object.keys(q.responses).length === 0) {
      e(`Question ${q.id} has no responses`);
    }
    for (const [charId, contexts] of Object.entries(q.responses)) {
      if (!charIds.has(charId)) e(`Question ${q.id} response for unknown character ${charId}`);
      if (!contexts || contexts.length === 0) e(`Question ${q.id}/${charId} has no contexts`);
      for (const rc of contexts) {
        if (!rc.variants || rc.variants.length === 0) e(`Question ${q.id}/${charId} has no variants`);
        for (const v of rc.variants) {
          if (typeof v.weight !== 'number' || v.weight < 0) {
            e(`Question ${q.id}/${charId} variant ${v.id} has invalid weight`);
          }
          for (const u of v.unlocks ?? []) {
            if (!questionIds.has(u)) e(`Variant ${v.id} unlocks unknown question ${u}`);
          }
          for (const d of v.discloses ?? []) {
            if (factIds.size > 0 && !factIds.has(d.factId)) {
              e(`Variant ${v.id} discloses unknown fact ${d.factId}`);
            }
          }
          if (v.createsContradiction && !contradictionIds.has(v.createsContradiction)) {
            e(`Variant ${v.id} creates unknown contradiction ${v.createsContradiction}`);
          }
          for (const r of v.reveals ?? []) {
            if (!clueIds.has(r) && !evidenceIds.has(r)) e(`Variant ${v.id} reveals unknown clue/evidence ${r}`);
          }
        }
      }
    }
    // Availability gating references.
    if (q.availability.type === 'unlocked') {
      checkGating(q.availability.when, `Question ${q.id} availability`, e, {
        clueIds,
        evidenceIds,
        statementIds,
        questionIds,
        contradictionIds,
      });
    }
  }

  // Evidence supports existing facts.
  for (const ev of caseFile.evidence ?? []) {
    for (const f of ev.supports) {
      if (factIds.size > 0 && !factIds.has(f)) e(`Evidence ${ev.id} supports unknown fact ${f}`);
    }
  }

  // Contradictions.
  for (const c of caseFile.contradictions) {
    for (const ref of c.statementRefs ?? []) {
      if (statementIds.size > 0 && !statementIds.has(ref)) {
        e(`Contradiction ${c.id} references unknown statement ${ref}`);
      }
    }
    if (c.confrontationQuestionId && !questionIds.has(c.confrontationQuestionId)) {
      e(`Contradiction ${c.id} confrontationQuestionId ${c.confrontationQuestionId} unknown`);
    }
    if (c.surfaceWhen) {
      checkGating(c.surfaceWhen, `Contradiction ${c.id} surfaceWhen`, e, {
        clueIds,
        evidenceIds,
        statementIds,
        questionIds,
        contradictionIds,
      });
    }
  }

  // Accusation.
  const sol = caseFile.accusation?.correctSolution ?? {};
  for (const dim of caseFile.accusation?.dimensions ?? []) {
    const values = dim.options.map((o) => (typeof o === 'string' ? o : o.value));
    if (!values.includes(dim.correctValue)) {
      e(`Accusation dimension ${dim.id} correctValue ${dim.correctValue} not in options`);
    }
    if (!(dim.id in sol)) {
      e(`Accusation correctSolution missing dimension ${dim.id}`);
    } else if (!values.includes(sol[dim.id])) {
      e(`Accusation correctSolution.${dim.id} ${sol[dim.id]} not in options`);
    } else if (sol[dim.id] !== dim.correctValue) {
      e(`Accusation correctSolution.${dim.id} must match dimension correctValue`);
    }
    for (const requirement of dim.proofRequirements ?? []) {
      if (!factIds.has(requirement) && !evidenceIds.has(requirement) && !clueIds.has(requirement)
        && !statementIds.has(requirement)) {
        e(`Accusation dimension ${dim.id} proof requirement ${requirement} is unknown`);
      }
    }
    for (const optionId of Object.keys(dim.diagnosticOnMismatch ?? {})) {
      if (!values.includes(optionId)) {
        e(`Accusation dimension ${dim.id} diagnostic references unknown option ${optionId}`);
      } else if (optionId === dim.correctValue) {
        e(`Accusation dimension ${dim.id} diagnostic cannot target correctValue`);
      }
    }
  }
  const accusationDimensions = new Map(
    (caseFile.accusation?.dimensions ?? []).map((dimension) => [dimension.id, dimension]),
  );
  for (const claim of caseFile.solutionClaims ?? []) {
    const dimension = accusationDimensions.get(claim.dimension);
    if (!dimension) {
      e(`Solution claim ${claim.id} references unknown accusation dimension ${claim.dimension}`);
    } else if (claim.correctValue !== dimension.correctValue) {
      e(`Solution claim ${claim.id} correctValue must match accusation dimension ${claim.dimension}`);
    }
    for (const evidenceId of claim.requiredEvidenceIds) {
      if (!evidenceIds.has(evidenceId)) {
        e(`Solution claim ${claim.id} requires unknown evidence ${evidenceId}`);
      }
    }
  }

  // Solution paths reference real facts.
  for (const p of caseFile.solutionPaths ?? []) {
    for (const f of p.criticalFacts ?? []) {
      if (factIds.size > 0 && !factIds.has(f)) e(`Solution path ${p.id} references unknown fact ${f}`);
    }
  }

  if (errors.length === 0 && warnings.length > 0) {
    /* ok with warnings */
  }

  return { ok: errors.length === 0, errors, warnings };
}

interface GatingRefs {
  clueIds: Set<string>;
  evidenceIds: Set<string>;
  statementIds: Set<string>;
  questionIds: Set<string>;
  contradictionIds: Set<string>;
}

function checkGating(
  cond: { all?: any[]; any?: any[] },
  label: string,
  e: (m: string) => void,
  refs: GatingRefs,
): void {
  const atoms = [...(cond.all ?? []), ...(cond.any ?? [])];
  for (const a of atoms) {
    switch (a.kind) {
      case 'clue':
        if (!refs.clueIds.has(a.id)) e(`${label}: gating references unknown clue ${a.id}`);
        break;
      case 'evidence':
        if (!refs.evidenceIds.has(a.id)) e(`${label}: gating references unknown evidence ${a.id}`);
        break;
      case 'statement':
        if (!refs.statementIds.has(a.id)) e(`${label}: gating references unknown statement ${a.id}`);
        break;
      case 'questionAsked':
        if (!refs.questionIds.has(a.id)) e(`${label}: gating references unknown question ${a.id}`);
        break;
      case 'contradictionActive':
        if (!refs.contradictionIds.has(a.id)) e(`${label}: gating references unknown contradiction ${a.id}`);
        break;
      case 'context':
        // Context ids are derived at runtime; only structural sanity here.
        if (typeof a.id !== 'string') e(`${label}: context gating has invalid id`);
        break;
      default:
        e(`${label}: unknown gating atom kind ${(a as any).kind}`);
    }
  }
}

export interface CaseIndexEntry {
  caseId: string;
  title: string;
  difficulty: string;
  genre: string;
}

/** Build a lightweight index (no truth) for the case-select UI. */
export function caseIndex(cases: CaseFile[]): CaseIndexEntry[] {
  return cases.map((c) => ({
    caseId: c.caseId,
    title: c.title,
    difficulty: c.difficulty,
    genre: c.genre,
  }));
}

export function getCaseFile(cases: CaseFile[], caseId: string): CaseFile | null {
  return cases.find((c) => c.caseId === caseId) ?? null;
}

export type { QuestionId, FactId, ContradictionId };
