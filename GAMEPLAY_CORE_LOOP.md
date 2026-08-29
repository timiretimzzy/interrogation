# Gameplay Core Loop — The Interrogation

**Status:** PRODUCT MECHANICS LOCK (design only). No implementation.
**Companion to:** `INTERROGATION_SYSTEM.md`, `INFORMATION_ARCHITECTURE.md`, `CASE_NOVELTY_SYSTEM.md`,
`GAMEPLAY_SIMULATIONS.md`.
**Authority:** User directive "PRODUCT DECISION RESPONSE — APPROVALS, CORRECTIONS, AND NEXT DESIGN GATE"
(PART 14 emotional loop; PART 1–5 mechanics; PART 9–10 session/complexity).

This document defines the *moment-to-moment* player experience. It is deliberately free of schema
detail — schemas live in `INTERROGATION_SYSTEM.md` / `INFORMATION_ARCHITECTURE.md`. Here we ask only:
**what does the player feel, do, and decide, and does each beat increase the emotional intensity of the
game?**

---

## 1. What makes this game fun (honest analysis)

The directive demands an honest answer, not "players ask questions." The emotional core is a **loop of
rising tension followed by a release of understanding**. The game is fun when it repeatedly produces
this sequence:

```
CURIOSITY      "Something happened. I don't know what."        (from the briefing)
   ↓
SUSPICION     "That answer didn't sound right."               (tone / omission / gap)
   ↓
DISCOVERY     "Wait — Character B said something different."   (a possible contradiction found)
   ↓
CONNECTION    "These two facts can't both be true."            (player constructs a contradiction)
   ↓
LEVERAGE      "Now I have something to challenge them with."    (a confrontation card unlocks)
   ↓
THEORY        "I think I know what happened."                  (player forms a model)
   ↓
RISK          "I'm going to accuse someone."                   (commitment)
   ↓
REVELATION    "Ohhh. *That's* what was really going on."        (the payoff)
```

### Critical evaluation of this loop

- This loop is **non-linear in practice** (the player jumps between SUSPICION → DISCOVERY → LEVERAGE →
  back to SUSPICION many times). The *engine* must support that freedom (M16: free movement).
- The **payoff only works if the player earned it.** If the game auto-solves (the rejected candidate-
  filtering model) or labels deception, the REVELATION beat is stolen. This is why INV-107 (no labels)
  and DEC-019 (no auto-elimination) are non-negotiable — they are not stylistic preferences, they are
  what makes the final beat *feel like a discovery*.
- The **strongest single beat is CONNECTION** ("these can't both be true"). Everything in the design
  should maximize the *frequency* and *clarity* of legitimate CONNECTION moments, without handing the
  player the conclusion (see `INFORMATION_ARCHITECTURE.md` §6 contradiction confidence).

### Filter applied to every proposed mechanic

> **Test:** Does this mechanic increase the frequency or intensity of CURIOSITY / SUSPICION /
> DISCOVERY / CONNECTION / LEVERAGE / THEORY / REVELATION?

