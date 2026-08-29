# Project Brief: The Interrogation

> ⚠️ **PRODUCT REDEFINITION — 2025-08-29.** The V1 prototype built as a "hidden-secret identifier"
> (demographic Question Cards + auto candidate filtering) is **SUPERSEDED / REJECTED**. The canonical
> product is a **daily crime-mystery interrogation game**. See `PRODUCT_CORRECTION_REPORT.md` and
> `CRIME_GAME_ARCHITECTURE_PROPOSAL.md`.

## One-Sentence Pitch

A daily interactive crime-mystery where you interrogate a network of believable characters, uncover
lies and contradictions, construct your own understanding of events, and experience a satisfying "I
figured it out" reveal.

## Core Loop

```
OPEN DAILY CASE
        ↓
Read intriguing briefing (what happened, why strange, stakes, open question)
        ↓
Review connected characters (4–7 roster)
        ↓
Choose someone to interrogate
        ↓
Ask contextual Question Cards (timeline / relationship / evidence / motive / alibi / contradiction / pressure / follow-up)
        ↓
Receive natural dialogue (no labels, no auto-elimination)
        ↓
Discover leads → unlock follow-ups → surface possible contradictions
        ↓
Switch characters freely / revisit anyone / ask same topic to several people
        ↓
Confront liars with earned contradiction cards
        ↓
Build a theory
        ↓
Accuse: who + what + why (+ optional evidence)
        ↓
Reveal: reconstruct the complete truth
```

## Product Vision

**What the player actually does:**
- Opens the page → sees Practice mode and Today's Daily case.
- Reads a 2–6 sentence case briefing that creates immediate curiosity.
- Meets the roster; forms hypotheses about people from short visible intros + relationships.
- Selects a character → enters an interrogation screen with contextual Question Cards.
- Plays a card → the character replies with dialogue only (internally TRUE/FALSE/PARTIALLY_TRUE/
  MISLEADING/UNKNOWN/EVASIVE/CONTRADICTED, never shown as a label).
- The statement is recorded in that character's transcript and may:
  - add a **clue / lead** to the Investigation Notebook,
  - **unlock** a follow-up or confrontation card,
  - be flagged as a **possible contradiction** once two collected statements match an authored link.
- The player switches characters at any time (free), revisits anyone, asks the same topic to several
  people, and confronts liars with earned contradiction cards.
- When ready, the player submits a **structured accusation** (culprit + what happened + motive +
  optional key evidence).
- The reveal reconstructs the entire truth: timeline, lies, innocent liars, key clues, missed
  contradictions.

**Core experience pillars:**
1. **Information gathering under uncertainty** — Limited action budget forces "which lead is worth
   pursuing?" not "exhaust everything."
2. **Fair deduction** — Deception is predetermined and exposed through contradiction/evidence, never
   labelled. Solvable by logic from in-game information only.
3. **Deterministic** — Same case + same choices = same statements. No RNG at runtime.
4. **Zero friction** — No login, no accounts, instant load, works offline.
5. **Respectful** — No tracking, no ads, no dark patterns. LocalStorage only.
6. **Daily ritual** — One dated case per day. Streak counter (secondary). Spoiler-free share.

## Target Audience

Mystery / deduction enthusiasts who enjoy:
- Logic puzzles where the puzzle is a *story*, not a grid.
- "Knights and Knaves" extended into a believable cast with motives and relationships.
- Daily games like Wordle / Connections, but with deeper narrative reasoning.
- Crime thrillers, detective fiction, social-deduction games (Among Us, Town of Salem) minus the
  real-time multiplayer.

Casual players willing to spend 5–20 minutes on a satisfying mystery.

## Failure Conditions (What Makes This Fundamentally Broken)

- **Unsolvable / single-path case** — No viable deduction path, or exactly one forced question order.
- **Liar = culprit shortcut** — Guilt is implied by any single lie; innocent liars absent.
- **Deception labelled during play** — "the witness lied" badge destroys the deduction.
- **Auto-elimination** — Candidates shrink automatically; player does no reasoning (SUPERSEDED model).
- **External-knowledge required** — Case needs trivia the game never provides.
- **Runtime LLM** — Answers decided live by an LLM; non-deterministic; offline broken.
- **False contradiction** — Engine declares a contradiction between two compatible TRUE statements.
- **Answer key exposed** — Canonical truth visible in client bundle before reveal.
- **Progress lost** — Refresh/close loses state or streak.
- **Daily case not daily** — Same case repeats or date logic broken across timezones.
- **Mobile unusable** — Cards/Notebook overflow, tap targets too small, keyboard overlap.
- **Click-everything wins** — Unlimited questions make strategy irrelevant (mitigated by budget).

## Success Criteria (V1)

- Case loads and interactive in <500ms on 3G (static files, no API calls).
- 80%+ of Practice players who start complete at least one case.
- Daily retention: 40%+ of Daily players return next day (7-day window).
- Zero data loss on refresh/close/reopen (LocalStorage persistence verified).
- Works on iOS Safari, Chrome Android, Firefox, desktop browsers.
- Automated solver validates 100% of shipped cases as solvable with ≥2 paths.
- No canonical-truth data in initial production bundle (verified by build audit; lazy case chunk only).
- Lighthouse: Performance ≥90, Accessibility ≥95, Best Practices ≥90.
- **Contradiction moments present** — 90%+ of playtesters report at least one "wait…" realization.
- **Strategic depth verified** — Players express meaningful choice in which leads to pursue, not an
  obvious optimal path.
- **Deception undetected by label** — Playtest confirms players do not see lie/truth classification
  during interrogation.
