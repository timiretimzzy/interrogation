# Invariants: The Interrogation (Crime-Mystery Interrogation)

> ⚠️ **PRODUCT REDEFINITION — 2025-08-29.** This file is rewritten for the canonical crime-mystery
> interrogation product. The prior INV-004 (deception known-count), INV-005 (IRRELEVANT = schema
> inapplicability), INV-008 (candidate filtering soundness), and INV-012 (predicate↔fact bijection)
> are **superseded** and removed. The prior INV-001/002/003/006/007/009/010/011/013/014/015 are
> retained (some re-interpreted). New crime-model invariants INV-101..INV-112 are added. See
> `PRODUCT_CORRECTION_REPORT.md` §6.

---

## INV-001: Canonical Truth Never Exposed Before Reveal (RETAINED, retargeted)
**STATEMENT:** A case's canonical `truth` (culprit, what, motive, timeline, lies) must never be present
in the client bundle, source maps, network requests, or JS memory before the player makes an
accusation or the game ends.

**WHY:** If the solution is discoverable via DevTools, the deduction is destroyed.

**ENFORCED:** Case data is split — an initial index (briefing + roster intros only) and a lazy
per-case chunk containing `truth`/`characters`/`questions`/`contradictions`. The chunk is loaded only
when the case is opened, and `truth` is never rendered until reveal. Build audit greps for `truth`/
`culpritId` outside lazy case chunks.

**TESTED:** `grep -r "culpritId" dist/` → only in lazy-loaded case chunks. Manual DevTools + Network.

**FAILURE IMPACT:** CRITICAL.

---

## INV-002: Statement Determinism (RETAINED, re-interpreted)
**STATEMENT:** For any given case, character, question, and discovered-context set, the resolved
statement is fixed and deterministic. Same inputs across 1000 runs yield identical statements.

**WHY:** Non-deterministic answers make logical deduction impossible.

**ENFORCED:** `resolveStatement(case, character, question, discoveredContext) → Resolution` is a pure
lookup (no RNG, no date variation, no session state). Deception direction and truth states are fixed
in case data.

**TESTED:** Unit test: 1000 runs of same case → identical statement sequences. Integration: play full
case twice → identical transcripts.

**FAILURE IMPACT:** CRITICAL.

---

## INV-003: No Runtime Interpretation / No Runtime LLM (RETAINED)
**STATEMENT:** The system never uses LLMs, AI, NLP, fuzzy matching, or any interpretive layer to decide
a statement, outcome, contradiction, or win at runtime. All logic is a pure, auditable evaluation of
structured case data.

**WHY:** Runtime interpretation introduces ambiguity, non-determinism, hallucination; breaks offline.

**ENFORCED:** CSP `connect-src 'none'`; build audit for `eval|Function|fetch|openai|anthropic`; no
runtime LLM dependency. LLM (if used) only at dev-time generation behind `CaseGenerator`.

**TESTED:** Build audit zero matches; DevTools Network → zero requests during play; unit test every
resolution evaluates without error.

**FAILURE IMPACT:** CRITICAL.

---

## INV-006: Fair Question / Information Availability (RETAINED, re-expressed)
**STATEMENT:** Every available Question Card is a meaningful strategic option. No card is a trap that
provides zero information in all paths; no single forced question order exists (multiple viable paths).

**WHY:** Trivial or forced choices remove strategic depth.

**ENFORCED:** Build-time analysis per case: information value of each card; solver confirms ≥2 viable
first moves and branching. Minimum 2 distinguishing discoveries per viable path.

**TESTED:** Solver metric "strategic depth" per case; CI fails if any case has <2 viable opening leads.

**FAILURE IMPACT:** MEDIUM.

---

## INV-007: Every Shipped Case Is Solvable With ≥2 Paths (RETAINED, retargeted)
**STATEMENT:** For every case, there exists at least two independent sequences of ≤ interrogationBudget
actions that reach a correct accusation, given the predetermined lies/evasions and the unlock graph.

**WHY:** Unsolvable or single-path cases waste player time and feel unfair.

