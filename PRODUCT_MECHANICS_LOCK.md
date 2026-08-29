# Product Mechanics Lock — The Interrogation

**Status:** PRODUCT MECHANICS LOCK (design only). No implementation. No Phase 2 rebuild.
**Companion to:** `RESPONSE_VARIABILITY_MODEL.md`, `GAMEPLAY_SIMULATION.md`.
**Authority:** User directive "PRODUCT MECHANICS LOCK — DO NOT START PHASE 2 REBUILD YET."

Every mechanic below is tagged:
- **APPROVED FROM USER DIRECTIVE** — explicitly established by the user's instructions; no further approval needed to adopt.
- **RECOMMENDED — AWAITING APPROVAL** — my proposal where the directive asked for investigation/recommendation.
- **DEFERRED** — explicitly postponed.
- **REJECTED** — considered and rejected.

---

## 1. Mechanics directly established by the user (LOCKED)

| # | Mechanic | Tag |
|---|---------|-----|
| M1 | The daily crime is **global/shared**; every player investigates the same case, cast, timeline, culprit. | **APPROVED FROM USER DIRECTIVE** |
| M2 | A character's **response can vary per player**, drawn from a pre-generated set. | **APPROVED FROM USER DIRECTIVE** |
| M3 | **Canonical truth never changes** across players or variants (crime, culprit, timeline, evidence, relationships fixed). | **APPROVED FROM USER DIRECTIVE** |
| M4 | All response variants are **generated before publication**; runtime only selects. | **APPROVED FROM USER DIRECTIVE** |
| M5 | Runtime selection is **deterministic per player/session**, NOT true randomness, NOT an LLM. | **APPROVED FROM USER DIRECTIVE** |
| M6 | **Redundancy:** critical facts are discoverable through multiple routes; no single answer can make a case unsolvable. | **APPROVED FROM USER DIRECTIVE** |
| M7 | **Lies are uncommon** and each lie has a reason (secret/fear/loyalty), not RNG. | **APPROVED FROM USER DIRECTIVE** |
| M8 | **Six-class question taxonomy:** opening, follow-up, evidence, contradiction, repeat-topic, pressure/confrontation. | **APPROVED FROM USER DIRECTIVE** |
| M9 | **Characters are actual characters** (name, role, relationship network, personality, public story, private knowledge, secrets, fears, loyalties, possible motives, pressure points, knowledge boundaries, truthfulness tendencies, conversational style). Not rows of facts. | **APPROVED FROM USER DIRECTIVE** |
| M10 | **Investigation Notebook** sections: People, Statements, Timeline, Evidence, Leads, Contradictions — records info, never declares "X is lying." | **APPROVED FROM USER DIRECTIVE** |
| M11 | **Response types invisible to players** (no TRUE/FALSE/DECEPTIVE/EVASIVE badges during play). | **APPROVED FROM USER DIRECTIVE** |
| M12 | **Confrontation** is unlocked only after earned information (contradiction/evidence); changes the character's subsequent answers via a context switch. | **APPROVED FROM USER DIRECTIVE** |
| M13 | **Case variety is first-class**; Historical Case Memory prevents structural repetition via fingerprints. | **APPROVED FROM USER DIRECTIVE** |
| M14 | **LLM is a CASE AUTHOR only** (dev-time); 12–16 stage pipeline; multi-call preferred but cost-assessed; final case is self-contained JSON. | **APPROVED FROM USER DIRECTIVE** |
| M15 | **Free/provider-agnostic LLM constraint:** no provider locked; tolerate rate limits, failures, malformed JSON; live game independent of any LLM. | **APPROVED FROM USER DIRECTIVE** |
| M16 | **Free movement:** switching characters and opening the Notebook cost no action. | **APPROVED FROM USER DIRECTIVE** (also DEC-022) |
| M17 | **Accusation is more than picking a name** (structured). Exact dimensions: *investigate, do not lock yet* — see §4. | **APPROVED FROM USER DIRECTIVE** (task) |

---

