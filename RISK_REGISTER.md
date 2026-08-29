# Risk Register: The Interrogation

## Risk Classification
| Level | Criteria |
|-------|----------|
| **CRITICAL** | Game fundamentally broken; unplayable; core mechanic fails; data loss |
| **HIGH** | Major feature broken; poor UX; significant player frustration; retention risk |
| **MEDIUM** | Noticeable issue; workaround exists; polish gap; technical debt |
| **LOW** | Minor annoyance; edge case; nice-to-have improvement |

---

## Risks

> ⚠️ **SUPERSEDED PROTOTYPE CONTEXT.** The RISK-001..RISK-016 block below was authored for the rejected
> "hidden-secret identifier" prototype (people pool, candidate filtering, demographic predicates,
> `hiddenSecretId`, four-outcome badges, "guess the person"). It is retained only for historical
> traceability — **do not implement its mitigations as if they applied to the new architecture.** Re-scoped
> by the product-correction addenda: RISK-001 & RISK-011 remain valid but **retargeted** to case-graph
> solvability; RISK-002 (candidate-filter bug), RISK-007 (pool similarity), and RISK-008 (DECEPTIVE vs
> IRRELEVANT) are **MOOT** (deleted mechanics); RISK-003 is retargeted to canonical-truth-in-lazy-chunk.
> The corrected product's live risks are **PR-001..PR-020**.

### RISK-001: Unsolvable Puzzles Shipped
**Level:** CRITICAL
**Category:** Game Design / Content

**Description:** A puzzle exists in the daily or practice pool that cannot be solved within its question budget given its deceptive cards and IRRELEVANT cards, despite passing a flawed solver.

**Impact:** Player wastes 10+ minutes, loses trust, quits. Daily puzzle unsolvable = broken daily ritual.

