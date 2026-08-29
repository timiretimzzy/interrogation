# Decisions: The Interrogation

> ⚠️ **PRODUCT REDEFINITION — 2025-08-29.** The canonical product is now a **crime-mystery
> interrogation game** (see `PRODUCT_CORRECTION_REPORT.md` and `CRIME_GAME_ARCHITECTURE_PROPOSAL.md`).
> Several decisions below are **SUPERSEDED**: DEC-002 (four player-visible outcomes → internal truth
> states, DEC-016), DEC-005 (People-identifier rationale deleted; human-characters scope retained,
> DEC-020), DEC-010 (witness decoration → meaningful personality, pending DEC-026), DEC-013/DEC-014
> (people-model deviations now moot under the new model, DEC-018/DEC-017). DEC-001/003/006/007/008/009/011/012
> remain valid. New decisions DEC-015..DEC-026 record the correction.

## DEC-001: Question Cards Replace Free-Text Questions
**Date:** 2025-01-15
**Status:** APPROVED
**Deciders:** Product, Engineering, Design

### Context
The original design used "question templates" — ~35-50 generic templates (e.g., "Born before [year]?", "From [continent]?") that worked across all puzzles. Players would select from the full template list each turn. The witness would answer Yes/No with exactly 2 lies at fixed positions.

### Problems Identified
1. **Ambiguous interpretation** — "Was the person born in the 1900s?" could mean 1900-1999 or 1900-1909. Template text vs predicate mismatch caused player confusion.
2. **No strategic trade-offs** — With 35+ templates always available, optimal questions were obvious (binary search on highest-entropy facts). No meaningful choice.
3. **Deception detection too mechanical** — "Exactly 2 lies at fixed positions" reduced to a known constraint satisfaction problem. No psychological dimension.
4. **IRRELEVANT impossible** — Generic templates always applied to the schema. Couldn't model "this question doesn't make sense for this answer."
5. **Witness personality decorative only** — Yes/No answers left no room for thematic responses that decorate the canonical outcome.

### Decision
Replace free-text/generic templates with **Question Cards**:

- **Puzzle-specific cards**: Each puzzle has a curated subset (12–18) of cards selected from a larger library. Cards are intentionally chosen to create meaningful trade-offs for that specific puzzle.
- **Four canonical outcomes**: TRUE, FALSE, DECEPTIVE, IRRELEVANT — each with distinct strategic meaning.
- **Predetermined deception**: Specific cards are marked DECEPTIVE per puzzle with explicit direction (truth→false or false→true). Player knows the total deceptive count but not which cards.
- **IRRELEVANT as a first-class outcome**: Cards whose predicate doesn't apply to the secret's category (e.g., "Born before 1900?" for a Concept). Explicitly distinct from FALSE and DECEPTIVE.
- **Witness responses as decoration**: Thematic text (e.g., "That much is correct." / "Absolutely." [lie] / "That question tells you nothing about this case.") never alters the canonical outcome.
- **Deterministic resolution**: Same puzzle + same card = same outcome. Pure function evaluation of structured predicate against structured facts.

### Consequences
**Positive:**
- Eliminates ambiguous interpretation — predicates are structured data, not text.
- Creates genuine strategic depth — card curation per puzzle means no obvious optimal path.
- Deception becomes psychological — player must reason "which of these specific cards might be the lies?" not "which positions are lies?"
- IRRELEVANT adds a new deduction dimension — "this question doesn't apply" reveals category information.
- Witness personality becomes meaningful — responses decorate outcomes without ambiguity.
- Maintains determinism, offline capability, zero runtime interpretation.

**Negative:**
- Higher content authoring burden — each puzzle needs custom card selection and deception assignment.
- Solver more complex — must account for IRRELEVANT cards and per-card deception direction.
- Card library must be designed upfront with structured predicates for all categories.

**Mitigation:**
- Build authoring tool for puzzle creation (card selection, deception assignment, solver validation).
- Start with Person category only; expand card library incrementally.
- Solver handles IRRELEVANT by treating those cards as "no information" for filtering.

### Alternatives Considered
1. **Keep templates, add IRRELEVANT flag per puzzle** — Rejected: doesn't solve strategic depth or ambiguity problems.
2. **Keep templates, make deception per-template not per-position** — Rejected: still no strategic trade-offs; templates too numerous.
3. **Free-text with LLM classification** — Rejected: violates core pillars (deterministic, offline, no runtime interpretation, fair).
4. **Hybrid: templates + 2-3 puzzle-specific "special" cards** — Rejected: half-measure; doesn't fix core issues.

### Related Documents
- REQUIREMENTS.md: FR-002, FR-003, FR-004, FR-012
- INVARIANTS.md: INV-002, INV-003, INV-004, INV-005, INV-006, INV-012
- V1_SCOPE.md: In Scope / Out of Scope updates

---

## DEC-002: Four Outcome Types (TRUE, FALSE, DECEPTIVE, IRRELEVANT)
**Date:** 2025-01-15
**Status:** SUPERSEDED — outcomes reinterpreted as INTERNAL truth states (DEC-016). Player-visible labels removed.
**Deciders:** Product, Engineering, Design

### Context
Original design had only TRUE/FALSE with 2 lies (boolean inversion). This maps to a standard "Knights and Knaves" logic puzzle.

### Decision
Expand to four canonical outcomes:
- **TRUE**: Predicate evaluates to true, witness confirms.
- **FALSE**: Predicate evaluates to false, witness confirms.
- **DECEPTIVE**: Predicate evaluates to X, witness responds as if ¬X. Direction fixed per card per puzzle.
- **IRRELEVANT**: Predicate field doesn't exist for this secret's category. Witness explicitly states inapplicability.

### Rationale
- **DECEPTIVE** separates "the witness is lying" from "the answer is no" — adds psychological dimension.
- **IRRELEVANT** enables category deduction and prevents "FALSE" from being ambiguous (is it false or does the question not apply?).
- Four outcomes create richer information theory: each card yields 2 bits (4 outcomes) vs 1 bit (Yes/No).

### Consequences
- Candidate filter must handle all four types correctly.
- Solver must model IRRELEVANT as "no constraint" and DECEPTIVE as "inverted constraint at known positions."
- UI must clearly distinguish all four visually (color + shape + text).

