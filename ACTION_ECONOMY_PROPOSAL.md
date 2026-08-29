# Action Economy Proposal — The Interrogation

**Status:** PRODUCT MECHANICS LOCK (design only). No implementation.
**Companion to:** `GAMEPLAY_CORE_LOOP.md`, `CASE_SCALE_SPEC.md`, `INTERROGATION_SYSTEM.md`.
**Authority:** User directive PART 2 (budget correction — NOT DEC-032 as proposed), PART 10 (session
length), PART 17 (final report).

**Context:** DEC-022 approved a flat ~12-action budget. My DEC-032 refined it to 14/16/18 by difficulty.
The user **rejected the exact DEC-032 numbers** and asked for a better system that (a) separates
*interrogation actions* (cost) from *free investigation* (no cost), (b) avoids a generic videogame
energy bar, and (c) scales with case complexity. This document compares options and recommends one.

---

## 1. Requirements the system must satisfy (PART 2)

1. Create meaningful choices.
2. Prevent exhausting every dialogue option.
3. Not punish curiosity too aggressively.
4. Support a 5–20 min session.
5. Allow recovery from a few bad questions.
6. Make efficient deduction rewarding.
7. Not feel like a generic energy bar.
8. Scale naturally with case complexity.

---

## 2. Candidate systems compared

### System A — Flat "Questions Remaining" counter
A single number (e.g. 14) decremented by every question; switching/Notebook free.
- ✅ Simple; satisfies 1,2,4,7 (no bar feel if shown as "questions used").
- ❌ Fails 5/6: a wasted early question hurts equally at the start and end; no recovery gradient.
- ❌ Fails 8: same number for a 5-char and 9-char case.
- ❌ DEC-032's 14/16/18 is a weak version of this (just three flat numbers).
- **Verdict: REJECTED as the sole model** (it is what the user declined).

### System B — "Leads" resource pool
`CASE LEADS: 16`. Ask −1, follow-up −1, present evidence −1, confront −1; switching/Notebook free.
- ✅ Satisfies 1,2,7; the word "leads" is more thematic than "energy."
- ❌ Still a single pool → fails 5/6/8 the same way as A (a confrontation costs the same as a soft
  question, so players avoid the *best* mechanic).
- ❌ Punishes the climactic confrontation (requirement 3 tension vs 6 reward conflict).
- **Verdict: REJECTED** — thematic naming does not fix the structural flaw.

### System C — Tiered action types (questions cheap, confrontation precious)
Two counters: `QUESTIONS` (generous, e.g. 18) and `CONFRONTATIONS` (scarce, e.g. 2–3). Presenting
evidence consumes a question; confronting consumes a confrontation. Switching/Notebook free.
- ✅ Satisfies 1 (when to spend a scarce confrontation = real choice), 3 (curiosity free), 5 (many
  questions to recover), 6 (efficient players save confrontations), 7 (two themed counters, not a bar).
- ❌ Fails 8 (still flat per tier); and the scarce-confrontation cap can *force* a wrong early accuse
  if mismanaged — risky for requirement 5.

### System D — Complexity-Scaled Action Budget (RECOMMENDED)
**One "actions" counter**, where an *action* = ask / follow-up / present-evidence / confront (each −1),
switching + Notebook + review are **free**, and the *starting total scales with the case's complexity
tier* (PART 10), not a fixed difficulty label.

| Complexity tier | Characters | Leads/contradictions | **Action budget** | Rationale |
|-----------------|-----------|----------------------|-------------------|-----------|
| Easy | 4–5 | 2–3 / 2 | **12** | Tight but fair; fast analytical solve ~8–10 |
| Medium | 5–6 | 3–4 / 3 | **16** | Headroom to revisit + confront once |
| Hard | 6–7 | 4–5 / 4–5 | **20** | Supports multiple red herrings + 2 confrontations |

Plus a **graded efficiency score**: solving in ≤60% of budget = "Excellent"; ≤100% = "Solved"; over
budget = forced accuse (still scored). The score rewards efficiency (req 6) without *blocking*
curiosity (req 3) — you can explore, but a lean solve scores higher.