**Root Causes:**
- Solver algorithm has blind spots (e.g., doesn't consider all card sequences)
- Puzzle authoring error (deceptive cards chosen poorly, too many IRRELEVANT cards)
- Candidate pool too dense (too many similar people)
- Card curation creates bottlenecks (key distinguishing cards missing)

**Mitigation:**
1. **Solver completeness proof**: Use exhaustive search for small pools; for full pool, use constraint solver with optimality guarantee (not greedy).
2. **Dual solver validation**: Run two independent solver implementations (e.g., SAT-based + BFS) — both must agree.
3. **Human playtest gate**: Every daily puzzle playtested by designer before ship.
4. **Fallback**: If unsolvable detected post-ship, hot-swap daily puzzle via SW update (puzzle data versioned).

**Detection:** CI solver run; post-launch monitoring of "loss with 0 candidates remaining" telemetry (if added).

**Contingency:** Emergency puzzle replacement via Service Worker cache update.

---

### RISK-002: Candidate Filtering Logic Bug
**Level:** CRITICAL
**Category:** Core Logic

**Description:** The real-time candidate filter shows incorrect candidates (too many or too few), misleading the player.

**Impact:** Player makes deductions based on wrong information → guaranteed loss or false win. Core mechanic broken.

**Root Causes:**
- `isConsistent` function doesn't correctly model "exactly N deceptive cards" + IRRELEVANT constraint
- Off-by-one in card index tracking
- Predicate evaluation error for edge cases (living persons, missing data, category mismatches)
- DECEPTIVE direction logic inverted (truthAsFalse vs falseAsTruth)

**Mitigation:**
1. **Property-based testing**: Generate 10,000 random game states, verify filter matches brute-force enumeration.
2. **Formal specification**: Write `isConsistent` as pure function with exhaustive unit tests for all deception-assignment combinations.
3. **Runtime invariant check**: In dev mode, after each card, run slow brute-force verification and assert equality with fast filter.
4. **Code review gate**: Two-person review for any filter logic change.

**Detection:** Automated tests; dev-mode invariant assertion.

**Contingency:** Hotfix deploy; if widespread, disable daily puzzle until fixed.

---

### RISK-003: Answer Key Leaked in Client Bundle
**Level:** CRITICAL
**Category:** Security / Architecture

**Description:** Hidden secret identity or fact sheet accessible via DevTools, source maps, or network inspection.

**Impact:** Game trivially cheatable. Competitive integrity destroyed. Social sharing spoiled.

**Root Causes:**
- Puzzle data includes full fact sheet for hidden secret
- Source maps expose variable names
- Build process inlines puzzle data in main bundle

**Mitigation:**
1. **Architecture**: Client receives only candidate pool (array of all secrets) + puzzle definition with `hiddenSecretId`. The hidden secret is just one element in the pool. No special data sent.
2. **Build audit**: CI step `grep -r "hiddenSecretId\|factSheet" dist/` — fail if found outside lazy-loaded chunks.
3. **No source maps in production** (or stripped).
4. **CSP**: `connect-src 'none'` prevents exfiltration.

**Detection:** Automated build audit; manual DevTools inspection.

**Contingency:** Rotate puzzle pool; rebuild without source maps.

---

### RISK-004: Daily Puzzle Date/Timezone Bug
**Level:** HIGH
**Category:** Core Logic

**Description:** Players in different timezones get different daily puzzles, or puzzle doesn't advance at midnight UTC.

**Impact:** Streak breaks incorrectly; sharing confusing ("I got Einstein but you got Curie?"); community trust damaged.

**Root Causes:**
- Using local date instead of UTC
- Date calculation off-by-one at month/year boundaries
- Service Worker serving stale daily puzzle

**Mitigation:**
1. **Single source of truth**: `const today = new Date().toISOString().split('T')[0]` — always UTC.
2. **Unit tests**: Test date boundaries (Dec 31 → Jan 1, Feb 28 → Mar 1, leap years).
3. **SW cache strategy**: Daily puzzle chunk named `daily-YYYY-MM-DD.json` — SW caches by exact name, no stale-while-revalidate for daily.
4. **Manual verification checklist** for launch.

**Detection:** Automated tests; staging deployment across timezones.

**Contingency:** Hotfix date logic; SW update to clear stale daily cache.

---

### RISK-005: LocalStorage Persistence Failure
**Level:** HIGH
**Category:** Data / Reliability

**Description:** Game state lost on refresh, private mode, quota exceeded, or corruption.

**Impact:** Player loses in-progress game; daily streak reset; frustration; abandonment.

**Root Causes:**
- Private/incognito mode blocks LocalStorage
- Quota exceeded (other sites filling storage)
- JSON parse error from corrupted data
- Version migration bug

**Mitigation:**
1. **Graceful degradation**: Try/catch all LocalStorage ops. On failure → in-memory state + visible banner "Progress not saved — private mode or storage full."
2. **Schema versioning**: `stateVersion` in stored object. Migration function for each version bump.
3. **Quota monitoring**: Catch `QuotaExceededError`, show banner, continue in-memory.
4. **Corruption recovery**: On parse error → backup corrupted data, show "Could not restore progress" banner, start fresh.

**Detection:** E2E tests in private mode; storage quota stress test.

**Contingency:** In-memory fallback always works; no data loss during active session.

---

### RISK-006: Question Card Ambiguity
**Level:** HIGH
**Category:** Content / Game Design

**Description:** A Question Card's text is interpretable multiple ways, or its predicate doesn't match the text semantics, causing player confusion.

**Impact:** Player asks "Was the person born in the 1900s?" meaning 1900-1999, but predicate checks `birthYear >= 1900 && birthYear < 2000` — mismatch causes confusion and wrong deductions.

**Root Causes:**
- Card text imprecise ("1900s" vs "20th century")
- Predicate doesn't match text semantics
- Cultural/linguistic ambiguity
- Predicate field doesn't exist for some categories (should be IRRELEVANT but isn't marked)

**Mitigation:**
1. **Card review checklist**: Every card text must match predicate 1:1. "Born before 1900" → `birthYear < 1900`. "Born in the 1900s" → BANNED (ambiguous).
2. **Predicate-driven text**: Generate card text from predicate programmatically, or enforce text = predicate description.
3. **Category validation**: Build-time check that every card in a puzzle's `availableCardIds` either has a valid predicate for the puzzle's category OR is explicitly listed in `irrelevantCardIds`.
4. **Playtest with fresh eyes**: Non-designers play and flag confusing cards.

**Detection:** Playtest feedback; unit test predicate/text alignment; build-time category validation.

**Contingency:** Disable ambiguous card via config; replace in next content patch.

---

### RISK-007: Candidate Pool Too Similar (Low Discriminability)
**Level:** HIGH
**Category:** Game Design / Content

**Description:** Many people in pool share similar facts (e.g., 50 European male scientists born 1800-1900). Cards don't narrow candidates enough.

**Impact:** Player cannot eliminate enough candidates in question budget. Puzzle feels impossible even if technically solvable.

**Root Causes:**
- Pool composition skewed to certain demographics/eras
- Question cards don't cover distinguishing facts
- Fact schema missing key discriminators

**Mitigation:**
1. **Pool diversity metrics**: At build time, compute pairwise fact similarity. Flag clusters >80% similar.
2. **Card coverage analysis**: For each pair of persons, count cards that distinguish them. Minimum threshold (e.g., ≥3 distinguishing cards per pair).
3. **Curated pool**: Manually balance pool across gender, era, continent, profession, real/fictional.
4. **Solver-informed design**: If solver needs > budget questions for a puzzle, adjust pool or cards.