---

## DEC-003: Puzzle-Specific Card Curation (Not Generic Pool)
**Date:** 2025-01-15
**Status:** APPROVED
**Deciders:** Product, Engineering, Design

### Context
Original design: all ~35 templates available for every puzzle.

### Decision
Each puzzle defines `availableCardIds: string[]` — a curated subset of 12–18 cards from the global library. Cards are chosen to:
- Create meaningful trade-offs (no single dominant strategy).
- Ensure multiple viable solution paths (solver-verified).
- Include strategic IRRELEVANT cards (typically 1–3 per puzzle) for category deduction.
- Include DECEPTIVE cards (typically 2 per puzzle) placed on high-value questions.

### Rationale
- Generic pool = binary search = boring. Curation = strategy.
- Author controls difficulty via card selection, not just lie positions.
- Enables puzzle-specific witness personality (responses tailored to cards).

---

## DEC-005: V1 Category = Famous People Only
**Date:** 2025-01-15
**Status:** SUPERSEDED — scope retained (human characters as suspects/witnesses); "'Who am I?'" identifier rationale DELETED (DEC-020).
**Deciders:** Product, Engineering

### Context
Requirements list 5 categories: Person, Object, Place, Event, Concept.

### Decision
V1 launches with **Famous People only** (historical figures + iconic fictional characters). Architecture supports other categories via:
- Secret schema per category (extensible).
- Card library per category (predicates reference category-specific fields).
- Puzzle definition includes `category` field.

### Rationale
- Reduces V1 scope risk: one schema, one card library, one candidate pool to perfect.
- People category has richest public data (Wikidata, Wikipedia) for fact verification.
- Strongest player intuition: "Who am I?" is the classic deduction format.
- Other categories can be added post-V1 as "expansion packs" with minimal code changes.

---

## DEC-006: No Runtime LLM / AI / Interpretation
**Date:** 2025-01-15
**Status:** APPROVED
**Deciders:** Product, Engineering

### Context
Temptation to use LLMs for: witness response generation, free-text question parsing, answer classification, hint generation.

### Decision
**Zero LLM/AI at runtime.** All text pre-authored. All logic deterministic pure functions.

### Rationale
- Core pillar: "Fair, deterministic deduction puzzle — not a chatbot."
- Offline capability requires zero external dependencies.
- Privacy promise: no data leaves device.
- Cost: zero API costs.
- Trust: players can verify the game's logic themselves.

### Enforcement
- INV-003: Outcome Integrity (No Hidden Runtime Interpretation).
- CSP `connect-src 'none'`.
- Build-time audit for forbidden patterns.

---

## DEC-007: Client-Only Architecture with LocalStorage Persistence
**Date:** 2025-01-15
**Status:** APPROVED
**Deciders:** Engineering

### Context
Original design considered a minimal backend for daily puzzle rotation and streak sync.

### Decision
**Pure client-side static site.** Daily puzzle derived from UTC date client-side. All state in LocalStorage. Service Worker for offline.

### Rationale
- Simplicity: deploy anywhere (GitHub Pages, Netlify, Vercel, Cloudflare Pages).
- Privacy: no server = no data collection possible.
- Offline: true offline-first, not "offline-tolerant."
- Cost: free hosting forever.
- Speed: instant load, no cold starts.

### Trade-offs
- No cross-device sync (accepted — daily ritual is per-device or manual).
- No server-side anti-cheat (accepted — answer secrecy via client architecture).
- Date manipulation possible (accepted — single-player, no leaderboards).

---

## DEC-008: Automated Solver as Build Gate
**Date:** 2025-01-15
**Status:** APPROVED
**Deciders:** Engineering, Product

### Context
How to guarantee puzzles are solvable?

### Decision
Automated solver runs in CI for every puzzle. Build fails if any puzzle unsolvable within its question budget given its deceptive/IRRELEVANT cards.

### Rationale
- "An LLM said it's solvable" is not acceptable.
- Mathematical verification required for trust.
- Solver also provides difficulty metrics (optimal question count, branching factor) for practice tiering.

### Implementation
- Solver as separate Node script (not in client bundle).
- Constraint satisfaction / search over card sequences.
- Runs in parallel per puzzle (worker_threads).
- Per-puzzle timeout guard (30s).

---

## DEC-009: Spoiler-Free Share Format
**Date:** 2025-01-15
**Status:** APPROVED
**Deciders:** Product, Design

### Context
Daily games need shareable results (Wordle-style).

### Decision
Emoji grid showing only:
- Question efficiency: 🟩 (useful), 🟨 (redundant), ⬜ (unasked)
- Deception detection: 🟥 (caught DECEPTIVE), ⬜ (missed)

No secret names, card text, fact values, or outcome details.

### Rationale
- Enables social sharing without spoilers.
- Communicates skill (efficiency + lie detection) not luck.
- INV-015 enforces this programmatically.

---

## DEC-010: Witness Personality as Decoration, Not Mechanics
**Date:** 2025-01-15
**Status:** SUPERSEDED — personality must be meaningful (affects wording/availability framing), pending DEC-026.
**Deciders:** Design, Product

### Context
How much does witness personality affect gameplay?

### Decision
Witness responses are **pre-authored per outcome type per puzzle** (or selected from a small curated pool). They **never** alter the canonical outcome. They are pure flavor.

### Rationale
- Preserves determinism and fairness.
- Allows writing/character work without mechanical complexity.
- Players can ignore flavor text entirely and play purely on outcome badges.

### Example
For a DECEPTIVE card on "Born before 1900?" (truth=Yes, lie=No):
- Witness A (gruff detective): "Absolutely. Before your grandfather's time." [DECEPTIVE]
- Witness B (nervous informant): "Y-yeah, sure, way back." [DECEPTIVE]
- Witness C (bureaucrat): "The records confirm it." [DECEPTIVE]

All three → canonical outcome DECEPTIVE, player sees 🟥 DECEPTIVE badge.

---

## DEC-011: Vitest Major-Version Bump (1.x → 2.x)
**Date:** 2025-01-15 (Phase 2 verification gate)
**Status:** APPROVED
**Deciders:** Engineering

