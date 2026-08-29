// CRLF-safe in-place edits for Phase 2.2 fixes.
const fs = require('fs');
const path = require('path');
const root = process.cwd();

function read(p) {
  return fs.readFileSync(path.join(root, p), 'utf8');
}
function write(p, s) {
  fs.writeFileSync(path.join(root, p), s, 'utf8');
}
function replaceOnce(p, from, to, label) {
  const s = read(p);
  const i = s.indexOf(from);
  if (i < 0) {
    console.error('NOT FOUND in ' + p + ': ' + label);
    process.exitCode = 1;
    return;
  }
  if (s.indexOf(from, i + 1) >= 0) {
    console.error('MULTIPLE MATCHES in ' + p + ': ' + label);
    process.exitCode = 1;
    return;
  }
  write(p, s.replace(from, to));
  console.log('OK ' + p + ' :: ' + label);
}

// ---- Fix 1: cardEngine clue/evidence split ----
replaceOnce(
  'src/core/cardEngine.ts',
  "  // 3. Reveal clues / evidence (variant + question-level fallback).\r\n  const revealClues = [...(variant.reveals ?? []), ...(question.reveals ?? [])];\r\n  const revealEvidence = (variant.reveals as string[] | undefined)?.filter((id) =>\r\n    caseFile.evidence?.some((e) => e.id === id),\r\n  );\r\n  next.discoveredClues = addUnique(next.discoveredClues, ...revealClues);\r\n  if (revealEvidence && revealEvidence.length > 0) {\r\n    next.discoveredEvidence = addUnique(next.discoveredEvidence, ...revealEvidence);\r\n  }",
  "  // 3. Reveal clues / evidence (variant + question-level fallback).\r\n  // Evidence ids go ONLY to discoveredEvidence; clue ids go to discoveredClues.\r\n  // Mixing them (as the old code did) made the Reveal mislabel evidence as \"Clue:\".\r\n  const revealAll = [...(variant.reveals ?? []), ...(question.reveals ?? [])];\r\n  const revealClues = revealAll.filter((id) => caseFile.clues?.some((c) => c.id === id));\r\n  const revealEvidence = revealAll.filter((id) => caseFile.evidence?.some((e) => e.id === id));\r\n  next.discoveredClues = addUnique(next.discoveredClues, ...revealClues);\r\n  if (revealEvidence.length > 0) {\r\n    next.discoveredEvidence = addUnique(next.discoveredEvidence, ...revealEvidence);\r\n  }",
  'cardEngine clue/evidence split',
);

// ---- Fix 2: store exposes accusePanelOpen signal ----
replaceOnce(
  'src/ui/store.ts',
  "export const accusationDraft = signal<Record<string, string>>({});\r\nexport const error = signal<string | null>(null);",
  "export const accusationDraft = signal<Record<string, string>>({});\r\nexport const error = signal<string | null>(null);\r\n\r\n// Whether the (answer-spoiling) accusation form is currently expanded. Hidden by\r\n// default so the solution is not exposed in the initial UI payload (answer-security).\r\nexport const accusePanelOpen = signal<boolean>(false);",
  'store accusePanelOpen signal',
);

replaceOnce(
  'src/ui/store.ts',
  "  accusationDraft.value = Object.fromEntries(\r\n    buildAccusationForm(cf).map((d) => [d.id, '']),\r\n  );\r\n  error.value = null;\r\n  if (!existing) saveState(state);",
  "  accusationDraft.value = Object.fromEntries(\r\n    buildAccusationForm(cf).map((d) => [d.id, '']),\r\n  );\r\n  accusePanelOpen.value = false;\r\n  error.value = null;\r\n  if (!existing) saveState(state);",
  'store startCase resets accusePanelOpen',
);

// ---- Fix 3: Accusation panel hidden behind a toggle ----
const accPath = 'src/ui/Accusation.tsx';
let acc = read(accPath);
acc = acc.replace(
  'import {\r\n  accusationDimensions,\r\n  accusationDraft,\r\n  setAccusationValue,\r\n  submitAccusationNow,\r\n} from \'./store.ts\';',
  "import {\r\n  accusationDimensions,\r\n  accusationDraft,\r\n  setAccusationValue,\r\n  submitAccusationNow,\r\n  accusePanelOpen,\r\n} from './store.ts';",
);
if (acc.indexOf('accusePanelOpen') < 0) {
  console.error('Accusation import replace failed');
  process.exitCode = 1;
}
acc = acc.replace(
  'export function Accusation() {\r\n  const dims = accusationDimensions();\r\n',
  "export function Accusation() {\r\n  const dims = accusationDimensions();\r\n  if (!accusePanelOpen.value) {\r\n    return (\r\n      <section class=\"panel accusation-collapsed\">\r\n        <h2>Accusation</h2>\r\n        <p class=\"muted\">When you are ready to name who did it and why, make your accusation.</p>\r\n        <button class=\"accuse-open-btn\" onClick={() => (accusePanelOpen.value = true)}>\r\n          Make an accusation\r\n        </button>\r\n      </section>\r\n    );\r\n  }\r\n",
);
if (acc.indexOf('accuse-open-btn') < 0) {
  console.error('Accusation panel toggle replace failed');
  process.exitCode = 1;
}
acc = acc.replace(
  '      <button class="accuse-btn" onClick={() => submitAccusationNow()}>\r\n        Accuse\r\n      </button>',
  "      <button class=\"accuse-btn\" onClick={() => submitAccusationNow()}>\r\n        Accuse\r\n      </button>\r\n      <button class=\"link\" onClick={() => (accusePanelOpen.value = false)}>\r\n        Cancel\r\n      </button>",
);
write(accPath, acc);
console.log('OK ' + accPath + ' :: accusation toggle');

// ---- Fix 4: remove missing PWA icons to stop 404 ----
replaceOnce(
  'vite.config.ts',
  "        icons: [\r\n          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },\r\n          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },\r\n        ],",
  '        icons: [],',
  'vite.config remove missing icons',
);