**ENFORCED:** Automated solver at build time (CI). Search/simulation over question sequences against the
statement/evidence graph. Rejects cases with <2 paths or trivial single-answer solves.

**TESTED:** `npm run validate:cases` exits non-zero if any case unsolvable or single-path. Solver unit
tests on toy cases.

**FAILURE IMPACT:** CRITICAL.

---

## INV-009: Game State Persists Across Sessions (RETAINED)
**STATEMENT:** In-progress case state (interrogations, discovered clues, unlocked questions, flagged
contradictions, accusation) and meta-state (daily streak, last daily date, practice completions)
survive browser close, refresh, and offline.

**WHY:** Losing progress on refresh is a top failure condition.

**ENFORCED:** Single LocalStorage key; saved after every mutation; validated + migrated on load;
in-memory fallback if unavailable.

**TESTED:** E2E: play → refresh → restored. Close → reopen → streak preserved. Private mode → works.

**FAILURE IMPACT:** HIGH.

---

## INV-010: Daily Case Is Consistent Per Calendar Day (UTC) (RETAINED)
**STATEMENT:** For any UTC date, all players receive the exact same daily case.

**WHY:** Daily ritual is a shared social experience.

**ENFORCED:** Daily id derived from UTC date; deterministic client-side mapping; no server logic.

**TESTED:** Unit: same date → same case id. Integration: mock date → loads correctly.

**FAILURE IMPACT:** MEDIUM.

---

## INV-011: No Runtime Network Requests for Gameplay (RETAINED)
**STATEMENT:** After initial load + SW registration, zero network requests during gameplay.

**WHY:** Offline play; privacy; performance.

**ENFORCED:** Case data bundled as static lazy chunks; SW caches on first visit; CSP `connect-src
'none'`.

**TESTED:** Lighthouse offline CI; DevTools Network → zero requests during play.

**FAILURE IMPACT:** MEDIUM.

---

## INV-013: Win/Loss Determination Is Correct (RETAINED, re-expressed)
**STATEMENT:** An accusation is marked correct iff every required `answerDimension` matches the case
`truth`. Partial matches produce a graded score; no fuzzy matching.

**WHY:** False wins/losses destroy trust.

**ENFORCED:** `evaluateAccusation(accusation, truth)` pure function; reveal always shows canonical truth.

**TESTED:** Unit: correct dimensions → win; wrong culprit/motive → loss; partial → graded.

**FAILURE IMPACT:** HIGH.

---

## INV-014: No Silent Data Corruption (RETAINED)
**STATEMENT:** Any LocalStorage failure (quota, corruption, version mismatch) is detected, reported, and
recovered without losing current answers.

**WHY:** Silent corruption loses progress invisibly.

**ENFORCED:** Versioned state; try/catch parse/write; banners; never overwrite good with corrupt.

**TESTED:** Corrupted JSON → banner + fresh start. Quota → banner + in-memory. Migration v→v+1.

**FAILURE IMPACT:** MEDIUM.

---

## INV-015: Share Output Contains No Spoilers (RETAINED)
**STATEMENT:** Share string reveals nothing about culprit, twist, method, or sensitive identities;
only solved/unsolved, culprit-identified flag, contradictions found, key connections, actions used.

**WHY:** Spoilers ruin the daily for others.

**ENFORCED:** Emoji grid only; unit test regex matches allowed set; no alphanumeric secrets.

**TESTED:** Unit: generate share → verify no secret names / no twist text.

**FAILURE IMPACT:** MEDIUM.

---

# New Crime-Model Invariants (added 2025-08-29)

## INV-101: Canonical Truth Exists Before Gameplay
**STATEMENT:** Every case has exactly one complete canonical version of events (incident, culprit,
motive, method, timeline, relationships, lies, contradictions) authored before publication.

**WHY:** The deterministic engine must run against a fixed world.

**ENFORCED:** `truth` required in case schema; generation pipeline produces truth first (architecture
proposal §11 step 2). Validation rejects cases with missing/ambiguous truth.

**TESTED:** Schema validation; unit test every shipped case has full `truth`.

**FAILURE IMPACT:** CRITICAL.

---