### Context
`STACK.md` locked Vitest at `^1.2.1`. The project runtime is **Node v24.19.0**. During Phase 2, `npm test` (Vitest 1.6.1) executed but **every** test file reported "No test suite found" and a runtime error `TypeError: Cannot read properties of undefined (reading 'test')` at the `it(...)` call site — i.e. Vitest's test-runner context was never injected into the module. The failure was **independent of test pool** (both `forks` and `threads` reproduced it identically) and **independent of a clean `npm ci` reinstall** (same version, same failure).

### Observed Failure
- `vitest run` → 0 tests collected across all 8 files; error `Cannot read properties of undefined (reading 'test')`.
- Reproduced with `--pool=forks` and `--pool=threads`: identical.
- Reproduced after `rm -rf node_modules package-lock.json && npm ci`: identical.
- Root cause: Vitest 1.x officially supports Node 18/20/22. Node 24 changed internals (module/time-tracking APIs) that Vitest 1.x's runner relied on. Vitest 2.1.x added Node 24 support.

### Decision
Upgrade `vitest` from `^1.2.1` to `^2.1.9`. This is an **environment-compatibility decision**, not a casual dependency bump.

### Verification After Upgrade
- `npm test` → **50 passed / 50** across 8 files (cardResolver, candidateFilter, gameFlow, dailyPuzzle, share, predicateEval, solver, persistence).
- Same resolver/filter logic exercised by the solver remains unchanged; only the test runner version changed.

### Consequences
- `STACK.md` and `STACK_VERIFICATION.md` Vitest rows updated to 2.x with the Node-24 rationale.
- CI matrix in `STACK.md` documents Node 20+ ; note that local dev is on Node 24, so the toolchain floor is effectively Node 20/22/24-compatible Vitest 2.x.

---

## DEC-012: TypeScript Strictness Relaxation (V1)
**Date:** 2025-01-15 (Phase 2 verification gate)
**Status:** APPROVED
**Deciders:** Engineering

### Context
`STACK.md` specified `tsconfig.json` with `strict: true` **plus** `exactOptionalPropertyTypes: true` and `noUncheckedIndexedAccess: true`. On first `tsc` run, these two extra flags produced ~12 type errors that were **not** game-logic bugs:
- Missing brand-type casts where JSON/test literals were assigned to `PersonId`/`PuzzleId`/`CardId` (the branded-string types require assertion at the data boundary).
- `| undefined` on indexed array access (e.g. `candidatePool[index]`) requiring explicit guards.
- An unused `as PuzzleId` import in a test.

### Decision
Remove `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` from `tsconfig.json` for V1. **`strict: true` is retained** (so `noImplicitAny`, `strictNullChecks`, `noUnusedLocals` via project config, etc. remain enforced).

### Why (explicit)
These flags were removed **because the existing implementation and tests were not authored to satisfy their constraints**, not because the flags are unnecessary in principle. If we want them back in a later phase, the source/test data boundaries must be rewritten with explicit brand assertions and index guards. This is a deliberate V1 scope trade-off for velocity, documented here so it is never silently mistaken for "the code is maximally strict."

### Consequences
- `tsc --noEmit` (typecheck) and `tsc && vite build` (build) pass cleanly.
- Type safety is still materially stronger than `strict: false`; only two optional extra-strict checks are off.

---

## DEC-013: IRRELEVANT Outcome Not Implemented in V1 (Product Deviation — PENDING APPROVAL)
**Date:** 2025-01-15 (Phase 2 verification gate)
**Status:** SUPERSEDED — moot under new model; IRRELEVANT redefined as knowledge boundary (DEC-018).
**Deciders:** Engineering (flagged for Product)

### Context
DEC-001, DEC-002, and DEC-003 established IRRELEVANT as a **first-class canonical outcome** and a core pillar of the Question Card mechanic ("IRRELEVANT adds a new deduction dimension — 'this question doesn't apply' reveals category information"; "Include strategic IRRELEVANT cards (typically 1–3 per puzzle)").

### Finding
The resolver (`src/core/cardResolver.ts`) contains `isIrrelevant(predicate, person)` which **unconditionally returns `false`** for V1 (People-only), with the comment "For V1, no predicate is irrelevant — all fields apply to all people." Therefore:
- No IRRELEVANT outcome can ever be produced at runtime.
- No puzzle in `practice.json` or `daily.json` defines or relies on an IRRELEVANT card.
- The candidate filter and solver treat IRRELEVANT correctly *if* it occurred, but it cannot occur.

### Impact
The approved mechanic is **not delivered**. INV-005 (IRRELEVANT Distinction Clarity) is only partially satisfied: the UI/badge for IRRELEVANT exists and is styled, but the outcome never arises, so the "FALSE vs IRRELEVANT" distinction the design depends on cannot be experienced by players.

### Options (for human decision)
1. **Descope IRRELEVANT for V1** (formal product change): update DEC-001/002/003 to state IRRELEVANT is deferred to post-V1 category expansion; remove the dead `isIrrelevant` stub or keep it as a documented hook. Simplest; honest.
2. **Implement IRRELEVANT now**: introduce at least one card per puzzle whose predicate field does not apply to the secret's category. For the V1 People-only category this requires a non-People category or a field that is genuinely absent (e.g. a "Place/Event" secret) — which conflicts with DEC-005 (People-only V1). So a true IRRELEVANT requires either relaxing DEC-005 or adding a schema field that is legitimately undefined for some people.

### Recommendation (engineering)
Do **not** silently keep the dead stub. Either formally descope (option 1) or, if IRRELEVANT is essential to the product vision, revisit DEC-005 to allow a field/secret type that makes "does not apply" meaningful. This needs an explicit product call before Phase 3.

---

## DEC-014: Deception Disclosed at Ask Time (Product Deviation — PENDING APPROVAL)
**Date:** 2025-01-15 (Phase 2 verification gate)
**Status:** SUPERSEDED — moot under new model; deception never labelled (DEC-017).
**Deciders:** Engineering (flagged for Product)

### Context
DEC-001 stated the intended deception model: "Player knows the total deceptive count but not which cards." The Phase 0.5 audit explicitly wanted to avoid "players simply assume: One answer is probably lying, so reverse whichever answer seems suspicious" — i.e. deception should be a *deduction* puzzle, not random distrust.

