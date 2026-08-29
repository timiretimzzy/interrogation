# Product Correction Report — The Interrogation

**Status:** PRODUCT CORRECTION UNDER REVIEW
**Phase:** Phase 0 reopened (product redefinition) → architecture proposal → Phase 2 rebuild deferred
**Date:** 2025-08-29
**Author:** Engineering (on explicit product-owner directive)

---

## 1. Executive Verdict

**YELLOW — concerns requiring human decision.**

The core engineering is sound and reusable. But the product that was built (a "identify the hidden
historical person by asking demographic attribute questions" puzzle) is **explicitly rejected** by the
product owner and is now classified as:

> **SUPERSEDED / REJECTED PRODUCT DIRECTION**

The new, canonical product is a **daily interactive crime-mystery interrogation game**: the player
investigates a deliberately constructed web of characters, motives, lies, timelines, secrets, and
contradictions, switching between characters, confronting them with contradictions, and submitting a
structured accusation.

This report documents the drift, the correction, and exactly which assets are reused vs replaced. No
source code has been changed. No Phase 3 work has begun.

---

## 2. What the Old Product Was

The previously-built and previously-Phase-2-verified prototype was a **secret-identifier deduction
game** with these defining properties:

- The win condition was **naming one hidden secret** selected from a candidate pool.
- For V1, "secret" was constrained to **Famous People** (DEC-005), and the candidate pool was a
  200–500 person library (`src/data/people/pool.json`).
- Question Cards were **demographic predicates** (`isMale`, `wonNobelPrize`, `fromEurope`, `birthYear <
  1900`) drawn from `src/data/cards/library.json`.
- Playing a card evaluated a predicate against the hidden person and produced one of four outcomes
  (TRUE / FALSE / DECEPTIVE / IRRELEVANT).
- The candidate list **auto-narrowed after every answer** (`src/core/candidateFilter.ts`), and the UI
  showed "Candidates: 10 → 3 → 1".
- The "make final guess" step was selecting the surviving candidate.
- The investigation budget was a fixed question count (8–12) whose only purpose was limiting binary
  search depth.

In short: **"Choose a question → filter candidates → identify a person."** The candidate list was the
game. This is precisely the pattern the directive forbids.

### Stop-Condition test (from the directive)

> "If I can replace the characters with Marie Curie and Albert Einstein and the game still
> fundamentally works the same way, the architecture is wrong."

Under `src/app.tsx` + `src/core/cardResolver.ts`, swapping the people pool for Curie/Einstein changes
**nothing** about the loop, the cards, or the deduction. The architecture is therefore confirmed wrong.

---

## 3. What the Corrected Product Is

**The Interrogation** is a **daily interactive crime-mystery interrogation game**, not a person
identifier.

- The player receives a short case briefing (2–6 sentences) describing a crime.
- The player meets a roster of **4–7 characters** (suspects, witnesses, victims' associates, etc.).
- The player interrogates a character by choosing **contextual, case-specific Question Cards**
  (timeline / relationship / evidence / motive / alibi / contradiction / pressure / follow-up).
- The character replies with **natural dialogue only** — no TRUE/FALSE badge, no "the witness lied"
  label, no auto-elimination.
- Statements are recorded in a **Case Board / Investigation Notebook**; discoveries **unlock new
  questions** and **surface possible contradictions**.
- The player switches freely between characters, revisits anyone, asks the same topic to several
  people, and **confronts** liars with earned contradiction cards.
- When ready, the player submits a **structured accusation** (who is responsible + what happened +
  why / motive + optional key evidence).
- The **reveal** reconstructs the whole truth so the player experiences the "I figured it out" moment.

The player fantasy is:

> "Something happened. Everyone knows something. Some are lying, some protecting someone, some
> mistaken, some telling the truth from a limited view. I need to figure out what actually happened."

---

## 4. Major Product Differences

| Dimension | Old (rejected) | Corrected |
|-----------|----------------|-----------|
| Core object | Name one hidden person | Solve the truth behind a crime |
| Win condition | Pick surviving candidate | Structured accusation (culprit + what + why + evidence) |
| Entity universe | Global 200–500 person pool | Per-case roster of 4–7 characters |
| Question semantics | Demographic predicate vs person | Character-specific interrogation statement |
| Answer shape | TRUE/FALSE/DECEPTIVE/IRRELEVANT label | Natural dialogue; truth state internal only |
| Deception handling | Badge shown at ask time ("the witness lied") | Never labelled; exposed via contradiction/evidence |
| IRRELEVANT meaning | Predicate doesn't apply to schema | Character lacks knowledge / question doesn't apply to their perspective |
| Player deduction | Auto candidate elimination | Player reasons over statements, timelines, relationships |
| Information model | Fact sheet of booleans | Canonical truth + per-character knowledge + statements |
| Cross-character logic | None (each card independent) | Contradiction graph, follow-up unlocks, knowledge graph |
| Budget purpose | Limit binary search | Prevent asking everything; force lead prioritization |
| Skill rewarded | Attribute elimination | Attention, memory, contradiction detection, inference |

---

## 5. Which Existing Requirements Are Invalid

The following requirements describe the rejected identifier product and are **invalid for V1 onward**:

| Requirement | Why invalid |
|-------------|-------------|
| FR-001 (secret fact-sheet attribute model) | Encodes a `(gender, birthYear, continent, professions[]…)` schema that cannot represent a case. |
| FR-002 (one demographic predicate per card) | Cards are interrogation statements, not `birthYear < 1900`. |
| FR-003 (four outcome types as player-visible labels) | TRUE/FALSE/DECEPTIVE/IRRELEVANT become **internal** truth states; players see only dialogue. |
| FR-004 (deception: known total count + fixed per-card) | Deception must be **undisclosed** and exposed by contradiction, not counted up front. |
| FR-005 (real-time candidate filtering) | Auto-elimination is now an anti-feature; player does the deduction. |
| DR-001 (Person schema) | Delete; replaced by `Character` (knowledge ≠ statements). |
| DR-002 / DR-003 / DR-004 (object/place/event cards, predicate GameState) | Obsolete; replaced by case/interrogation/player-state schema. |

**Still valid (re-expressed):**
- FR-006 (automated solver) — retargeted to **case-graph solvability** with ≥2 paths.
- FR-007 (Practice mode), FR-008 (Daily puzzle + streak), FR-009 (LocalStorage), FR-010 (Reveal),
  FR-011 (Offline), FR-012 (card presentation) — retained with corrected semantics.

---

## 6. Which Invariants Are Invalid

| Invariant | Status | Note |
|-----------|--------|------|
| INV-001 (answer secrecy) | **Re-interpret** | Canonical truth ships in a lazy case chunk (Category B). Still valid. |
| INV-002 (outcome determinism) | **Re-interpret** | Now `(case, character, question, discoveredContext) → one statement`. |
| INV-003 (no runtime LLM) | **Valid** | Non-negotiable. |
| INV-004 (deception known count) | **Invalid** | Contradicts "deception never labelled." |
| INV-005 (IRRELEVANT = schema inapplicability) | **Invalid** | Re-defined as knowledge-boundary ("I don't know / N/A to me"). |
| INV-006 (fair availability) | **Valid** | Now "every question is meaningful / no forced single path." |
| INV-007 (solvable within budget) | **Valid** | Retargeted to case solvability. |
| INV-008 (candidate filtering soundness) | **Invalid / remove** | Auto-filtering is an anti-feature. |
| INV-009 (persistence) | **Valid** | |
| INV-010 (daily consistency) | **Valid** | |
| INV-011 (offline) | **Valid** | |
| INV-012 (predicate↔fact bijection) | **Invalid** | Replaced by statement-resolution determinism. |
| INV-013 (win/loss) | **Valid** | Now accusation-vs-truth match. |
| INV-014 (no corruption) | **Valid** | |
| INV-015 (spoiler-free share) | **Valid** | |

**New invariants to add** (full set in INVARIANTS.md): Canonical Truth; Runtime Determinism; Character
Knowledge Boundaries; No Accidental Contradictions; Multiple Solution Paths; No Mandatory External
Knowledge; Deception Is Not Labelled; Fair Evidence Access; Unrelated Secrets; Historical Novelty;
Case Completeness; Reveal Coherence. (These mirror the directive's §37.)

---

## 7. Which Source Modules Are Reusable

| Module | Reuse? | How |
|--------|--------|-----|
| `src/core/share.ts` | **Yes** | Spoiler-free share; reuse verbatim. |
| `src/core/persistence.ts` | **Yes** | LocalStorage + daily streak + schema version; reuse. |
| `src/core/dailyPuzzle.ts` | **Yes** | Date→case index mapping; reuse. |
| `src/core/solver.ts` | **Refactor** | Same search algorithm; retarget to statement/evidence graph solvability. |
| `src/core/predicateEval.ts` | **Refactor** | Keep pure-eval helper; no longer used for demographics. |
| `src/sw.ts` | **Yes** | PWA offline; reuse. |
| Build config (`vite.config.ts`, `tsconfig.json`, `package.json`, `index.html`) | **Yes** | Unaffected (only `lint` already removed). |
| `scripts/validate-build.mjs` | **Yes** | Reuse. |
| `src/core/candidateFilter.ts` | **Remove** | Auto-elimination; delete (keep solver-only narrowing if needed). |
| `src/core/cardResolver.ts` (`resolveCard`) | **Replace** | Replace with `resolveStatement(card, character, case, context)`. |
| `src/core/gameFlow.ts` | **Replace** | Replace candidate narrowing with statement/clue/contradiction accumulation. |
| `src/core/types.ts` (Puzzle/Person) | **Replace** | Replace with Case/Character/Statement/PlayerState. |
| `src/data/people/pool.json` | **Remove** | People-pool universe; delete. |
| `src/data/cards/library.json` | **Remove** | Demographic predicate library; delete. |
| `src/data/puzzles/**` | **Remove** | Person puzzles; delete / archive. |
| `src/components.tsx` | **Replace** | CandidatePanel/CardGrid/OutcomeLog → CaseBoard/CharacterPanel/Transcript/Accusation. |
| `src/app.tsx` | **Replace** | Person-id loop → case loop (briefing → roster → interrogate → confront → accuse → reveal). |

---

## 8. Which Data Structures Are Obsolete

- `Person` / `Secret` schema (DR-001) — obsolete.
- `Puzzle.availableCardIds` + `deceptiveCards` + `irrelevantCardIds` + `hiddenSecretId` — obsolete.
- `QuestionCard.predicate` (`{field, op, value}`) — obsolete (becomes `CaseQuestion.resolutions`).
- `GameState.candidateIds` + `playedCards[].outcome` (player-visible) — obsolete (becomes
  `PlayerState.interrogations` + `discoveredClues` + `flaggedContradictions`).
- Global candidate pool — obsolete (becomes per-case `roster`).

---

## 9. Migration Risks

1. **Content risk (CRITICAL):** Case authoring is far heavier than attribute curation; need a
   generation pipeline + solver + quality gate before content scales. Mitigation: hand-author 2–3
   seed cases first behind the `CaseGenerator` interface; build the pipeline later.
2. **Solvability risk (CRITICAL):** A crime case can be unsolvable or single-path if authored
   naively. Mitigation: retrofitted solver validates ≥2 paths + no single-lie-proves-guilt.
3. **Deception-fairness risk (HIGH):** If every liar is the culprit, "liar = murderer" becomes the
   strategy. Mitigation: require ≥1 innocent liar; solver checks guilt is not implied by any single
   lie.
4. **Scope-creep risk (MEDIUM):** Temptation to build evidence-board drag UI, pressure timers,
   generation service prematurely. Mitigation: explicit V1 cutline (see architecture proposal).
5. **Preservation bias (MEDIUM):** Reusing `candidateFilter`/predicate thinking leaks the old model.
   Mitigation: delete those modules; do not port their logic.

---

## 10. Recommended Architecture Changes

- Adopt the **case-file schema** (canonical truth + characters + questions + contradictions + clues +
  accusations) as the single source of truth.
- Replace `resolveCard` with a **pure `resolveStatement`** lookup keyed by
  `(case, character, question, discoveredContext)`.
- Replace candidate narrowing with a **knowledge graph**: discovered statements, unlocked questions,
  earned contradiction markers, pinned clues.
- Add a **contradiction engine** that lights up confrontation options when two collected statements
  match an authored `ContradictionLink`.
- Keep the static, offline, client-only runtime; add a **dev-time generation + novelty + validation +
  solver pipeline** that produces immutable case JSON. Do not ship the LLM.
- Keep `share` / `persistence` / `dailyPuzzle` / `solver` (retargeted) / `sw` / build config.

---

## 11. Decisions Requiring Approval (do not hide uncertainty)

| # | Decision | Recommended default | Approval needed |
|---|----------|---------------------|-----------------|
| D1 | DEC-005 reinterpretation: keep "human characters as suspects/witnesses"; delete "'Who am I?'" identifier framing | Keep scope, delete rationale | **YES** |
| D2 | V1 generation source: hand-authored seed cases behind `CaseGenerator` vs block on full pipeline | Ship 2–3 hand-authored | **YES** |
| D3 | Investigation budget shape: ~12 actions, switching/board free (per directive §17) | Adopt | **YES** (tuning) |
| D4 | DEC-010 witness: make personality meaningful (affects wording) vs pure decoration | Meaningful | **YES** |
| D5 | Novelty engine: build fingerprint schema + validation hooks now; populate on generation later | Schema now | **YES** |
| D6 | Accusation dimensions: culprit + what + motive (evidence optional) | 3 decisions | **YES** |
| D7 | Pressure/timer meter | Defer V1 | **YES** |
| D8 | DEC-004 / DEC-013 / DEC-014 status | Supersede by new model | **YES** |

All other directive points (crime game, 7 internal truth states, no runtime LLM, multi-path
solvability, contradiction-exposed deception, knowledge graph, Case Board) are already decided by the
product owner and are reflected in the architecture proposal.

---

## 12. Exact File Changes in This Correction Phase

| File | Action |
|------|--------|
| `PRODUCT_CORRECTION_REPORT.md` | **Created** (this file) |
| `CRIME_GAME_ARCHITECTURE_PROPOSAL.md` | **Created** (Step C) |
| `PROJECT_IDENTITY.md` | Rewritten (crime-mystery) |
| `PROJECT_BRIEF.md` | Rewritten (interrogation loop) |
| `REQUIREMENTS.md` | Rewritten (case/interrogation requirements) |
| `INVARIANTS.md` | Rewritten (crime-model invariants) |
| `V1_SCOPE.md` | Rewritten (4–7 roster, case scope) |
| `DECISIONS.md` | Updated (supersede DEC-004/005/010/013/014; add D-series) |
| `RISK_REGISTER.md` | Updated (product risks added) |
| `PROJECT_STATE.md` | Updated (Phase 0 reopened; prototype superseded) |

**No source code changed. No Phase 3 started.**

---

## 13. Old Implementation Impact (explicit)

- **Reused:** `share.ts`, `persistence.ts`, `dailyPuzzle.ts`, `solver.ts` (retarget), `predicateEval.ts`
  (helper), `sw.ts`, build config, `validate-build.mjs`.
- **Discarded:** `candidateFilter.ts`, `cardResolver.ts` (`resolveCard`), `gameFlow.ts` (narrowing),
  `types.ts` (Puzzle/Person), `people/pool.json`, `cards/library.json`, `puzzles/**`,
  `components.tsx` panels, `app.tsx` person loop.
- **Re-cast:** DEC-013/014 (people-model deviations) are moot under the new model; the new model
  independently forbids disclosed deception and redefines IRRELEVANT. DEC-005's scope survives; its
  rationale is deleted.

---

## 14. Risks (ranked)

### Critical
- **C1 — Unsolvable / single-path case** (was RISK-001): solver must prove ≥2 viable paths.
- **C2 — Content pipeline immaturity**: generation + novelty + validation must exist before scale.

### High
- **H1 — "Liar = culprit" shortcut**: require innocent liars; solver guards guilt inference.
- **H2 — Deception disclosed accidentally**: invariant + UI audit that no label leaks.
- **H3 — External-knowledge dependency**: every case must be self-contained (INV).

### Medium
- **M1 — Scope creep** (evidence-board drag UI, timers, generation service too early).
- **M2 — Preservation bias** leaking old predicate/candidate thinking.
- **M3 — Mobile Case Board overflow** at 320–375px.

### Low
- **L1 — Authoring variability** in voice quality (mitigated by personality field + review).

---

## 15. Recommended Next Phase

1. **Phase 0 (reopened) — DONE in docs:** identity/brief/requirements/invariants/scope rewritten.
2. **Phase 0.5-style gameplay audit** on the new model using one hand-authored seed case.
3. **Phase 2 (rebuild):** implement case schema + `resolveStatement` + knowledge graph + contradiction
   engine + Case Board + accusation + reveal; retarget solver; author 2–3 seed cases.
4. **Phase 3 (content):** build generation + novelty + validation pipeline; scale cases.

**Must NOT happen yet:**
- Any source-code change to the person-identifier prototype (it is superseded, not extended).
- Phase 3 feature work, auth, backend, runtime LLM, or large dataset generation.
- Any new product-shaping decision made autonomously.

**The north star:** a short, replayable daily crime mystery where players interrogate a network of
believable characters, uncover lies and contradictions, construct their own understanding, and
experience a satisfying "I figured it out" reveal.
