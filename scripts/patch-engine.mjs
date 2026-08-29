// One-off patch (CRLF-safe, indexOf-based). Aligns solver/validator with the
// engine's effect model: a revealed id that is evidence is tracked as evidence
// so evidence-gated questions unlock in simulation; and the validator accepts
// evidence ids in `reveals`.
import { readFileSync, writeFileSync } from 'node:fs';

function patch(path, needle, replacement) {
  const s = readFileSync(path, 'utf8');
  if (!s.includes(needle)) {
    console.log('SKIP (not found): ' + path);
    return;
  }
  writeFileSync(path, s.replace(needle, replacement));
  console.log('PATCHED: ' + path);
}

patch(
  'src/core/solver.ts',
  "    next.contexts.add(`after_clue_${c}`);",
  "    next.contexts.add(`after_clue_${c}`);\n      if (caseFile.evidence?.some((e) => e.id === c)) {\n        next.evidence.add(c);\n        next.contexts.add(`after_evidence_${c}`);\n      }",
);

patch(
  'src/core/caseLoader.ts',
  "            if (!clueIds.has(r)) e(`Variant ${v.id} reveals unknown clue ${r}`);",
  "            if (!clueIds.has(r) && !evidenceIds.has(r)) e(`Variant ${v.id} reveals unknown clue/evidence ${r}`);",
);
console.log('patched');