**Detection:** Build-time analysis; solver step count distribution.

**Contingency:** Add distinguishing cards; prune similar pool members.

---

### RISK-008: DECEPTIVE vs IRRELEVANT Confusion
**Level:** HIGH
**Category:** UX / Game Design

**Description:** Players cannot distinguish "the witness lied" (DECEPTIVE) from "the question doesn't apply" (IRRELEVANT) from "the answer is no" (FALSE).

**Impact:** Wrong deductions. Player thinks a fact is false when it's actually inapplicable, or vice versa. Core deduction loop breaks.

**Root Causes:**
- UI doesn't clearly distinguish the three visually
- Witness response text too similar across types
- Reveal screen doesn't explain the difference clearly
- Tutorial doesn't teach the distinction

**Mitigation:**
1. **Distinct visual language**: Each outcome has unique color + icon + shape + text label. Not color alone.
   - TRUE: 🟩 Green, checkmark, "TRUE"
   - FALSE: 🟦 Blue, X, "FALSE"
   - DECEPTIVE: 🟥 Red, mask, "DECEPTIVE"
   - IRRELEVANT: ⚪ Gray, slash, "IRRELEVANT"
2. **Witness response differentiation**: DECEPTIVE responses sound confident but wrong. IRRELEVANT responses explicitly mention "doesn't apply" / "not relevant" / "wrong question for this case."
3. **Reveal screen explanation**: Each DECEPTIVE card shows "This was a lie — the truth was X." Each IRRELEVANT shows "This question doesn't apply to [category] — no information gained."
4. **Interactive tutorial**: Dedicated step teaching the four outcomes with examples.

**Detection:** Playtest: 90%+ correctly distinguish in post-game survey. Automated test: reveal screen text contains required explanations.

**Contingency:** UI hotfix for visual distinction; rewrite witness responses; enhance tutorial.

---

### RISK-009: Mobile Usability Issues
**Level:** MEDIUM
**Category:** UX / Platform

**Description:** Card buttons too small, candidate list scrolls poorly, virtual keyboard covers guess input, touch targets <44px.

**Impact:** Mobile players (50%+ of traffic) have frustrating experience; abandonment.

**Root Causes:**
- Desktop-first CSS
- Fixed-height candidate list
- No viewport optimization

**Mitigation:**
1. **Mobile-first CSS**: Touch targets ≥48px, fluid layouts, `vh` units for candidate list.
2. **Responsive card grid**: 1 column mobile, 2-3 desktop.
3. **Guess input**: Native `<select>` or autocomplete with `inputmode="search"` — avoid keyboard overlap.
4. **Test on real devices**: iOS Safari, Chrome Android — not just DevTools device toolbar.

**Detection:** Lighthouse mobile audit; manual device testing.

**Contingency:** CSS hotfix deploy; no logic changes needed.

---

### RISK-010: Service Worker Caching Bugs
**Level:** MEDIUM
**Category:** Reliability / Offline

**Description:** SW serves stale puzzle data, fails to cache new daily puzzle, or breaks on update.

**Impact:** Player sees yesterday's daily puzzle; offline play broken; "white screen" on update.

**Root Causes:**
- Cache-first strategy for daily puzzle (should be network-first or cache-only with versioned names)
- SW lifecycle mishandled (skipWaiting, clients.claim)
- Opacity of SW debugging

**Mitigation:**
1. **Versioned asset names**: `daily-2025-01-15-v1.json` — immutable, cache forever.
2. **Daily puzzle**: Network-first with timeout (500ms) → fallback to cache. Lazy load daily puzzle chunk, SW caches on first fetch.
3. **Workbox** or minimal custom SW with clear strategy.
4. **SW update flow**: `skipWaiting` + `clients.claim` + version banner "New version available — refresh."

**Detection:** Lighthouse PWA audit; offline simulation test; SW update test.

**Contingency:** Unregister SW via console; clear cache; redeploy.

---

### RISK-011: Solver Performance / Build Time
**Level:** MEDIUM
**Category:** Technical / CI

**Description:** Automated solver takes too long (CI timeout) or uses too much memory for 366 daily + 50 practice puzzles.

**Impact:** CI fails or times out; content pipeline blocked; developer frustration.

**Root Causes:**
- Exhaustive search on 400-person pool × 60 cards × 10 questions = huge state space
- No pruning / heuristics
- IRRELEVANT and DECEPTIVE direction branching increases complexity

**Mitigation:**
1. **Solver optimization**: Constraint propagation + backtracking with heuristics (most-constraining card first).
2. **Parallelization**: Run solver per puzzle in parallel (Node worker_threads).
3. **Timeout guard**: Per-puzzle timeout (30s), fail fast.
4. **Incremental validation**: Only re-validate changed puzzles (git diff on puzzle data).