## 2. My proposed mechanics (RECOMMENDED — AWAITING APPROVAL)

| # | Proposal | Why | Gameplay impact | Complexity | Approval |
|---|---------|-----|-----------------|------------|----------|
| P1 | **Hash-seeded weighted variant selection** (RESPONSE_VARIABILITY_MODEL §4). | Deterministic, no runtime RNG/LLM, stable across refresh. | Fair, reproducible, no reroll exploit. | Low. | **AWAITING** |
| P2 | **Context-switch answer model** (`initial` / `after_contradiction_*` / `after_clue_*`) for post-confrontation changes. | Implements M12 without a reroll; deterministic because context is in the seed. | Confrontation feels powerful; answers evolve. | Low-Med. | **AWAITING** |
| P3 | **INVARIANT F (Redundant Critical Facts)** as a build-gate + solver input. | Precise, testable form of M6. | Guarantees no unfair block. | Med. | **AWAITING** |
| P4 | **Variant/context schema extension** (RESPONSE_VARIABILITY_MODEL §5). | Implements M2/M4/M5 cleanly. | Enables the whole variability system. | Med. | **AWAITING** |
| P5 | **Scaled action budget** (Easy ~14 / Medium ~16 / Hard ~18 actions; switching + Notebook free; accusation = 0 or 1 action). Refinement of DEC-022's flat ~12. | 12 is tight given revisit/confront needs; 5–20 min target needs headroom. | Strategic tension without frustration. | Low. | **AWAITING** |
| P6 | **Accusation format: culprit + what-happened + motive (+ optional key-evidence)**, graded partial credit. | Rewards understanding; "what" = reconstruction, not just naming. | Climax feels earned, not a quiz. | Low-Med. | **AWAITING** |
| P7 | **Entertainment loop** built on: opening curiosity → contradiction satisfaction → theory formation → reveal payoff → daily novelty. (See §3.) | Honest retention model, not "daily content = retention" circularity. | Returns driven by mystery quality. | N/A (design). | **AWAITING** |
| P8 | **Multi-call generation** with a single strict schema + validator, balancing cost (free-tier) via retry/queue. | Directive §14 prefers specialized calls; §33 constrains cost. | Higher case quality; bounded cost. | Med-High. | **AWAITING** |

---

## 3. Entertainment / retention loop (honest analysis) — RECOMMENDED

The directive rightly rejects "daily content creates retention" as circular. The actual psychological
hooks, in priority order:

1. **Open-loop curiosity** — the briefing poses an unanswered "what actually happened?" (M1 + strong hook).
2. **Agency & progression** — discoveries *unlock* new questions (M8 follow-up/evidence/contradiction); the player feels the case opening up.
3. **Contradiction satisfaction** — the "wait, that doesn't match" moment is the core reward (M12).
4. **Theory formation** — the Notebook lets the player *construct* an explanation, not receive one.
5. **Reveal payoff** — reconstructing the truth ("ohh, *that's* why") is the climax (M12 reveal).
6. **Daily novelty** — a genuinely different structure tomorrow (M13), not a reskinned jealous-spouse.
7. **Competence growth** — getting better at spotting evasion/contradiction across days.
8. **Shareable outcome** — spoiler-free result to compare (DEC-009).

A streak is **secondary** decoration (DEC-007/INV-010), not the retention engine. This aligns with the
user's explicit instruction.

---

## 4. Accusation format (investigation, not locked yet)

The user said: *do not lock the three dimensions yet; simulate formats and recommend.* I simulated three
in the architecture proposal and the gameplay case:

- **Format X — single "who did it?":** rejected (too shallow; the rejected model).
- **Format Y — culprit + what + motive (+ optional evidence):** **RECOMMENDED (P6).** "What happened" is
  a reconstruction choice (e.g., "drugged-and-framed" vs "stole-outright"), which separates players who
  *named* the culprit from those who *understood* the method. Partial credit is gradable (FR-013/014).