### Finding
At runtime, `resolveCard()` returns `outcome: 'DECEPTIVE'` and the UI (`OutcomeLog` in `components.tsx`, plus the `Lies revealed: N` stat) **labels the lie immediately when the card is played**. Runtime verification confirmed: asking the deceptive card "From Asia?" shows witness "Yes, Asian roots." **and** the UI renders 🎭 Deceptive / "Truth: NO · the witness lied" in the same step, removing the candidate who is actually from Asia.

### Impact
- The deduction challenge of *identifying which answer is a lie* is eliminated — the game tells the player outright.
- Deception becomes pure flavor + a free inverted-filter signal (the player just trusts the badge).
- Total lie count is **not** shown up front (contrary to DEC-001), so the player also has no sense of how many lies remain.
- This is a genuine deviation from the approved deception design and from the Phase 0.5 intent.

### Options (for human decision)
1. **Hide the DECEPTIVE badge during play; reveal at end** (recommended): show TRUE/FALSE/IRRELEVANT truthfully during play, but render DECEPTIVE answers as their *witnessed* (possibly false) response without the badge; mark them at reveal. Player must reason about contradictions. This restores the deduction puzzle.
2. **Show total lie count up front, keep per-card disclosure** (lighter change): at least matches DEC-001's "knows the count" but still removes the which-card challenge.
3. **Keep current behavior**: accept that deception is disclosed; document it as the chosen model. Weakest gameplay.

### Recommendation (engineering)
Option 1 is the smallest change that restores the intended mechanic (UI-only; no logic change needed since `resolveCard` already stores both `outcome` and `witnessResponse`). Flag for product approval before Phase 3.

---

## DEC-015: Canonical Product = Crime-Mystery Interrogation
**Date:** 2025-08-29 (Product Correction Gate)
**Status:** APPROVED
**Deciders:** Product

### Context
The built V1 prototype was a "hidden-secret identifier" (demographic Question Cards + auto candidate
filtering). The product owner rejected this as a generic people-identifier and redefined the game as a
daily crime-mystery interrogation.

### Decision
The canonical product is a daily interactive crime mystery. The player interrogates a 4–7 character
roster, uncovers lies/contradictions via a knowledge graph, and submits a structured accusation. The
"candidate list" is not the game; the interrogation, story, and contradictions are.

### Rationale
Matches the original core fantasy ("interrogate an unreliable witness") and the directive's stop-
condition test (swapping characters for Curie/Einstein must break the game).

### Consequences
All people-pool / demographic-predicate assets are superseded (see PRODUCT_CORRECTION_REPORT.md §7–8).

---

## DEC-016: Seven Internal Truth States (Replaces Four Player-Visible Outcomes)
**Date:** 2025-08-29
**Status:** APPROVED
**Deciders:** Product, Engineering

### Decision
Statements carry one of seven INTERNAL truth states: TRUE, FALSE, PARTIALLY_TRUE, MISLEADING, UNKNOWN,
EVASIVE, CONTRADICTED. These are engine-internal only and never rendered as player-visible labels.
FALSE = honest mistake; DECEPTIVE = intentional lie; UNKNOWN/EVASIVE replace the old IRRELEVANT-as-
schema concept with a knowledge boundary.

### Rationale
Preserves "honest-but-wrong" vs "lying"; removes the per-card badge that destroyed deduction.

### Consequences
UI must render dialogue only (INV-107). DEC-002 superseded.

---

## DEC-017: Deception Is Never Labelled (Replaces Known-Count Disclosure)
**Date:** 2025-08-29
**Status:** APPROVED
**Deciders:** Product, Engineering

### Decision
Deceptive statements are predetermined but never labelled during play. They are exposed only through
contradictions, evidence, and confrontations the player earns. The total deceptive count is NOT shown
up front.

### Rationale
Labelling deception ("the witness lied") removes the deduction puzzle; the player must earn the
realization. Supersedes DEC-014 behaviour and the old INV-004 known-count model.

### Consequences
Contradiction engine surfaces ambiguous "⚠ possible inconsistency," never "X is lying" (INV-107).

---

## DEC-018: IRRELEVANT Redefined as Knowledge Boundary
**Date:** 2025-08-29
**Status:** APPROVED
**Deciders:** Product, Engineering

### Decision
"IRRELEVANT" (now UNKNOWN / "doesn't apply to me") means the character lacks relevant knowledge or the
question doesn't apply to their perspective — a property of the character's knowledge, NOT schema
inapplicability.

### Rationale
The old definition (predicate field absent from secret schema) is meaningless for a case model with no
global predicate schema. Supersedes DEC-013's dead stub and INV-005.

### Consequences
Character `knowledge.knowledgeGaps` drives UNKNOWN answers (INV-103).

---

## DEC-019: No Auto Candidate Elimination
**Date:** 2025-08-29
**Status:** APPROVED
**Deciders:** Product, Engineering

### Decision
The game must NOT automatically narrow a suspect list after each answer. The player reasons over the
knowledge graph (statements, clues, contradictions, unlocked questions).

### Rationale
Auto-elimination turned investigation into automated filtering (the rejected model). INV-008 removed.

### Consequences
`candidateFilter.ts` deleted; solver may still reason internally but must not drive UI elimination.

---

## DEC-020: DEC-005 Reinterpretation (Human Characters Retained; Identifier Rationale Deleted)
**Date:** 2025-08-29
**Status:** APPROVED
**Deciders:** Product

### Decision
Keep "V1 cases use human characters (suspects/witnesses/etc.)" as the entity constraint. DELETE the
"'Who am I?' is the classic deduction format" identifier framing from DEC-005.

### Rationale
The owner clarified "People only" constrained entity TYPE, not the game into a person-identifier.

### Consequences
DEC-005 marked SUPERSEDED (scope kept, rationale deleted).

---

## DEC-021: V1 Generation Source = Hand-Authored Seed Cases Behind CaseGenerator
**Date:** 2025-08-29
**Status:** APPROVED
**Deciders:** Product, Engineering

### Decision
Ship 2–3 hand-authored cases against the new schema, behind the `CaseGenerator` interface. The full
LLM generation + novelty + validation pipeline is built in Phase 3, not required to make V1 playable.

### Rationale
Unblocks playability without locking a provider or paying for generation now (directive §25/33).

### Consequences
`CaseGenerator` adapter defined; no provider locked in V1.

---