## INV-102: Runtime Determinism (No LLM Decides Answers)
**STATEMENT:** The game never calls an LLM to decide an answer, contradiction, or win during active play.

**WHY:** See INV-003 — fairness, offline, trust.

**ENFORCED:** See INV-003 enforcement.

**FAILURE IMPACT:** CRITICAL.

---

## INV-103: Character Knowledge Boundaries
**STATEMENT:** A character cannot truthfully reveal information they do not possess, unless the case
explicitly defines them as lying, guessing, or speculating.

**WHY:** Prevents "characters know everything" and preserves the knowledge graph's meaning.

**ENFORCED:** Each `Resolution.truthState` maps to the character's `knowledge` model; UNKNOWN/EVASIVE
used where `knowledgeGaps` apply; validation checks statements against `knowledge`.

**TESTED:** Unit: for each resolution, truthState is consistent with that character's `knowledge`.

**FAILURE IMPACT:** HIGH.

---

## INV-104: No Accidental Contradictions
**STATEMENT:** A character's statements must not contradict their own defined knowledge model unless the
contradiction is intentionally authored (e.g. a lie or evasion).

**WHY:** Unintended self-contradiction makes the case incoherent / unsolvable.

**ENFORCED:** Logic validation: for each character, compare all their resolutions against `knowledge`;
flag mismatches not marked as lies/evasions.

**TESTED:** Logic validation gate; unit on toy cases.

**FAILURE IMPACT:** HIGH.

---

## INV-105: Multiple Solution Paths
**STATEMENT:** No valid case depends on one exact interrogation sequence (see INV-007).

**WHY:** A forced sequence is a visual novel, not a mystery.

**ENFORCED:** Solver requires ≥2 independent paths.

**FAILURE IMPACT:** CRITICAL.

---

## INV-106: No Mandatory External Knowledge
**STATEMENT:** Players must solve cases using information inside the game. No real-world trivia required.

**WHY:** Outside knowledge makes the game unfair and un-fun.

**ENFORCED:** Generation review; every fact needed for the solution exists as a statement/clue/evidence
in the case.

**TESTED:** Solver + human entertainment gate confirm self-contained solvability.

**FAILURE IMPACT:** HIGH.

---

## INV-107: Deception Is Not Labelled
**STATEMENT:** The game never explicitly tells the player whether a character lied (or the truth state)
during interrogation. Contradictions are shown as ambiguous "⚠ possible inconsistency," never "X is
lying."

**WHY:** Labelling deception destroys the deduction; the player must earn the realization.

**ENFORCED:** UI renders `statement` text only; invariant audit + test assert no truth-state string is
rendered to the player during play; reveal shows truth states.

**TESTED:** Unit/UI test: no TRUE/FALSE/DECEPTIVE/MISLEADING label in interrogation view; reveal only.

**FAILURE IMPACT:** HIGH.

---

## INV-108: Fair Evidence Access
**STATEMENT:** Critical evidence required for a correct accusation must be accessible through reasonable
investigation within the action budget.

**WHY:** Hidden-only-clue cases are unfair.

**ENFORCED:** Solver verifies key evidence reachable on ≥1 path within budget.

**FAILURE IMPACT:** HIGH.

---

## INV-109: Unrelated Secrets (Innocent Liars)
**STATEMENT:** At least some suspicious/deceptive behavior may be unrelated to the central crime where
appropriate; a lie alone must never logically prove guilt.

**WHY:** "Liar = culprit" is a boring, exploitable strategy.

**ENFORCED:** Generation requires ≥1 innocent liar per case (where structure allows); solver guards
that no single lie implies culprit.

**TESTED:** Solver guard; unit on each case: innocent-liar present; guilt not implied by one lie.

**FAILURE IMPACT:** HIGH.

---

## INV-110: Historical Novelty
**STATEMENT:** New cases must pass structural similarity checks against the Historical Case Memory index
before approval.

**WHY:** Prevents "same game in different clothes" repetition.

**ENFORCED:** Fingerprint distance across genre/setting/mechanism/culprit-role/motive/twist/
solution-structure; ban overused combinations; prefer underused.