- **Format Z — culprit + what + motive + how + evidence (5 decisions):** richer but risks a "multiple-
  choice exam" if pools are large. **Defer the 5th dimension** unless a case genuinely needs it; cap at
  3–4 decisions with per-case-sized pools.

**Recommendation:** adopt Format Y as the V1 standard; treat Format Z's extra dimensions as per-case
optional (already supported by `answerDimensions` in the architecture proposal §9). Awaiting approval of
P6.

---

## 5. Action economy (review of the ~12 proposal) — RECOMMENDED P5

The directive asks to *review*, not keep, the ~12-action budget. Reasoning:
- A question is seconds; but a real case needs: meet 3–7 characters, ask opening questions, follow 2–3
  leads, confront 1–2 times, and still have room to recover from one wasted question.
- 12 risks forcing the player to *not* revisit or confront — which kills the core loop (M12).
- **Recommendation (P5):** scale by difficulty — **Easy ≈14, Medium ≈16, Hard ≈18** meaningful actions
  (question/follow-up/evidence/confrontation each = 1; switching + Notebook + accusation = free or 1).
  This preserves "you can't ask everything" tension while allowing the investigation to *evolve*.
- This **refines DEC-022** (currently APPROVED at ~12). DEC-022 remains valid in spirit; the number is a
  tuning parameter, not a product pillar, so adjusting it does not require re-opening the product
  decision — but I flag it for approval since the user explicitly asked to review it.

---

## 6. Generation pipeline (12 stages) — APPROVED FROM USER DIRECTIVE, with cost note

1. Historical novelty analysis → 2. Case blueprint → 3. Canonical truth → 4. Character construction →
5. Relationship/timeline → 6. Question & response generation → 7. Contradiction/discovery graph →
8. **Multiple response variant generation** (new, required by M2/M4) → 9. Structural validation →
10. Solver simulations (≥2 paths, INVARIANT F) → 11. Quality scoring (entertainment gate) →
12. Publish or reject (bounded retries).

**Cost assessment (P8):** multi-call generation improves quality but multiplies LLM calls. Mitigation:
single strict schema + validator; retry/queue; free/near-free tier (DEC-021, directive §33); generation
is asynchronous and offline from live play. No provider locked.

---

## 7. Deferred & rejected

| Item | Status | Reason |
|------|--------|--------|
| Pressure / timer meter | **DEFERRED** (DEC-025) | Directive §14/17: don't add unless it improves the prototype. Budget already creates tension. |
| Live novelty generation service | **DEFERRED** (DEC-024) | Schema + hooks now; populate on generation later. |
| Runtime randomness for responses | **REJECTED** | Violates M5; makes cases unfair/unlucky. |
| Single "pick the suspect" accusation | **REJECTED** | Too shallow (rejected model). |
| Auto candidate elimination | **REJECTED** (DEC-019) | Turns investigation into filtering. |
| Player-visible truth labels | **REJECTED** (DEC-016/INV-107) | Destroys deduction. |
| Generic global question library | **REJECTED** (DEC-001/DEC-003) | The rejected "disguised trivia" model. |

---

## 8. Relationship to prior decisions

- **APPROVED & unchanged:** DEC-001 (cards), DEC-003 (curation), DEC-006 (no runtime LLM), DEC-007
  (client-only), DEC-008 (solver gate), DEC-009 (spoiler-free share), DEC-011/012 (tech), DEC-015
  (crime product), DEC-016 (7 internal states), DEC-017 (no deception label), DEC-018 (knowledge
  boundary), DEC-019 (no auto-elimination), DEC-020 (human-characters scope), DEC-021 (seed cases),
  DEC-024 (novelty schema), DEC-025 (defer timer).
- **Refined (awaiting approval):** DEC-022 (budget number → P5), DEC-023 (accusation dims → P6).
- **Still PENDING:** DEC-026 (witness personality meaningful vs decoration).
- **Newly proposed:** P1–P8 above; INV-113/INV-114.
- See `DECISIONS.md` addendum for the explicit DEC-020..026 review and new DEC-027.. entries.