## DEC-022: Investigation Budget ~12 Actions; Free Movement
**Date:** 2025-08-29
**Status:** APPROVED (tuning may follow playtest)
**Deciders:** Product, Engineering

### Decision
Each case has a soft interrogation budget of ~12 actions (question / follow-up / confrontation /
accusation). Switching characters and opening the Investigation Notebook are FREE (no action cost).

### Rationale
Prevents "ask everything"; preserves investigation freedom (directive §17). Budget exists to force lead
prioritization, not to punish.

### Consequences
`PlayerState` tracks actions; navigation/Notebook excluded from budget.

---

## DEC-023: Structured Accusation — Culprit + What + Motive (+ Evidence)
**Date:** 2025-08-29
**Status:** APPROVED
**Deciders:** Product, Engineering

### Decision
The accusation requires: culprit (roster) + what happened (explanation pool) + motive (motive pool),
with optional key evidence (evidence pool). Win iff all required dimensions match `truth`; partial
matches scored.

### Rationale
Rewards understanding, not blind guessing; supports graded scoring (FR-013/FR-014).

### Consequences
`answerDimensions` defined per case; reveal shows full truth.

---

## DEC-024: Novelty Engine — Schema + Hooks Now, Populate Later
**Date:** 2025-08-29
**Status:** APPROVED
**Deciders:** Product, Engineering

### Decision
Adopt the `CaseFingerprint` schema and novelty/similarity validation hooks now. Populate the Historical
Case Memory index as cases are generated (Phase 3). With only seed cases it adds no value yet but is
required before scale.

### Rationale
Prevents structural repetition at scale (directive §15/25). Cheap to scaffold now.

### Consequences
Fingerprint validator present in build gate; index empty until generation.

---

## DEC-025: Pressure / Timer Meter Deferred
**Date:** 2025-08-29
**Status:** APPROVED (deferred)
**Deciders:** Product, Engineering

### Decision
Do NOT implement a timed/pressure meter in V1. Use only the soft question budget (DEC-022).

### Rationale
Directive §14/17: don't add a timer unless it demonstrably improves the prototype. Free movement +
budget already create strategic pressure.

### Consequences
`pressure?` field optional in PlayerState; unused in V1.

---

## DEC-026: Witness Personality Must Be Meaningful (PENDING)
**Date:** 2025-08-29
**Status:** PENDING APPROVAL
**Deciders:** Product, Design

### Context
DEC-010 (witness personality as pure decoration) is in tension with the directive's "witness should
feel like a character" (§9/31). The new model gives each character a `personality` that affects wording
and availability framing.

### Decision (recommended)
Make personality **meaningful**: it shapes dialogue voice and how questions are presented, but NEVER
alters deterministic truth (INV-102/103).

### Options
1. Meaningful (recommended): personality drives voice + framing; truth fixed.
2. Keep decoration (DEC-010): personality is pure flavor.

### Recommendation
Option 1 — aligns with the interrogation-fantasy while preserving determinism. Flag for product
approval before Phase 2 rebuild.
---

## Mechanics-Lock Addendum (2025-08-29, second correction pass)

