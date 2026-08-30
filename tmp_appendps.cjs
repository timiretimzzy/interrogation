// Appends the Phase 3.3 record to PROJECT_STATE.md in the run_command fs.
const fs = require('fs');
const p = 'PROJECT_STATE.md';
let s = fs.readFileSync(p, 'utf8');
const section = `

---

## Phase 3.3 - Gameplay content correction: response chronology (CODE COMPLETE)

**Scope split (per instruction):** the user owns creativity (case content depth - 4-7
characters, 25-40 questions, follow-ups, 6-10 evidence, 6-12 leads, contradictions, discovery
paths). The agent owns code. The two supplied case JSONs (gold-vn-011, gold-bm-010) are
authoring-format examples for the creative track and were NOT added to the production case
directory (case ingestion remains explicitly out of scope). This phase fixes the response
presentation / conversation-ordering defect in the runtime.

### Problem 1 - Response placement/order (the actual code defect)
The global Transcript (Case Board notebook projection) was built by buildNotebook iterating
state.interrogations per character in object-key order. So a cross-character sequence - ask
Amelia, ask Daniel, ask Amelia again - was rendered as all of Amelia's questions, then all of
Daniel's, destroying real chronology. Each InterrogationRecord also carried no global ordering
or character attribution, so the merged transcript could not be reconstructed in interaction
order. This is exactly the symptom described in Part 1/4: questions then detached responses,
plus a wrong interleave on character switch.

### Root-cause fix (state model + rendering)
- src/core/types.ts - added characterId and sequence to InterrogationRecord; added a
  conversationSeq counter to PlayerState (seeded in createInitialPlayerState).
- src/core/cardEngine.ts - ask() now assigns characterId + a monotonic sequence (guarded for old
  saves lacking the counter) and increments conversationSeq; cloneState preserves it.
- src/core/notebook.ts - buildNotebook now collects every record with its sequence (falling back
  to a stable per-iteration counter for pre-Phase-3.3 saves that lack it) and sorts the merged
  transcript by global sequence, so the global chronology is correct across character switches.
  No visual hack - the data model now carries the interaction order.
- src/ui/Transcript.tsx - renders each entry as a clear player question -> character response
  pair (You asked / character name + response), in chronological order.
- src/ui/CharacterPanel.tsx - the active character's Asked list now shows each question with its
  response directly beneath it (Q+R pair), not just the question text.
- src/style.css - added transcript Q/A grouping styles.
- src/core/solver.ts - updated its simulated PlayerState construction to the new record shape so
  the solver still typechecks and runs.

### Content-depth support (no code change needed)
The engine already supports the richer standard from Parts 6-11: arbitrary character/question/
evidence/contradiction/lead counts, follow-up chaining via unlocks, contradictions surfaced by
createsContradiction / surfaceWhen, and multiple independent solution paths. No engine change was
required for depth - only the ordering defect. The two reference cases demonstrate the target
shape; their raw/authoring schema is normalized by scripts/normalize-case.mjs on the creative
track.

### Verification
- npm run typecheck -> clean.
- npm test -> 117/117 (added src/core/transcript.test.ts: cross-character order, monotonic
  sequence/characterId on records, interleave A->B->A, and pre-Phase-3.3 save migration).
- npm run build -> success (42 modules, PWA emitted).
- npm run validate:cases -> 84/84; npm run validate:build -> passed (initial JS ~77 KB gzipped).

### Not done / out of scope
- The two new cases were NOT added (creative-owned; ingestion deferred).
- No deployment change; GitHub Pages / Vercel serving remains as left in Phase 3.2/3.1.

**Next action:** owner reviews the chronological Transcript/Asked rendering locally (npm run
dev); creative track authors the deeper cases and runs them through scripts/normalize-case.mjs
plus the same gate suite. Only after the richer cases load should case ingestion proceed.
`;

if (!s.endsWith('\n')) s += '\n';
s += section;
fs.writeFileSync(p, s);
console.log('appended, bytes=' + s.length);