**Detection:** CI duration monitoring.

**Contingency:** Reduce pool size temporarily; optimize solver; increase CI timeout.

---

### RISK-012: Player Finds Game Too Hard / Unfun
**Level:** MEDIUM
**Category:** Product / Design

**Description:** Target audience struggles to win; deduction feels like guessing; high drop-off before first win.

**Impact:** Low retention; negative reviews; daily ritual not formed.

**Root Causes:**
- Question budget + deception count too tight for pool size
- Candidate filtering UI doesn't help reasoning
- No tutorial / onboarding for logic mechanics
- Practice puzzles too hard for beginners
- IRRELEVANT cards confuse new players

**Mitigation:**
1. **Difficulty calibration**: Easy practice puzzles solvable in 5-6 questions by novice. Solver provides "optimal question count" metric.
2. **Visual deduction aids**: Show "If this outcome is DECEPTIVE, these candidates are eliminated" on hover (optional).
3. **Interactive tutorial**: 3-step guided puzzle teaching outcome types and deception logic.
4. **Adjustable parameters (post-V1)**: Question budget, deception count — but V1 fixed per puzzle.

**Detection:** Playtest sessions; funnel analytics (if added post-V1); completion rates.

**Contingency:** Add tutorial; adjust practice puzzle difficulty; consider +1 question for Practice only.

---

### RISK-013: Content Pipeline Bottleneck
**Level:** MEDIUM
**Category:** Operations / Content

**Description:** Creating 400 verified person profiles + 400 puzzles with card curation + deception assignment + IRRELEVANT marking + solver validation is manual and slow.

**Impact:** Launch delayed; content quality suffers; daily pool incomplete.

**Root Causes:**
- Fact verification requires research
- Card curation per puzzle requires solver iteration
- Deception assignment requires strategic thinking
- No tooling for puzzle authoring

**Mitigation:**
1. **Authoring tool**: Simple web UI to create person → auto-generates fact sheet from structured input → validates completeness.
2. **Puzzle generator**: Select hidden person → auto-pick available cards + deception assignment + IRRELEVANT cards that yield solvable puzzle (solver-in-the-loop).
3. **Data sources**: Use Wikidata / structured datasets for bulk import, then human verify.
4. **Phased content**: Launch with 150 people, 20 practice, 100 daily → expand post-launch.

**Detection:** Content velocity tracking.

**Contingency:** Reduce V1 pool size; prioritize quality over quantity.

---

### RISK-014: Card Curation Creates Unintended "Meta" Solutions
**Level:** MEDIUM
**Category:** Game Design

**Description:** Players discover patterns in card curation (e.g., "the first card is never DECEPTIVE" or "IRRELEVANT cards always appear last") that trivialize deduction.

**Impact:** Strategic depth reduced to pattern-matching. Replayability damaged.

**Root Causes:**
- Authoring patterns become predictable
- Solver doesn't check for meta-patterns
- Insufficient randomization/variation in curation process

**Mitigation:**
1. **Curation guidelines**: Explicit anti-pattern rules (deception distributed randomly, IRRELEVANT mixed throughout).
2. **Solver meta-check**: Analyze puzzle set for statistical patterns in deceptive/IRRELEVANT placement.
3. **Authoring tool enforcement**: Warn if deception positions follow simple pattern.

**Detection:** Statistical analysis of shipped puzzles; playtest feedback.

**Contingency:** Retroactive puzzle patch via SW; revise authoring guidelines.

---

### RISK-015: Browser Compatibility Regression
**Level:** LOW
**Category:** Platform

**Description:** Feature works in Chrome but breaks in Safari/Firefox (e.g., `Array.findLast`, `CSS :has()`, `localStorage` in iframe).

**Impact:** Segment of players cannot play.

**Mitigation:**
1. **Baseline 2023+ features only** — check caniuse.
2. **CI test matrix**: Playwright on Chrome, Firefox, WebKit (Safari).
3. **Polyfill policy**: No polyfills — use transpilation (esbuild target) or avoid feature.

**Detection:** Cross-browser CI.

**Contingency:** Feature-specific fallback; graceful degradation.

---

### RISK-016: Scope Creep During Development
**Level:** LOW
**Category:** Process

**Description:** Developer adds "small" features (animations, sound, themes, stats) that delay V1.

**Impact:** Launch delayed; complexity increases; bugs introduced.

**Mitigation:**
1. **V1_SCOPE.md as contract** — any addition requires ORANGE decision process.
2. **Weekly scope review**: Compare current work against V1_SCOPE.
3. **Parking lot**: Document ideas in DECISIONS.md as "Post-V1" with rationale.