**TESTED:** Novelty validator; unit on fingerprint comparison.

**FAILURE IMPACT:** MEDIUM (retention risk).

---

## INV-111: Case Completeness
**STATEMENT:** The LLM-generated (or hand-authored) case must be fully structured (all schemas populated)
before publication; no partial/runtime-completed cases.

**WHY:** Incomplete cases break determinism and solvability.

**ENFORCED:** Schema validation at publish; missing fields → reject.

**FAILURE IMPACT:** HIGH.

---

## INV-112: Reveal Coherence
**STATEMENT:** The final reveal must explain all major intentional contradictions and mysteries, including
which characters lied, why innocent characters lied, which clues mattered, and what the player missed.

**WHY:** The reveal is the reward; an unsatisfying or contradictory reveal breaks retention.

**ENFORCED:** `reveal` schema required; entertainment gate checks "satisfying reveal" + "≥1 wait moment."

**TESTED:** Entertainment gate; manual review of seed cases.

**FAILURE IMPACT:** MEDIUM.

---

## Removed / Superseded Invariants (record only)

- **INV-004 (Deception known count, disclosed):** SUPERSEDED by INV-107 (deception never labelled) +
  INV-109 (innocent liars). The old "player knows total deceptive count" is explicitly rejected.
- **INV-005 (IRRELEVANT = predicate doesn't apply to schema):** SUPERSEDED by the knowledge-boundary
  model (INV-103) where "doesn't apply / I don't know" is a character property, not a schema property.
- **INV-008 (Candidate filtering soundness):** SUPERSEDED — auto candidate elimination is removed as a
  mechanic (player reasons via the knowledge graph). Retained only as an internal solver concern.
- **INV-012 (Card predicate↔fact bijection):** SUPERSEDED by statement-resolution determinism
  (INV-002) — cards no longer map to a single boolean predicate.
---

## Variability Invariants (added 2025-08-29, Mechanics Lock)

## INV-113: Response Determinism Within Session
**STATEMENT:** For any given `(sessionSeed, case, question, character, context)`, the selected response
variant is fixed and deterministic. Same inputs across refresh and device yield the identical variant.
No runtime RNG, clock, or LLM participates in selection.

**WHY:** Non-deterministic responses make deduction unstable and enable refresh-reroll exploits.

**ENFORCED:** Selection = `weightedPick(hash(sessionSeed, caseId, questionId, characterId, contextId),
variants)` (RESPONSE_VARIABILITY_MODEL.md §4). `sessionSeed` persisted in `PlayerState`; regenerated
only on deliberate restart (`attemptNonce`), not on refresh.

**TESTED:** Unit: serialize PlayerState → reload → identical transcript. Same seed across 1000 runs →
same variant.

**FAILURE IMPACT:** HIGH.

---

## INV-114: Redundant Critical Facts (No Single Answer Blocks Solvability)
**STATEMENT:** For every canonical fact `F` required to reach a correct accusation, the case must satisfy
either (a) `F` is disclosed by at least one variant on each of ≥2 independent question/character routes,
or (b) if `F` has exactly one route `R`, every variant in `R`'s variant set discloses `F`. Any character
who **lies** about `F` must sit on a route that also has an independent truthful route.

**WHY:** The directive mandates "no single random answer can make a case unsolvable"; critical facts must
have redundancy.

**ENFORCED:** Build-gate validator + solver input. Solver verifies solvability under the minimum-
disclosure (worst-case) variant selection while the redundancy graph still yields ≥2 paths
(RESPONSE_VARIABILITY_MODEL.md §7, §11).

**TESTED:** Validator rejects cases where a required fact has a single route with a withholding variant.
Solver unit: worst-case variant set → ≥2 paths remain.

**FAILURE IMPACT:** CRITICAL.

---

## Testable Invariants Added — Design-Validation Gate (2025)

> Only invariants that are concretely testable (validator / solver / UI-audit) are added. Vague
> philosophical statements are intentionally excluded (directive PART 17).

## INV-115: Fact Tier Classification
**STATEMENT:** Every canonical fact is tagged `Tier A` (case-critical), `Tier B` (supporting), or
`Tier C` (atmospheric). Tier A facts must additionally satisfy INV-114 redundancy (≥2 independent
routes, ≥1 deception-resistant, solvable under worst-case variants).
**WHY:** Ranks "no single answer blocks solvability" into a testable hierarchy; prevents "every line is a
puzzle key" fatigue.
**ENFORCED:** Generator tags facts at pipeline Stage 6; validator rejects any untagged fact and any Tier A
fact failing INV-114.
**TESTED:** Validator unit: untagged fact → reject; Tier A with single route + withholding variant →
reject.
**FAILURE IMPACT:** HIGH.

## INV-116: Contradictions Are Authored-Only
**STATEMENT:** A possible contradiction is surfaced to the player **only** when both participating
statements are recorded AND they match an authored `ContradictionLink`. The engine never infers or
computes a contradiction at runtime.
**WHY:** Prevents false "X is lying" moments; preserves ambiguity (INV-107).
**ENFORCED:** UI surfaces a contradiction iff a `ContradictionLink` with both statement refs is satisfied
in `PlayerState`. No runtime comparison of statements.
**TESTED:** Unit: two conflicting-but-unlinked statements → no contradiction surfaced; linked pair →
surfaced as "⚠ possible inconsistency" only.
**FAILURE IMPACT:** HIGH.

## INV-117: No Pre-Reveal Correctness Feedback
**STATEMENT:** The game renders **no** correctness signal (green/yellow/red, "correct/incorrect",
progress-toward-truth) for any theory, accusation dimension, or statement before the final reveal.
**WHY:** Pre-reveal feedback turns a mystery into Wordle-style brute force (PART 3).
**ENFORCED:** Theory Board is silent; accusation submit is the first correctness event; UI audit greps
for forbidden feedback strings.
**TESTED:** UI test: build/revise theory → no feedback DOM node; submit → reveal only.
**FAILURE IMPACT:** HIGH.

## INV-118: Free Investigation Never Blocks Progress
**STATEMENT:** Switching characters, opening/reviewing the Notebook (Timeline/Evidence/Contradictions/
Statements/People/Leads), re-reading statements, and building/revising the Theory Board consume **no**
action and can never produce a dead state. A player can always submit a (final) accusation.
**WHY:** Curiosity must not be punished; no soft-lock (INV-009).
**ENFORCED:** These actions are excluded from the action counter; accusation is always available.
**TESTED:** Integration: exhaust action budget on questions → accusation still reachable.
**FAILURE IMPACT:** MEDIUM.

## INV-119: Response Variability Bounds
**STATEMENT:** (a) An `UNCERTAIN` / "I don't remember" variant must cite a narrative justification fact in
`knowledge` (never a cheap block). (b) Per-response-block weights must fall within the bands: truthful
40-55%, incomplete 15-25%, evasive 10-18%, uncertain 3-8%, flat lie 2-6%. (c) Critical (Tier A) facts
are never withheld on every route (INV-114/115).
**WHY:** Bounds variability to voice/cooperation, not to solvability (PART 6).
**ENFORCED:** Generator validator checks justification presence + weight bands at Stage 8.
**TESTED:** Validator: uncertain variant without justification → reject; lie weight 20% → reject.
**FAILURE IMPACT:** MEDIUM.

## INV-120: Seed Stability (No Reroll, No Identity)
**STATEMENT:** `sessionSeed = hash(deviceId, caseId, attemptNonce)` is persisted in `PlayerState` and is
**stable across refresh**; it changes **only** when `attemptNonce` is incremented on a deliberate replay.
No runtime clock/RNG/LLM participates in selection (extends INV-113).
**WHY:** Prevents refresh-reroll exploitation (PR-011) without requiring player-identity infra.
**ENFORCED:** Selection uses only persisted `sessionSeed`; `attemptNonce` mutated solely by explicit
restart.
**TESTED:** Unit: reload mid-case → identical transcript; deliberate replay → different but deterministic
seed.
**FAILURE IMPACT:** HIGH.
Solver unit: worst-case variant set → ≥2 paths remain.

**FAILURE IMPACT:** CRITICAL.