> This addendum records the **PRODUCT MECHANICS LOCK** decisions from the "PRODUCT MECHANICS LOCK —
> DO NOT START PHASE 2 REBUILD YET" directive. It reviews DEC-020..DEC-026 and adds DEC-027..DEC-035.
> Every entry is tagged **APPROVED FROM USER DIRECTIVE**, **RECOMMENDED — AWAITING APPROVAL**,
> **DEFERRED**, or **REJECTED** (per the directive's required labelling).
> Companion docs: `RESPONSE_VARIABILITY_MODEL.md`, `GAMEPLAY_SIMULATION.md`, `PRODUCT_MECHANICS_LOCK.md`.

## DEC-027: Response Variability Model (Global Case, Variable Responses)
**Date:** 2025-08-29 (Mechanics Lock)
**Status:** APPROVED FROM USER DIRECTIVE (principles); algorithm/schema RECOMMENDED — AWAITING APPROVAL
**Deciders:** Product

### Decision (APPROVED FROM USER DIRECTIVE)
The daily crime is **global/shared** (same case, cast, timeline, culprit for all players). A character's
**response may vary per player**, but every variant is **pre-generated before publication** and selected
at runtime by a **deterministic per-session seed** (no runtime RNG, no LLM). **Canonical truth never
changes** across players or variants. Critical facts have **redundancy** (multiple routes); **lies are
uncommon** and each has a reason.

### Recommendation (AWAITING APPROVAL)
Implement via the hash-seeded weighted selection algorithm and the variant/context schema in
`RESPONSE_VARIABILITY_MODEL.md §4–§5`, guarded by new invariants INV-113/INV-114.

### Rationale
Satisfies the directive's "same crime, different interrogations, same truth, always fair."

### Consequences
Replaces the single-`Resolution` lookup of the architecture proposal with a per-`(context)` variant set.
Solver must verify INVARIANT F (redundancy) under worst-case variants.

---

## DEC-028: Deterministic Seeded Selection + Variant/Context Schema
**Date:** 2025-08-29 (Mechanics Lock)
**Status:** RECOMMENDED — AWAITING APPROVAL
**Deciders:** Engineering

### Decision
`sessionSeed = hash(deviceId, caseId, attemptNonce)` (stable across refresh; new only on deliberate
restart). `questionSeed = hash(sessionSeed, caseId, questionId, characterId, contextId)`. Variant =
weighted deterministic pick. Questions carry `contexts: ResolutionContext[]` (`initial` /
`after_contradiction_*` / `after_clue_*`), each with its own `variants: ResponseVariant[]`.

### Alternatives
- True runtime `Math.random` — **REJECTED** (unfair, rerollable, non-deterministic).
- One fixed variant per question — **REJECTED** (kills the per-player variety the directive requires).

### Why recommended
Deterministic, offline, fair, no reroll-on-refresh exploit; implements M5/M12 cleanly.

### Complexity
Low-Medium. **Failure modes:** seed collision (mitigated by 64-bit hash); variant set empty (schema
validation rejects).

---

## DEC-029: Six-Class Question Taxonomy
**Date:** 2025-08-29 (Mechanics Lock)
**Status:** APPROVED FROM USER DIRECTIVE
**Deciders:** Product

### Decision
Questions fall into: **opening, follow-up, evidence, contradiction, repeat-topic, pressure/
confrontation.** Cards evolve (initial → unlocked → confrontation). Replaces the prior 8-class set.

### Consequences
`CaseQuestion.category` uses these six. Generation must produce follow-up/evidence/contradiction cards
keyed to discoveries.

---

## DEC-030: Characters Are Actual Characters (Not Rows of Facts)
**Date:** 2025-08-29 (Mechanics Lock)
**Status:** APPROVED FROM USER DIRECTIVE
**Deciders:** Product

### Decision
Every major character has a profile: name, role, relationship network, personality, public story,
private knowledge, secrets, fears, loyalties, possible motives, pressure points, knowledge boundaries,
truthfulness tendencies, conversational style. Personality **influences interaction** (voice, framing,
cooperation) but never alters deterministic truth.

### Consequences
Extends the `Character` schema (architecture proposal §3). Resolves the DEC-026 tension in favor of
**meaningful** personality (see DEC-026 update below).

---

## DEC-031: Investigation Notebook (Record, Don't Solve)
**Date:** 2025-08-29 (Mechanics Lock)
**Status:** APPROVED FROM USER DIRECTIVE
**Deciders:** Product, Design

### Decision
Notebook sections: People, Statements, Timeline, Evidence, Leads, Contradictions. It records discovered
information; it **never declares "X is lying."** Contradictions surface as "⚠ possible inconsistency."

### Consequences
UI must render notebook data only; reuses `PlayerState` (architecture proposal §10).

---

## DEC-032: Action Budget Refinement (Scaled, Not Flat 12)
**Date:** 2025-08-29 (Mechanics Lock)
**Status:** RECOMMENDED — AWAITING APPROVAL (refines DEC-022)
**Deciders:** Product, Engineering

### Decision (recommended)
Soft budget scaled by difficulty: **Easy ≈14, Medium ≈16, Hard ≈18** meaningful actions (question/
follow-up/evidence/confrontation each = 1; switching + Notebook free; accusation = 0 or 1).

### What it means / why
DEC-022 approved ~12. The user explicitly asked to *review* it. 12 is tight given the revisit/confront
core loop; scaling preserves "can't ask everything" tension while allowing investigation to evolve.

### Gameplay impact
Less frustration; still strategic. **Complexity:** Low (a per-case number). **Recommendation:** approve
the refinement; DEC-022 stays valid in spirit.

---

## DEC-033: Accusation Format — Culprit + What + Motive (+ Evidence)
**Date:** 2025-08-29 (Mechanics Lock)
**Status:** RECOMMENDED — AWAITING APPROVAL (refines DEC-023)
**Deciders:** Product, Design

### Decision (recommended)
Structured accusation: **culprit (roster) + what-happened (reconstruction pool) + motive (motive pool)**,
with **optional key-evidence** (evidence pool). Win iff all required dimensions match `truth`; partial
matches graded.

### What it means / why
DEC-023 proposed the same three dimensions. The user asked not to lock them yet and to simulate formats.
Format Y (this) separates "named the culprit" from "understood the method," rewarding comprehension
without becoming a 5-question exam.

### Gameplay impact
Climax feels earned. **Complexity:** Low-Med. **Recommendation:** adopt Format Y; treat extra dimensions
(Format Z) as per-case optional.

---

## DEC-034: Generation Pipeline (12 Stages, Provider-Agnostic)
**Date:** 2025-08-29 (Mechanics Lock)
**Status:** APPROVED FROM USER DIRECTIVE (pipeline + provider-agnostic); multi-call cost strategy RECOMMENDED — AWAITING APPROVAL
**Deciders:** Product, Engineering

### Decision
LLM is a case author only. 12-stage pipeline (novelty → blueprint → truth → characters → relationships/
timeline → questions/responses → contradiction graph → **multiple response variants** → structural
validation → solver → quality gate → publish/reject). No provider locked; tolerate failures; final case
self-contained JSON.

### Consequences
Adds Stage 8 (variant generation) to architecture proposal §11. Generation is dev-time, offline from
live play (DEC-006/INV-003).

---

## DEC-035: Entertainment Loop (Streak Is Secondary)
**Date:** 2025-08-29 (Mechanics Lock)
**Status:** RECOMMENDED — AWAITING APPROVAL
**Deciders:** Product

### Decision (recommended)
Retention is driven by: opening curiosity → progression (unlocks) → contradiction satisfaction → theory
formation → reveal payoff → daily novelty → competence growth → shareable outcome. The **streak is
secondary decoration**, not the retention engine.

### Why
The directive rejects "daily content = retention" as circular. This model names the actual hooks.

---

## Review of DEC-020 through DEC-026 (explicit)

| DEC | Means | Still recommend? | Why | Gameplay impact | Complexity | Disposition |

---

## Product-Decision-Response Addendum (design-validation gate)

> This addendum records the approvals, corrections, and new decisions from the "PRODUCT DECISION
> RESPONSE — APPROVALS, CORRECTIONS, AND NEXT DESIGN GATE" directive. It adds DEC-036..DEC-044 and
> reclassifies DEC-023 / DEC-032. Every entry is tagged APPROVED FROM USER DIRECTIVE,
> RECOMMENDED — AWAITING APPROVAL, DEFERRED, or REJECTED. Companion design docs:
> GAMEPLAY_CORE_LOOP.md, INTERROGATION_SYSTEM.md, INFORMATION_ARCHITECTURE.md,
> CASE_NOVELTY_SYSTEM.md, CASE_GENERATION_PIPELINE.md, ACTION_ECONOMY_PROPOSAL.md,
> CASE_SCALE_SPEC.md, GAMEPLAY_SIMULATIONS.md.

## DEC-036: Deterministic Seed Model (Global Case, Per-Player Variability)
**Date:** design-validation gate
**Status:** APPROVED FROM USER DIRECTIVE (principles, PART 1). Seed mechanics defined below.
**Deciders:** Product

### Decision
The directive APPROVED DEC-028/P1 (deterministic seeded selection) and required a precise seed model for
non-authenticated play. Adopt:
```
sessionSeed = hash(deviceId, caseId, attemptNonce)
questionSeed = hash(sessionSeed, caseId, questionId, characterId, contextId)
```
Behavior per scenario (no permanent player-identity infrastructure):
- **Anonymous player / no auth:** `deviceId` is a stable per-install id from the persistence layer
  (LocalStorage). Selection is deterministic per device. No login required.
- **First play:** `attemptNonce = 0`; seed derived once, persisted in `PlayerState`.
- **Refresh:** `sessionSeed` lives in `PlayerState`; reload reproduces identical variants (no reroll).
  Satisfies the directive's "same player refreshing must always receive the same response."
- **Returning tomorrow:** a different `caseId` yields a different seed naturally (same device, new case).
- **Deliberate replay:** `attemptNonce++` → fresh seed (legitimate variety; forfeits the prior run's
  progress). This is the *only* intentional reseed.
- **Clearing browser storage:** `deviceId` regenerates → new seed. Accepted: no identity system is
  warranted for a daily puzzle.
- **Incognito:** fresh `deviceId` per session → new seed. Accepted.
- **Sharing a device:** same `deviceId` → same variant run for the same case. Accepted: the directive
  explicitly says do not build identity infra; a shared device sees one deterministic run.

### Why
Implements M5 (deterministic per-session) without a reroll exploit (PR-011) and without auth (DEC-007
client-only). The seed is **case-scoped, device-derived, replay-incremented** — not a fixed global
player identity.

### Consequences
`PlayerState` stores `deviceId` + `attemptNonce`; `sessionSeed` derived, never stored as raw entropy.
Refines DEC-028's algorithm with the explicit scenario table above.

---

## DEC-037: Three-Tier Fact Hierarchy (Strengthens INV-114)
**Date:** design-validation gate
**Status:** APPROVED FROM USER DIRECTIVE (PART 1)
**Deciders:** Product

### Decision
Classify every canonical fact into:
- **Tier A (case-critical):** required to identify culprit + reconstruct crime. Must have ≥2 independent
  routes, ≥1 deception-resistant route, and pass solver under worst-case variants (INV-114).
- **Tier B (supporting):** substantially increases confidence; normally 1–2 routes; missing one does
  not block solving.
- **Tier C (atmospheric):** character/history/texture; single route OK; no solvability dependency.
A healthy case is ~60–70% Tier C by dialogue volume, with Tier A as the skeleton.

### Why
Strengthens the directive's "no single answer blocks solvability" into a ranked, testable model and
prevents "every line is a puzzle key" fatigue.

### Consequences
Generator tags facts at Stage 6 (CASE_GENERATION_PIPELINE.md); solver validates Tier A redundancy.

---

## DEC-038: Accusation as Case Theory (Refines DEC-023 / DEC-033)
**Date:** design-validation gate
**Status:** APPROVED FROM USER DIRECTIVE (general direction approved, PART 3); expanded below.
**Deciders:** Product, Design

### Decision
The final accusation is a **Case Theory**, not a form:
- **Required dimensions:** culprit (roster) + what-happened (reconstruction pool) + motive (motive
  pool). Key evidence is **optional** (selected from discovered evidence).
- **Theory Board:** the player may build/revise a private theory freely and silently during play.
- **Confidence model:** the game gives **NO** green/yellow correctness feedback before final submission.
  Formal submit converts the board into the final accusation and locks it; the reveal is the first time
  correctness is known.
- **Grading:** correct dimensions → win; partial → graded score (FR-013/014); no fuzzy matching (INV-013).

### Why
Approves DEC-033's direction and expands it per PART 3: rewards comprehension (named culprit AND
understood method), avoids a 5-question exam, and avoids Wordle-style brute-force elimination.

