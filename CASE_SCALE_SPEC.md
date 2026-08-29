# Case Scale Specification — The Interrogation

**Status:** PRODUCT MECHANICS LOCK (design only). No implementation.
**Companion to:** `ACTION_ECONOMY_PROPOSAL.md`, `CASE_GENERATION_PIPELINE.md`, `INFORMATION_ARCHITECTURE.md`.
**Authority:** User directive PART 10 (session length / complexity tiers), PART 11 (V1 scale numbers).

This document recommends **realistic V1 content ranges** and a **complexity model** that drives both
difficulty and the action budget (System D in `ACTION_ECONOMY_PROPOSAL.md`).

---

## 1. Evaluating the suggested V1 numbers (PART 11)

The directive leaned toward:

```
Characters: 5–7
Initial questions: 15–25 across the cast
Unlockable questions: 10–20
Major clues: 5–10
Critical facts (Tier A): 3–6
Meaningful contradictions: 2–5
Red herrings: 1–3
Response variants per answer: 2–5
Playtime: 5–20 min
```

**Assessment:** these ranges are **sound as V1 targets** and we adopt them, with two refinements:
1. **Tier A facts should be 3–5, not up to 6** — more than 5 Tier A facts risks forcing the player to
   track too much; 3–5 is enough for a satisfying reconstruction while keeping the 5–20 min window.
2. **Initial questions 15–25 is fine, but the *visible* set must grow** — the player should never see
   all 25–45 at once (unlock philosophy, `INTERROGATION_SYSTEM.md` §2). Per-character initial visible
   set ≈ 4–6 cards.

---

## 2. Recommended V1 content budget

| Element | V1 range | Notes |
|---------|----------|-------|
| Characters (interrogatable) | 5–7 | 4 only if the case is very tight; 7 is the V1 max for the 20-min ceiling |
| Initial questions (all characters) | 18–28 | ~4–6 visible per character at start |
| Unlockable questions (follow-up/evidence/contradiction/confrontation) | 12–22 | grow the visible set as investigation proceeds |
| Major clues | 5–9 | include Tier A routes + some Tier B |
| Tier A (case-critical) facts | 3–5 | each with ≥2 independent routes (INV-114) |
| Tier B (supporting) facts | 4–8 | 1–2 routes each |
| Tier C (atmospheric) facts | unlimited | flavor; single-route OK |
| Meaningful contradictions | 2–5 | ≥1 HIGH-confidence (IA §6.2) |
| Red herrings | 1–3 | each with an in-story reason (PART 7) |
| Innocent liars | ≥1 | non-culprit who lies (INV-109) |
| Response variants per answer | 2–5 | truthful variants high weight; lie low weight |
| Playtime | 5–20 min | Easy ~5–8, Medium ~10–14, Hard ~15–20 |

**Authoring cost note (PART 11):** at the high end (7 chars × ~6 questions × ~3 variants = ~126
authored dialogue blocks per case), a single case is a meaningful content investment. For V1 with
**hand-authored seed cases (DEC-021)**, target **2–3 cases** at the Medium band; scale to LLM
generation (Phase 3) for the daily cadence. This keeps generation/validation cost bounded (PART 33).

---

## 3. Complexity tiers (PART 10 — difficulty from ambiguity, not headcount)

Difficulty must emerge from **measurable properties**, not a cosmetic label (PART 10 / original
directive §28). We define three tiers and the properties that push a case up:

| Property | Easy | Medium | Hard |
|----------|------|--------|------|
| Characters | 4–5 | 5–6 | 6–7 |
| Tier A facts | 3 | 3–4 | 4–5 |
| Contradictions | 2 | 3 | 4–5 |
| Red herrings | 1 | 1–2 | 2–3 |
| Independent secrets | 1–2 | 2–3 | 3–5 |
| Deceptive statements | 1–2 | 2–3 | 3–4 |
| Ambiguity of early evidence | Low | Medium | High |
| Required evidence connections | 1–2 | 2–3 | 3 |
| Viable solution paths | ≥2 | ≥2 | ≥3 |
| **Action budget (System D)** | **12** | **16** | **20** |

**Key principle (PART 10):** a 6-character Hard case is not hard because of headcount — it is hard
because of **ambiguity, competing theories, contradiction depth, red herrings, and hidden relationships**.
A 6-character case with one obvious culprit and no red herrings is *easier* than a 5-character case with
two plausible culprits and an innocent liar. The generator/solver must compute the tier from these
properties, **not** instruct the LLM "make this hard" (original directive §28).

---

## 4. Session-length model (PART 10/11)

- **Minimum satisfying (≈5 min):** a fast analyst on an Easy case reaches the accusation in ~8–10
  actions. The game must *allow* this — do not pad with mandatory filler questions.
- **Typical (10–15 min):** Medium case, normal exploration (CASE_SCALE §2 ranges).
- **Deep (≤20 min):** Hard case with red herrings; the player takes the "one more conversation" path
  (original directive §3 retention tension). The 20-action budget bounds this; beyond it, the player
  must accuse (accusation is free/cheap, `ACTION_ECONOMY_PROPOSAL.md` §4).

**Hard cap:** no V1 case should require >20 minutes. If solver simulation shows a *minimum* viable path
exceeding 20 min of reading/deciding, the case is too dense → reject at Stage 13
(`CASE_GENERATION_PIPELINE.md`).

---

## 5. Reuse of ranges across cases (novelty interaction)

The `CASE_NOVELTY_SYSTEM.md` fingerprint includes `complexity_tier`. The novelty scorer should avoid
publishing two Hard cases back-to-back any more than two `locked_room` cases — variety includes
*difficulty cadence*, not just structure.

---

## 6. Decision status

| Item | Status |
|------|--------|
| Adopt PART 11 V1 ranges (with Tier A capped at 5) | **RECOMMENDED** (PART 11) |
| Visible question set grows via unlocks (never all at once) | **APPROVED FROM USER DIRECTIVE** (PART 5B) |
| Complexity from ambiguity not headcount | **APPROVED FROM USER DIRECTIVE** (PART 10) |
| 3 tiers with property-based computation | **RECOMMENDED** |
| Action budget 12/16/20 tied to tier (System D) | **RECOMMENDED** (supersedes DEC-032) |
| 2–3 hand-authored Medium seed cases for V1 | **APPROVED FROM USER DIRECTIVE** (DEC-021) |
| 20-minute hard cap enforced by solver | **RECOMMENDED** |