**Detection:** Self-monitoring; PROJECT_STATE.md drift check.

**Contingency:** Cut feature; defer to post-V1.

---

## Risk Summary Matrix

| ID | Risk | Level | Status | Owner |
|----|------|-------|--------|-------|
| RISK-001 | Unsolvable puzzles | CRITICAL | Mitigated by design | Content/Eng |
| RISK-002 | Filter logic bug | CRITICAL | Mitigated by design | Eng |
| RISK-003 | Answer leak | CRITICAL | Mitigated by architecture | Eng |
| RISK-004 | Daily date bug | HIGH | Mitigated by design | Eng |
| RISK-005 | Persistence failure | HIGH | Mitigated by design | Eng |
| RISK-006 | Card ambiguity | HIGH | Mitigated by process | Content |
| RISK-007 | Low discriminability | HIGH | Mitigated by analysis | Content/Eng |
| RISK-008 | DECEPTIVE vs IRRELEVANT confusion | HIGH | Mitigated by design | Design/Eng |
| RISK-009 | Mobile UX | MEDIUM | Mitigated by design | Eng/Design |
| RISK-010 | SW caching | MEDIUM | Mitigated by design | Eng |
| RISK-011 | Solver perf | MEDIUM | Mitigated by design | Eng |
| RISK-012 | Too hard/unfun | MEDIUM | Mitigated by playtest | Product |
| RISK-013 | Content pipeline | MEDIUM | Mitigated by tooling | Content |
| RISK-014 | Meta-patterns in curation | MEDIUM | Mitigated by process | Content/Design |
| RISK-015 | Browser compat | LOW | Mitigated by CI | Eng |
| RISK-016 | Scope creep | LOW | Mitigated by process | PM/Eng |

---

## Risk Review Cadence
- **Pre-Phase 1**: All CRITICAL/HIGH mitigations designed into architecture.
- **Pre-Phase 2 (MPC)**: RISK-001, 002, 003, 004, 005 validated by playable prototype.
- **Pre-Phase 4 (Generation)**: RISK-001, 007, 013 validated by content pipeline.
- **Pre-Launch**: Full risk register review; all CRITICAL/HIGH have test evidence.

## Product-Correction Risk Addendum (added 2025-08-29)

The V1 product is redefined as a **crime-mystery interrogation game** (see
`PRODUCT_CORRECTION_REPORT.md` and `CRIME_GAME_ARCHITECTURE_PROPOSAL.md`). The following re-scope
prior risks and add product-shaping risks.

**Re-scope of prior risks:**
- **RISK-001 (unsolvable puzzles)** and **RISK-011 (solver perf)** remain valid — retargeted from
  candidate-filter solvability to **case-graph solvability with >=2 paths**.
- **RISK-002 (candidate-filter bug)**, **RISK-007 (pool similarity)**, **RISK-008 (DECEPTIVE vs
  IRRELEVANT confusion)** are **MOOT** — the candidate-filter, demographic-predicate, and
  predicate-IRRELEVANT mechanics are removed under the corrected model.
- **RISK-003 (answer-key leak)** remains valid — retargeted to canonical-truth-in-lazy-case-chunk
  (INV-001, Category B).

### PR-001: Unsolvable or Single-Path Case
**Level:** CRITICAL
**Category:** Game Design / Content
**Description:** A case cannot be solved within budget, or only one forced question order works.
**Impact:** Player wastes time; daily ritual broken; trust lost.
**Root Causes:** Naive case authoring; contradiction graph too sparse; key evidence unreachable.
**Mitigation:** Retargeted solver proves >=2 independent paths + key-evidence reachability; human
entertainment gate (directive section 36C); ship hand-authored seed cases first.
**Detection:** npm run validate:cases (solver gate) in CI.
**Contingency:** Reject case; author additional path.

### PR-002: Content Pipeline Immaturity
**Level:** CRITICAL
**Category:** Operations / Content
**Description:** The LLM generation + novelty + validation + solver pipeline is not yet built; scaling
content depends on it.
**Impact:** Cannot reach 366 daily cases; V1 stuck at seed count.
**Root Causes:** Generation infra deferred to Phase 3; provider not locked.
**Mitigation:** Ship 2-3 hand-authored seed cases behind CaseGenerator (DEC-021); pipeline built
Phase 3; no provider locked in V1 (directive section 25).
**Detection:** Content velocity tracking.
**Contingency:** Stay at seed cases; daily rotation cycles seed set.