Mechanics that fail this test are flagged or cut (see `PRODUCT_MECHANICS_LOCK.md` §7 and the "Recommended
Cuts" in the final report). Examples of mechanics that *fail* and are therefore rejected:
- A "timer" that just pressures the player (adds anxiety, not a curiosity/connection beat).
- A "lie detector" meter (short-circuits SUSPICION/CONNECTION; replaces deduction with a gauge).
- Auto-eliminating suspects (removes THEORY/REVELATION ownership).
- A "hint" button that directly names the discrepancy (steals the CONNECTION beat).

---

## 2. Player actions (complete inventory)

### 2.1 Interrogation actions (consume the action budget)
These are the *meaningful* commitments. See `ACTION_ECONOMY_PROPOSAL.md` for the budget model.

| Action | What it does | Emotional beat it serves |
|--------|--------------|--------------------------|
| Ask an opening question | First contact with a topic | CURIOSITY → SUSPICION |
| Ask a follow-up question | Exploit a discovered name/fact | DISCOVERY |
| Present evidence | Show a clue/object to a character | LEVERAGE |
| Confront a contradiction | Play an earned confrontation card | LEVERAGE → CONNECTION |
| Submit final theory | Formal accusation (climax) | RISK → REVELATION |

### 2.2 Free investigation actions (cost NO action)
These exist to *support thinking*, not to gate it. Blocking them would punish curiosity (violates
PART 2 requirement 3).

| Action | Emotional beat |
|--------|----------------|
| Switch character (at any time, in any order) | enables DISCOVERY across the network |
| Open / browse the Investigation Notebook | supports THEORY |
| Review timeline / evidence / contradictions | supports CONNECTION / THEORY |
| Re-read a statement | supports THEORY |
| Build / revise a private theory board (pre-submit) | supports THEORY (see §6) |

### 2.3 Deliberately excluded actions
- Random "probe" / "poke" buttons (no information value).
- "Re-ask same question hoping for a new answer" (forbidden by the leverage model — see
  `INTERROGATION_SYSTEM.md` §4; you must *earn* a new answer).
- Skip / fast-forward (would rob the pacing beats).

---

## 3. Decision points (where the player's choices matter)

A good mystery has decisions that **change what the player can later do**. The design requires at least
these decision points per case:

1. **Who to meet first.** Surfaces different initial framings (a hostile suspect vs a cooperative
   witness orient the case oppositely).
2. **Which lead to pursue when two are open.** Opportunity cost — following the red herring costs the
   chance to follow the real one within budget.
3. **When to confront.** Confronting early (before enough leverage) may yield only defensiveness;
   confronting late may be unnecessary. The *timing* is a skill.
4. **Which contradiction to surface.** Multiple possible inconsistencies exist; the player picks which
   to exploit — and some are decoys (PARTIAL contradictions, `INFORMATION_ARCHITECTURE.md` §6).
5. **When to stop investigating and accuse.** The "one more conversation" temptation (PART 1 of the
   original directive) is the core retention tension.

These five decision points are what separate the game from a linear visual novel. INV-007 (≥2 paths)
guarantees decision points 1–2 have real consequences.

---

## 4. Feedback loops

| Loop | Trigger | Feedback the player receives | Beat reinforced |
|------|---------|------------------------------|-----------------|
| Discovery → Unlock | A statement reveals a name/fact | A new question card appears (e.g. "Ask Daniel about the argument") | DISCOVERY / agency |
| Contradiction → Confront | Two statements conflict | Notebook flags "⚠ possible inconsistency"; a confrontation card unlocks | CONNECTION |
| Confront → Revision | Leverage applied | Character's later answers shift (context switch, `INTERROGATION_SYSTEM.md` §4) | LEVERAGE paid off |
| Theory → Confidence | Player assembles notebook | Nothing from the game — the player self-assesses | THEORY (internal) |

**Key design rule:** positive feedback is *informational*, never *evaluative*. The game never says
"good question" or "you're close." That preserves SUSPICION/CONNECTION ownership (INV-107).

---

## 5. Failure and recovery

- **Failure mode 1 — Wrong accusation.** The case ends; the reveal explains the truth. The player may
  retry the case the next day only if it's a practice case; daily cases are one attempt (streak is
  secondary, DEC-007). This is acceptable because INV-105/107/108 guarantee a fair, solvable case.
- **Failure mode 2 — Action budget exhausted before confidence.** The player may still submit a theory
  (accusation is free or cheap, `ACTION_ECONOMY_PROPOSAL.md`). No soft-lock (INV-009 persistence; no
  dead state where the only option is to quit).
- **Recovery:** If a player wasted early questions, the redundancy model (INV-114, Tier A facts) ensures
  they can still reach the truth via a different route. The budget is sized so 1–2 wasted questions are
  recoverable (see `CASE_SCALE_SPEC.md`).