- ✅ 1 meaningful choices (when to spend limited actions).
- ✅ 2 cannot exhaust everything (budget < total cards; INV-006/INV-007 guarantee ≥2 paths fit).
- ✅ 3 curiosity free (switch/Notebook/review cost nothing).
- ✅ 4 budget sized for 5–20 min (CASE_SCALE_SPEC §3 models this).
- ✅ 5 recovery (a 16-budget medium case tolerates 2–3 wasted questions).
- ✅ 6 efficiency score rewards lean solves.
- ✅ 7 one themed counter ("actions"), not an energy bar; shown as "used / total," never depleting
  colorfully.
- ✅ 8 scales with complexity tier, not a flat difficulty word.

**Verdict: RECOMMENDED (System D).** It is the complexity-scaled version of the user's own example in
PART 2, with the energy-bar feel removed by (a) free investigation and (b) a single neutral "actions"
counter plus an *efficiency score* instead of a draining bar.

---

## 3. Worked examples (why D beats A/B/C)

**Example 1 — Efficient analyst (Medium case, 16 actions):**
- Meet Sasha (1), ask control-room (2), unlock Julian confront. Meet Julian (3), alibi (4), motive (5),
  confront (6). Meet Okafor (7), drug (8). Meet Hale (9), receipt (10), planting (11). Accuse (free).
  **11 used → "Excellent."** Requirement 6 satisfied; requirement 2 satisfied (5 actions unspent).

**Example 2 — Curious explorer who chases a red herring:**
- Spends 4 questions on Marcus's affair (innocent lie). Still has 12 left → recovers (req 5). Reaches
  truth via the witness/evidence path. **16 used → "Solved."** Curiosity was not punished (req 3).

**Example 3 — Confrontation timing (why C's scarce counter is risky):**
- Under System C, a player who confronts at question 3 (wrong timing, only defensiveness) has wasted
  their scarce resource. Under System D, the confrontation costs 1 of 16 — recoverable, and the
  *context switch* (`INTERROGATION_SYSTEM.md` §3) still governs whether the answer is useful, so timing
  matters without a punishing cap.

---

## 4. What is explicitly FREE (never costs an action)

Switching characters · opening the Notebook · reviewing Timeline/Evidence/Contradictions · re-reading
statements · building/revising the Theory Board (`GAMEPLAY_CORE_LOOP.md` §6). This is the direct
implementation of PART 2's "free investigation actions" and requirement 3.

---

## 5. What is explicitly NOT an action economy

- **No timer / pressure meter** (DEFERRED, DEC-025). The budget creates tension; a clock would add
  anxiety, not a curiosity/connection beat (fails the `GAMEPLAY_CORE_LOOP.md` §1 filter).
- **No per-character patience meters** (would be a second energy bar; rejected).
- **No "hint" purchase.**

---

## 6. Recommendation summary

**Adopt System D (Complexity-Scaled Action Budget):** one neutral "actions" counter, free investigation,
budget scaling with complexity tier (12/16/20), and a graded efficiency score. This replaces DEC-022's
flat ~12 and supersedes my DEC-032 flat 14/16/18 (which the user declined). The exact tier numbers are
tuning parameters validated by playtest + solver (CASE_SCALE_SPEC §3), not product pillars.

---

## 7. Decision status

| Item | Status |
|------|--------|
| Separate interrogation actions (cost) vs free investigation (no cost) | **APPROVED FROM USER DIRECTIVE** (PART 2) |
| Budget scales with complexity, not flat difficulty | **RECOMMENDED** (this doc; corrects DEC-032) |
| Single neutral "actions" counter + efficiency score (no energy bar) | **RECOMMENDED** (System D) |
| Switching / Notebook / review always free | **APPROVED FROM USER DIRECTIVE** (PART 2 / DEC-022) |
| No timer / pressure meter in V1 | **DEFERRED** (DEC-025) |
| DEC-032 flat 14/16/18 | **REJECTED (superseded by System D)** |