### PR-003: "Liar = Culprit" Shortcut
**Level:** HIGH
**Category:** Game Design
**Description:** If every liar is the culprit, players use "who lied -> guilty" and skip deduction.
**Impact:** Rich mystery collapses to a label; replayability dies.
**Root Causes:** No innocent liar authored; solver doesn't guard guilt inference.
**Mitigation:** Require >=1 innocent liar per case; solver guards that no single lie implies culprit
(INV-109).
**Detection:** Solver guard; unit per case.
**Contingency:** Add innocent liar; re-validate.

### PR-004: Deception Disclosed Accidentally
**Level:** HIGH
**Category:** UX / Game Design
**Description:** A UI bug or leftover label reveals truth state (TRUE/FALSE/DECEPTIVE) during play.
**Impact:** Deduction puzzle destroyed; the exact failure of the prior prototype.
**Root Causes:** Badge rendering from internal state; leftover "Lies revealed" stat.
**Mitigation:** INV-107 invariant + UI audit that no truth-state string renders in interrogation view;
reveal only.
**Detection:** Invariant test + manual playtest.
**Contingency:** Remove label; hide internal state.

### PR-005: External-Knowledge Dependency
**Level:** HIGH
**Category:** Game Design / Fairness
**Description:** A case requires trivia the game never provides to solve.
**Impact:** Unfair; non-deduction; alienates players.
**Root Causes:** Author assumes player knows real-world facts.
**Mitigation:** INV-106; every needed fact exists as statement/clue/evidence in the case; solver +
entertainment gate confirm self-contained.
**Detection:** Solver + human gate.
**Contingency:** Reject case; add in-game fact.

### PR-006: Scope Creep During Correction
**Level:** MEDIUM
**Category:** Process
**Description:** Building evidence-board drag UI, pressure timers, or the live generation service
prematurely.
**Impact:** Delay; complexity; bugs.
**Root Causes:** Enthusiasm for "rich" features.
**Mitigation:** Explicit V1 cutline (architecture proposal section 17): auto Notebook, no timer,
schema+hooks only for novelty.
**Detection:** PROJECT_STATE drift check.
**Contingency:** Cut feature; defer to post-V1.

### PR-007: Preservation Bias (old model leaks)
**Level:** MEDIUM
**Category:** Engineering
**Description:** Reusing candidateFilter / predicate thinking leaks the rejected identifier model.
**Impact:** Architecture drifts back toward filtering.
**Root Causes:** Familiar code; partial reuse.
**Mitigation:** Delete candidateFilter.ts, cardResolver.resolveCard, person pool; do not port logic
(PRODUCT_CORRECTION_REPORT.md section 7).
**Detection:** Code review; grep for candidate elimination.
**Contingency:** Remove leaking code.

### PR-008: Mobile Case Board Overflow
**Level:** MEDIUM
**Category:** UX / Platform
**Description:** Statements/Notebook overflow or tap targets too small at 320-375px.
**Impact:** Mobile players (majority) frustrated.
**Root Causes:** Desktop-first layout; long transcripts.
**Mitigation:** Mobile-first CSS; fluid grids; collapsible Notebook; >=44px targets.
**Detection:** Lighthouse mobile + device test.
**Contingency:** CSS hotfix.

### PR-009: Authoring Voice Variability
**Level:** LOW
**Category:** Content
**Description:** Inconsistent character voices reduce immersion.
**Impact:** Less compelling; weaker "wait" moments.
**Root Causes:** Variable authoring quality.
**Mitigation:** personality field + review checklist + entertainment gate.
**Detection:** Playtest.
**Contingency:** Rewrite dialogue.

### Updated Risk Summary Matrix (additions)

| ID | Risk | Level | Status |
|----|------|-------|--------|
| PR-001 | Unsolvable / single-path case | CRITICAL | Mitigated by retargeted solver |
| PR-002 | Content pipeline immaturity | CRITICAL | Mitigated by seed cases |
| PR-003 | "Liar = culprit" shortcut | HIGH | Mitigated by innocent-liar guard |
| PR-004 | Deception disclosed accidentally | HIGH | Mitigated by INV-107 |
| PR-005 | External-knowledge dependency | HIGH | Mitigated by INV-106 |
| PR-006 | Scope creep during correction | MEDIUM | Mitigated by V1 cutline |
| PR-007 | Preservation bias (old model) | MEDIUM | Mitigated by module deletion |
| PR-008 | Mobile Case Board overflow | MEDIUM | Mitigated by mobile-first CSS |
| PR-009 | Authoring voice variability | LOW | Mitigated by review |
---

## Variability Risk Addendum (added 2025-08-29, Mechanics Lock)

New risks from the response-variability model (RESPONSE_VARIABILITY_MODEL.md). Prior product-correction
risks PR-001..PR-009 remain.

