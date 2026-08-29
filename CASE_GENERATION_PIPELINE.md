# Case Generation Pipeline — The Interrogation

**Status:** PRODUCT MECHANICS LOCK (design only). No implementation.
**Companion to:** `CASE_NOVELTY_SYSTEM.md`, `RESPONSE_VARIABILITY_MODEL.md`, `INFORMATION_ARCHITECTURE.md`.
**Authority:** User directive PART 12 (full pipeline review), PART 14 (12-stage order), PART 13 (memory),
PART 1 (variants), PART 6 (lie probability).

**Absolute constraint:** the LLM is a **CASE AUTHOR**, never a game master (DEC-006/INV-003). All output
is self-contained JSON validated before publication. The live game consumes only the final JSON; it
never calls the LLM.

---

## 1. The pipeline (16 stages)

The directive's 12-stage list is correct in spirit; we insert the variant-generation and
lie-assignment stages the variability model requires, and re-order for dependency sanity. Final order:

| # | Stage | Produces | LLM? | Validator (deterministic code)? |
|---|-------|----------|------|----------------------------------|
| 1 | **Novelty analysis** | constrained blueprint (underused dimensions) | No (reads L1) | Yes — bans check |
| 2 | **Case blueprint** | logline + category/structure/tone | Yes (cheap) | Yes — schema |
| 3 | **Canonical truth graph** | incident, culprit, motive, method, timeline, lies | Yes | Yes — internal consistency |
| 4 | **Character creation** | roster profiles (knowledge, secrets, fears) | Yes | Yes — knowledge completeness |
| 5 | **Relationship & timeline** | edges between characters + ordered events | Yes | Yes — acyclic/temporal |
| 6 | **Critical-fact graph (Tier A/B/C)** | fact tiers + routes (INVARIANCE §1) | Yes+code | Yes — INV-114 redundancy |
| 7 | **Question generation** | cards per character, unlock graph | Yes | Yes — every card has a purpose |
| 8 | **Response variant generation** | ≥2 variants per (Q×char×context) | Yes | Yes — variant schema + weights |
| 9 | **Lie-motivation assignment** | LieMotivation code per FALSE/MISLEADING variant | Yes+code | Yes — reason exists (INV-104) |
| 10 | **Contradiction generation** | ContradictionLinks (authored, typed) | Yes | Yes — links reference real statements |
| 11 | **Red-herring validation** | each misleading detail has a reason | Yes+code | Yes — reason present |
| 12 | **Structural validation** | JSON schema + referential integrity | No (code) | Yes — reject malformed |
| 13 | **Solvability simulation** | ≥2 paths under worst-case variants | No (solver) | Yes — INV-007/INV-114 |
| 14 | **Worst-case variant testing** | minimum-disclosure combo still solvable | No (solver) | Yes — PR-010 guard |
| 15 | **Novelty similarity check** | fingerprint distance vs history | No (code) | Yes — §3 bans (CASE_NOVELTY_SYSTEM) |
| 16 | **Human review queue → publish/reject** | approved case JSON | Human | Human entertainment gate (§3) |

---

## 2. Per-stage detail (input → output → failure → regeneration)

### Stage 1 — Novelty analysis
- **Input:** L1 fingerprint index (all published). **Output:** a constraint set (underused dimensions).
- **LLM:** No. **Validation:** deterministic distance check.
- **Failure:** none (always returns a constraint; if all dimensions exhausted, widen window).
- **Regenerate:** N/A. This *shapes* later stages.

### Stage 2 — Case blueprint
- **Input:** Stage 1 constraints. **Output:** 2–4 sentence logline + categorical tags.
- **LLM:** Yes (1 cheap call). **Validation:** tags match an allowed enum; logline 2–6 sentences.
- **Failure:** off-enum tags → retry (max 3). **Reject entire case?** No — retry blueprint only.

### Stage 3 — Canonical truth graph
- **Input:** blueprint. **Output:** full `truth` (culprit, motive, method, timeline, lies, secrets).
- **LLM:** Yes. **Validation:** exactly one canonical solution; no internal temporal contradiction;
  innocent-liar present where structure allows (INV-109).
- **Failure:** ambiguous/missing truth → retry. **Reject?** After 3 retries, **reject case** (don't
  ship a half-truth).

### Stage 4 — Character creation
- **Input:** truth. **Output:** roster with `knowledge` (what they know/believe/hide).
- **LLM:** Yes. **Validation:** every Tier A/B fact has a defined owner; knowledge boundaries complete
  (INV-103). **Failure:** gap → retry character. **Reject?** No.

### Stage 5 — Relationship & timeline
- **Input:** characters + truth. **Output:** relationship edges + ordered event list.
- **LLM:** Yes. **Validation:** timeline acyclic; events consistent with truth. **Failure:** retry.

### Stage 6 — Critical-fact graph
- **Input:** truth + characters. **Output:** each fact tagged Tier A/B/C with ≥2 routes for Tier A
  (INV-114 / `INFORMATION_ARCHITECTURE.md` §1).
- **LLM:** assisted by code. **Validation:** **hard gate** — any Tier A fact failing redundancy → fail.
- **Failure:** **reject case** (this is the non-negotiable fairness gate). **Regenerate:** author adds a
  redundant route.

### Stage 7 — Question generation
- **Input:** characters + facts + unlock graph. **Output:** cards with `category`, `scope`,
  `availability`, `unlocks`.