### Consequences
Supersedes DEC-023/033 in detail; format confirmed as Format Y (P6). DEC-033 status → APPROVED (refined
by DEC-038).

---

## DEC-039: Case Novelty Framework (Multidim Fingerprint + Layered Memory)
**Date:** design-validation gate
**Status:** RECOMMENDED — AWAITING APPROVAL (strengthens DEC-024); direction APPROVED FROM USER DIRECTIVE (PART 4)
**Deciders:** Product, Engineering

### Decision
Adopt a 10-dimension fingerprint (crime_category, crime_structure, truth_structure, narrative_
environment, primary_mechanism, emotional_tone, deception_pattern, evidence_type, solution_structure,
complexity_tier) + layered memory (L1 fingerprints / L2 short summaries / L3 full cases). Comparison
cadence: last 10 strict (hard bans + ≥3-dimension-diff rule), last 30 moderate (soft diversity push),
library general. Forbidden-content hard filter (no sexual violence / gore / child-harm).

### Why
Implements PART 4's "structurally different, not reskinned" requirement and refines DEC-024's schema-
only approach into an active prevention system.

### Consequences
Generator consults L1 at Stage 1 and Stage 15 (CASE_GENERATION_PIPELINE.md). DEC-024 status →
superseded by DEC-039 (schema + active framework).

---

## DEC-040: Character Interrogation Profiles (8 Behaviors)
**Date:** design-validation gate
**Status:** APPROVED FROM USER DIRECTIVE (PART 5A)
**Deciders:** Product, Design

### Decision
Eight profiles — Cooperative, Defensive, Evasive, Nervous, Calculating, Hostile, Manipulative,
Emotional — influence voice/cooperation/framing only; **never** encode guilt or alter canonical truth
(INV-102/103/104). An innocent person can be evasive; a guilty person can be cooperative.

### Why
Resolves DEC-026 explicitly in favor of **meaningful** personality (via DEC-030): characters feel real
without breaking determinism.

### Consequences
DEC-026 → resolved as MEANINGFUL (DEC-030). Profile is a default tendency; per-variant `cooperation`
tag still governs edge cases.

---

## DEC-041: Response Probability Framework
**Date:** design-validation gate
**Status:** RECOMMENDED — AWAITING APPROVAL (PART 6)
**Deciders:** Product, Engineering

### Decision
Per-response-block weighted defaults: Direct truthful 40-55%, Truthful incomplete 15-25%, Evasive
10-18%, Uncertain (justified only) 3-8%, Flat lie 2-6%. Contextual-reveal variants exist only in
`after_*` contexts. **NON-NEGOTIABLE:** "I don't remember" is banned as a cheap mechanic — memory
uncertainty requires a narrative justification in `knowledge`. Which categories may vary: Critical (Tier
A) NO; Supporting (Tier B) YES (may withhold); Emotional reaction / wording YES (highly); Lie YES but
constrained (reason + redundancy).