### PR-010: Worst-Case Variant Selection Makes Case Unsolvable
**Level:** CRITICAL
**Category:** Game Design / Content
**Description:** Although each variant alone is fair, a particular *combination* of low-cooperation
variants across questions yields a transcript from which the truth is unreachable.
**Impact:** Player gets an unlucky, unsolvable run — the exact failure the directive forbids.
**Root Causes:** Variant sets authored without checking cross-question combination; redundancy gaps.
**Mitigation:** INV-114 (Redundant Critical Facts) + solver simulates the **minimum-disclosure**
variant per question and requires >=2 surviving paths; validator rejects any case failing this.
**Detection:** `npm run validate:cases` (solver gate) at build.
**Contingency:** Reject case; add a redundant route or raise a withholding variant's disclosure.

### PR-011: Refresh-Reroll Exploit
**Level:** HIGH
**Category:** Fairness / Exploit
**Description:** A player refreshes to get a different (more helpful) response variant.
**Impact:** Players can "fish" for the truth-bearing variant, destroying deduction.
**Root Causes:** Seed derived from clock/`Math.random` at play time instead of persisted `sessionSeed`.
**Mitigation:** INV-113 — `sessionSeed` persisted in `PlayerState`, not derived at runtime; only a
deliberate restart changes it.
**Detection:** Unit test: reload mid-case -> identical transcripts.
**Contingency:** Re-derive seed from persisted state; reject any runtime entropy in selection.

### PR-012: Variant Wording Leaks Truth State
**Level:** MEDIUM
**Category:** UX / Fairness
**Description:** An evasive/deflecting variant is worded so transparently that the player infers the lie
without earning it.
**Impact:** Undermines deduction (a soft version of the old "labelled deception" failure).
**Root Causes:** Authoring variant text with obvious tells; inconsistent voice.
**Mitigation:** INV-107 (no labels) + authoring checklist requiring evasions to read as plausible;
entertainment gate reviews variant voice; variant text reviewed for "tell" leakage.
**Detection:** Playtest; manual review of variant wording.
**Contingency:** Rewrite variant dialogue.

### Updated Risk Summary Matrix (additions)

| ID | Risk | Level | Status |
|----|------|-------|--------|
| PR-010 | Worst-case variant combo unsolvable | CRITICAL | Mitigated by INV-114 + solver |
| PR-011 | Refresh-reroll exploit | HIGH | Mitigated by INV-113 |
| PR-012 | Variant wording leaks truth | MEDIUM | Mitigated by INV-107 + review |

---

## Mechanics-Lock / Design-Validation Risk Addendum

New risks from the deeper gameplay specification (INTERROGATION_SYSTEM, INFORMATION_ARCHITECTURE,
ACTION_ECONOMY_PROPOSAL, CASE_NOVELTY_SYSTEM, CASE_GENERATION_PIPELINE). Prior risks PR-001..PR-012
remain.

### PR-013: Question-Volume Overload (Flat Deck)
**Level:** MEDIUM
**Category:** UX / Game Design
**Description:** If the visible question set is not gated by unlocks, the player sees 25–45 cards at
once — a flat deck that feels like the rejected trivia model.
**Impact:** Overwhelm; the investigation "evolution" beat is lost; players ask randomly.
**Root Causes:** Generator emits all cards as `initial`; UI renders them all.
**Mitigation:** Unlock philosophy (`INTERROGATION_SYSTEM.md` §2): only 4–6 cards per character visible
at start; follow-up/evidence/contradiction/confrontation unlocked by discoveries. Validator: a case with
>8 simultaneously-visible initial cards per character fails.
**Detection:** Validator; UI test on seed cases.
**Contingency:** Hide locked cards; surface via unlock events.

### PR-014: Impossible / False Contradiction
**Level:** HIGH
**Category:** Game Design
**Description:** A contradiction is surfaced that is actually the intended resolution (e.g. a Partial-
type pair the player reads as proof of lying), or two statements that are genuinely compatible are
flagged as clashing.
**Impact:** Player accuses wrongly; "liar = culprit" shortcut re-emerges.
**Root Causes:** Runtime inference of contradictions (forbidden); mis-tagged contradiction type.
**Mitigation:** INV-116 (authored-only links) + Partial type (`INFORMATION_ARCHITECTURE.md` §6) +
internal-only confidence never shown. Human gate reviews each link.
**Detection:** Validator rejects runtime-inferred contradictions; entertainment gate checks link quality.
**Contingency:** Remove/re-type the link.