- **LLM:** Yes. **Validation:** every card reveals ≥1 fact OR earns leverage; no card is a dead end in
  all paths (INV-006). **Failure:** prune dead cards; retry.

### Stage 8 — Response variant generation
- **Input:** questions + characters + contexts. **Output:** ≥2 variants per block, tagged
  `truthState`, `cooperation`, `discloses`, `weight`.
- **LLM:** Yes. **Validation:** variant schema; weights in band (`INTERROGATION_SYSTEM.md` §4.2);
  liar variants reference a `knowledge.lies` reason. **Failure:** retry variant.

### Stage 9 — Lie-motivation assignment
- **Input:** variants. **Output:** LieMotivation code per FALSE/MISLEADING.
- **LLM+code.** **Validation:** every lie cites a code from the 9-taxonomy; innocent-liar secondary
  mystery present. **Failure:** assign/retry.

### Stage 10 — Contradiction generation
- **Input:** statements + truth. **Output:** ContradictionLinks (typed, §6.2 of IA doc).
- **LLM:** Yes. **Validation:** links reference real statement pairs; ≥1 HIGH-confidence contradiction
  per case. **Failure:** retry.

### Stage 11 — Red-herring validation
- **Input:** misleading details. **Output:** reason for each.
- **Code+LLM.** **Validation:** every red herring has an in-story justification (PART 7). **Failure:**
  reject herring.

### Stage 12 — Structural validation
- **Input:** full JSON. **Output:** pass/fail.
- **Code only.** **Validation:** schema + referential integrity (all `unlocks`/`createsContradiction`
  targets exist). **Failure:** reject.

### Stage 13 — Solvability simulation
- **Input:** JSON. **Output:** ≥2 independent solution paths ≤ budget.
- **Solver (code).** **Validation:** INV-007. **Failure:** **reject case** (PR-001 guard).

### Stage 14 — Worst-case variant testing
- **Input:** JSON. **Output:** solvable under minimum-disclosure variant combo.
- **Solver (code).** **Validation:** INV-114 / PR-010. **Failure:** **reject case**; ask generator to
  raise a withheld variant's disclosure or add a route.

### Stage 15 — Novelty similarity check
- **Input:** candidate fingerprint. **Output:** distance vs history.
- **Code.** **Validation:** §3 of `CASE_NOVELTY_SYSTEM.md`. **Failure:** **reject + regenerate** with
  different constraints (bounded retries, e.g. 5).

### Stage 16 — Human review queue
- **Input:** validated case. **Output:** publish or reject.
- **Human.** **Validation:** entertainment gate — opening curiosity, ≥2 interesting characters, ≥1
  "wait" moment, satisfying reveal, structurally different from recent (PART 36C). **Failure:** reject
  (regenerate or hand-fix).

---

## 3. Failure philosophy

- **Fairness gates (Stages 6, 13, 14) reject the whole case.** These are non-negotiable (INV-114,
  INV-007, PR-010). A "mostly solvable" case is not shippable.
- **Cosmetic/structural gates (2, 7, 8, 10, 12) retry locally** (re-call the specific stage, max 3).
- **Novelty gate (15) regenerates** with new constraints (bounded retries).
- **Human gate (16) is the final arbiter** — a case can pass A/B/C structurally but fail entertainment
  and be rejected (directive §36C).
- **Bounded regeneration:** every retry stage has a cap; exceeding it rejects rather than looping
  forever (PART 14 "never endlessly regenerate").

---

## 4. Provider-agnostic & failure-tolerant (PART 15)

- The `CaseGenerator` interface abstracts the LLM; **no provider is locked** (DEC-021/DEC-024).
- The pipeline tolerates: rate limits (retry/backoff/queue), model failures (stage-level retry),
  malformed JSON (schema validation rejects, regenerate), low-quality output (validator gates),
  unavailable free tiers (pipeline simply doesn't run; **already-published cases keep serving**).
- **Live gameplay is independent of all of this** — it only reads published JSON (INV-002/003/011).

---

## 5. Cost assessment (multi-call vs single-call)

The directive asks to assess multi-call against cost (PART 14/33). Recommendation (P8):
- **Multi-call, specialized** (Stages 2,3,4,7,8,9,10 are separate calls) yields higher quality and lets
  each stage be validated/retried independently.
- **Cost control:** generation is asynchronous and offline from play; a failed generation never blocks
  live cases. For a free/near-free tier, batch stages where quality allows (e.g. 3+4 together) and keep
  the high-stakes truth/variant stages separate. Bounded retries cap total cost.
- **Verdict:** multi-call preferred; collapse only low-risk stages to respect the free-tier constraint.

---

## 6. Decision status

| Item | Status |
|------|--------|
| 16-stage pipeline (variants + lie assignment inserted) | **APPROVED FROM USER DIRECTIVE** (PART 12/14) |
| Fairness gates reject whole case (Stages 6/13/14) | **APPROVED FROM USER DIRECTIVE** (INV-114/107/007) |
| Bounded regeneration, no endless loops | **APPROVED FROM USER DIRECTIVE** (PART 14) |
| Provider-agnostic, failure-tolerant | **APPROVED FROM USER DIRECTIVE** (PART 15) |
| Multi-call with cost-bounded batching | **RECOMMENDED** (P8, PART 14/33) |
| Human entertainment gate as final rejector | **APPROVED FROM USER DIRECTIVE** (PART 36C) |