### Why
Implements PART 6's fairness bounds; keeps variability in *voice/cooperation*, not in whether critical
facts leak.

### Consequences
Generator assigns weights at Stage 8; validator checks bands + justification rule.

---

## DEC-042: Lie Motivation Taxonomy
**Date:** design-validation gate
**Status:** RECOMMENDED — AWAITING APPROVAL (PART 7)
**Deciders:** Product, Engineering

### Decision
Nine codes: SELF_PROTECTION, PROTECT_OTHER, HIDE_UNRELATED_WRONGDOING, EMBARRASSMENT,
FEAR_OF_CONSEQUENCES, MANIPULATE_INVESTIGATION, MAINTAIN_ALIBI, MISREMEMBER, STRATEGIC_OMISSION. Engine
distinguishes guilty lie vs innocent lie vs mistaken statement vs omission vs evasion. Every case
contains >=1 innocent liar whose lie creates a *secondary* (believable red-herring) mystery (INV-109).

### Why
Implements PART 7: lies are reasoned, not random; "liar = culprit" remains an invalid strategy.

### Consequences
Generator assigns LieMotivation at Stage 9; solver guards guilt inference.

---

## DEC-043: Action Economy — Complexity-Scaled Budget (System D)
**Date:** design-validation gate
**Status:** RECOMMENDED — AWAITING APPROVAL (PART 2); supersedes DEC-032
**Deciders:** Product, Engineering

### Decision
One neutral "actions" counter. An action = ask / follow-up / present-evidence / confront (each -1).
Switching characters, opening the Notebook, reviewing Timeline/Evidence/Contradictions, re-reading
statements, and building/revising the Theory Board are **FREE**. Budget scales with complexity tier:
Easy 12 / Medium 16 / Hard 20 (CASE_SCALE_SPEC section 3). A graded **efficiency score** rewards lean
solves without blocking curiosity. No timer/pressure meter (DEC-025 deferred).

### Why
Corrects the user's rejection of DEC-032's flat 14/16/18: separates costed interrogation from free
investigation, scales with complexity, and avoids an energy-bar feel via free exploration + a neutral
counter + score.

### Consequences
DEC-032 (flat numbers) -> **REJECTED AS PROPOSED**; superseded by DEC-043. Accusation is free/cheap so
no soft-lock (INV-009).

---

## DEC-044: Generation Pipeline — 16 Stages
**Date:** design-validation gate
**Status:** APPROVED FROM USER DIRECTIVE (PART 12/14); refines DEC-034
**Deciders:** Product, Engineering

### Decision
16-stage pipeline inserting variant generation (Stage 8) and lie-motivation assignment (Stage 9) into
DEC-034's skeleton. Fairness gates (Stage 6 Tier-A redundancy, Stage 13 >=2 paths, Stage 14 worst-case
variants) **reject the whole case**. Bounded regeneration (no endless loops). Provider-agnostic,
failure-tolerant; live gameplay independent of all generation (INV-003).

### Why
Implements PART 12's ordered review and PART 14's multi-call preference with cost-bounded batching.

### Consequences
DEC-034 -> refined by DEC-044. Multi-call strategy RECOMMENDED (P8).

---

## Reclassification summary from this gate

| DEC | Prior status | New status |
|-----|--------------|------------|
| DEC-023 / DEC-033 | APPROVED (direction) | APPROVED - expanded into DEC-038 Case Theory |
| DEC-024 | APPROVED (schema+hooks) | Superseded by DEC-039 (active novelty framework) |
| DEC-026 | PENDING | Resolved MEANINGFUL via DEC-030/DEC-040 |
| DEC-028 / P1 | APPROVED (algorithm AWAITING) | APPROVED - seed model defined in DEC-036; context-switch formalized as Leverage (INTERROGATION_SYSTEM section 3); magical re-ask forbidden |
| DEC-032 | RECOMMENDED (flat 14/16/18) | **REJECTED AS PROPOSED** - superseded by DEC-043 System D |
| DEC-034 | APPROVED | Refined by DEC-044 (16 stages) |

## Still AWAITING approval (RECOMMENDED items)
DEC-039 (novelty framework detail), DEC-041 (response probabilities), DEC-042 (lie taxonomy), DEC-043
(action economy System D). DEC-036/037/038/040/044 are APPROVED FROM USER DIRECTIVE.
|-----|-------|------------------|-----|-----------------|------------|-------------|
| DEC-020 | Keep human-characters scope; delete identifier rationale | **Yes** | Matches user clarification that "people only" = entity type, not identifier game | Removes the rejected framing | None | **APPROVED** |
| DEC-021 | Hand-authored seed cases behind `CaseGenerator` | **Yes** | Unblocks playability without locking a provider; directive §25/33 | 2–3 playable cases first | Low | **APPROVED** |
| DEC-022 | ~12 actions; free switching/board | **Yes, with refinement** | Valid in spirit; number needs scaling (DEC-032) | Strategic tension, less frustration | Low | **APPROVED; refine via DEC-032** |
| DEC-023 | Accusation: culprit + what + motive (+ evidence) | **Yes, with refinement** | Correct shape; format Y confirmed by simulation | Earned climax | Low-Med | **APPROVED; refine via DEC-033** |
| DEC-024 | Novelty schema + hooks now, populate later | **Yes** | Needed before scale; cheap now | Prevents repetition | Med | **APPROVED** |
| DEC-025 | Pressure/timer meter deferred | **Yes (defer)** | Directive §14/17: don't add unless proven valuable | Budget already pressures | None | **DEFERRED** |
| DEC-026 | Witness personality meaningful vs decoration | **Yes — meaningful** | Directive §9/31 requires characters feel real; DEC-030 makes personality influence interaction without altering truth | Richer voices, determinism preserved | Low | **PENDING → resolve as MEANINGFUL (DEC-030)** |

**Net:** None of DEC-020..026 is reversed. DEC-022 and DEC-023 are *refined* (numbers/format confirmed,
not changed in kind). DEC-026 is resolved in favor of meaningful personality via DEC-030. New mechanics
(DEC-027..035) are recorded above.