- **No permadeath, no score惩罚 for exploration.** Free investigation actions mean curiosity is never
  punished (PART 2 requirement 3).

---

## 6. The Theory Board (pre-submit, no feedback)

Per PART 3, the player should be able to **build and revise a theory** without the game judging it.

- The Theory Board is a private scratchpad: "I believe [culprit] did [what] because [motive], using
  [method], supported by [evidence]."
- Editing it is **free** and **silent** — the game gives no correctness signal until formal submission.
- Formal submission converts the board into the **final accusation**. After that, it is locked and the
  reveal follows.
- **Why this matters:** it converts THEORY from a mental burden into an explicit, revisable object,
  without turning the ending into Wordle (no green/yellow hints). The reveal is the *first* time the
  player learns if they were right.

---

## 7. Session flow (5–20 minutes)

```
┌─ OPEN DAILY CASE ───────────────────────────────────────────────┐
│  Briefing (2–6 sentences): hook + what/where/when + tension      │  CURIOSITY
│  Roster: 5–7 character cards (name, role, 1-line intro)          │
└───────────────────────────────┬──────────────────────────────────┘
                                 ▼
┌─ INVESTIGATE (loop, 5–18 min) ──────────────────────────────────┐
│  Pick a character → see opening questions → ask (costs 1)        │  SUSPICION
│  Receive dialogue (no labels) → recorded to Notebook             │
│  Discover lead → new question unlocks (free)                     │  DISCOVERY
│  Switch characters (free) → compare testimony                    │
│  Spot possible inconsistency → "⚠" flagged (free)               │  CONNECTION
│  Earn confrontation → play it (costs 1) → answer shifts          │  LEVERAGE
│  Build/revise Theory Board (free, silent)                        │  THEORY
│  Repeat until confident or budget low                            │
└───────────────────────────────┬──────────────────────────────────┘
                                 ▼
┌─ ACCUSE (climax) ───────────────────────────────────────────────┐
│  Submit Theory Board as final accusation (free/cheap)            │  RISK
└───────────────────────────────┬──────────────────────────────────┘
                                 ▼
┌─ REVEAL (payoff) ───────────────────────────────────────────────┐
│  Reconstructs truth; explains lies, innocent liars, missed clues │  REVELATION
│  Graded score (FR-013/014) + spoiler-free share (DEC-009)        │
└──────────────────────────────────────────────────────────────────┘
```

**Complexity tiers** (PART 10) change *only* the density of leads/contradictions/red herrings, not the
shape of this loop. A 6-character case can be harder than a 10-character case if its ambiguity and
contradiction depth are higher (see `CASE_SCALE_SPEC.md`).

---

## 8. How this loop satisfies the directive's retention requirement

The loop produces a **complete emotional arc in one sitting** (CURIOSITY→REVELATION). Retention comes
from wanting *another* arc tomorrow with a *different structure* (PART 4 novelty framework) — not from
a streak. The streak is a side-effect of returning, not the cause. See `CASE_NOVELTY_SYSTEM.md` and
`PRODUCT_MECHANICS_LOCK.md` §3.

---

## 9. Decision status

| Item | Status |
|------|--------|
| Emotional loop (CURIOSITY→REVELATION) as the design test | **APPROVED FROM USER DIRECTIVE** (PART 14) |
| Separate interrogation actions (cost) vs free investigation (no cost) | **RECOMMENDED** — see `ACTION_ECONOMY_PROPOSAL.md` |
| Theory Board: build/revise freely, silent until submit | **RECOMMENDED** — see PART 3 / `PRODUCT_MECHANICS_LOCK.md` §4 |
| No evaluative feedback during play (preserves ownership) | **APPROVED FROM USER DIRECTIVE** (INV-107) |
| 5–20 min session, complexity from ambiguity not headcount | **APPROVED FROM USER DIRECTIVE** (PART 10) |