### PR-015: Misleading Notebook Automation
**Level:** HIGH
**Category:** UX / Game Design
**Description:** The Notebook auto-labels guilt, ranks suspects, or declares "X is lying."
**Impact:** Destroys deduction — the exact failure of the old prototype.
**Root Causes:** Over-helpful notebook UI.
**Mitigation:** INV-107 + INV-117 (no labels, no feedback) + PART 8 good/bad examples. Notebook records
only; player interprets.
**Detection:** UI audit greps for forbidden label strings; playtest.
**Contingency:** Strip evaluative text.

### PR-016: Unfair Action Economy
**Level:** MEDIUM
**Category:** Game Design / Balance
**Description:** Budget too tight for the case's complexity (Hard case needs >20 actions), or a "free"
investigation action is accidentally gated behind the budget, causing a soft-lock.
**Impact:** Frustration; forced wrong accusation; abandoned cases.
**Root Causes:** Tier numbers mis-set; free-action list implemented incorrectly.
**Mitigation:** System D (ACTION_ECONOMY_PROPOSAL.md): budget 12/16/20 tied to tier; free actions
explicitly excluded (INV-118); accusation always available. Solver confirms ≥2 paths fit the budget.
**Detection:** Solver budget-fit check; playtest each tier.
**Contingency:** Raise tier budget; fix gating bug.

### PR-017: Overcomplicated Accusation (Exam)
**Level:** MEDIUM
**Category:** Game Design
**Description:** The final accusation becomes a 5-question multiple-choice exam, or gives Wordle-style
green/yellow correctness hints.
**Impact:** Ending feels like homework; brute-force elimination replaces deduction.
**Root Causes:** Too many required dimensions; pre-reveal feedback.
**Mitigation:** Format Y (culprit + what + motive + optional evidence, DEC-038); INV-117 (no pre-reveal
feedback); Theory Board silent until submit.
**Detection:** UI audit for feedback strings; design review of dimension count.
**Contingency:** Cut to 3 dimensions; remove hints.

### PR-018: Novelty Failure (Structurally Similar Cases Ship)
**Level:** HIGH
**Category:** Content / Retention
**Description:** Two published cases are psychologically similar (e.g. jealous-spouse reskins) despite
different nouns.
**Impact:** "Same game in different clothes" — the core retention risk.
**Root Causes:** Fingerprint too shallow; L1 not consulted; human gate skipped.
**Mitigation:** 10-dimension fingerprint + last-10 hard bans + ≥3-dimension-diff rule
(CASE_NOVELTY_SYSTEM.md); human entertainment gate as final rejector (PART 36C).
**Detection:** Novelty validator (CI); manual review of recent window.
**Contingency:** Reject + regenerate with different constraints.

### PR-019: Lie-Motivation Regression ("Liar = Culprit")
**Level:** HIGH
**Category:** Game Design
**Description:** A case ships where every liar is the culprit, or an innocent liar's lie doesn't create a
believable secondary mystery.
**Impact:** Rich mystery collapses to a label; replayability dies.
**Root Causes:** Generator omits innocent liar; lie lacks a reason.
**Mitigation:** INV-109 (≥1 innocent liar with secondary mystery) + LieMotivation taxonomy
(DEC-042/INTERROGATION_SYSTEM.md §5); solver guards guilt inference.
**Detection:** Solver guard; unit per case.
**Contingency:** Add innocent liar; re-validate.

### PR-020: Fact-Tier Misclassification
**Level:** MEDIUM
**Category:** Content / Solver
**Description:** A fact needed for the solution is tagged Tier B/C (single route) instead of Tier A, so
redundancy is never checked and a variant can block it.
**Impact:** A required fact becomes unsolvable under worst-case variants (PR-010).
**Root Causes:** Generator mis-tags; validator doesn't enforce tiers.
**Mitigation:** INV-115 — every fact tagged; Tier A must satisfy INV-114; untagged/single-route Tier A
rejected at Stage 6.
**Detection:** Validator (CI).
**Contingency:** Re-tag fact; add redundant route.

### Updated Risk Summary Matrix (additions)

| ID | Risk | Level | Status |
|----|------|-------|--------|
| PR-013 | Question-volume overload | MEDIUM | Mitigated by unlock philosophy |
| PR-014 | Impossible / false contradiction | HIGH | Mitigated by INV-116 + Partial type |
| PR-015 | Misleading notebook automation | HIGH | Mitigated by INV-107/INV-117 |
| PR-016 | Unfair action economy | MEDIUM | Mitigated by System D / INV-118 |
| PR-017 | Overcomplicated accusation (exam) | MEDIUM | Mitigated by Format Y / INV-117 |
| PR-018 | Novelty failure (similar cases) | HIGH | Mitigated by fingerprint + human gate |
| PR-019 | Lie-motivation regression | HIGH | Mitigated by INV-109 + taxonomy |
| PR-020 | Fact-tier misclassification | MEDIUM | Mitigated by INV-115 |
