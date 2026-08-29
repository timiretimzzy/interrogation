PROJECT NAME:
The Interrogation

> ⚠️ **PRODUCT REDEFINITION — 2025-08-29.** The previously-built V1 prototype (a "identify the hidden
> historical person by asking demographic attribute questions" game) is classified as
> **SUPERSEDED / REJECTED PRODUCT DIRECTION**. The canonical product below is a **crime-mystery
> interrogation game**. See `PRODUCT_CORRECTION_REPORT.md` and `CRIME_GAME_ARCHITECTURE_PROPOSAL.md`.
> Superseded decisions are marked DEC-SUP in `DECISIONS.md`.

ONE-SENTENCE DESCRIPTION:
A daily interactive crime-mystery interrogation game where the player investigates a deliberately
constructed web of characters, motives, lies, timelines, secrets, and contradictions — switching
between suspects and witnesses, confronting them with contradictions, and submitting a structured
accusation to reconstruct what actually happened.

WHAT THE USER DOES:
The player opens a short case briefing describing a crime. They meet a roster of 4–7 connected
characters and choose whom to interrogate. They select contextual, case-specific Question Cards
(timeline, relationship, evidence, motive, alibi, contradiction, pressure, follow-up). Characters
reply with natural dialogue — no labels, no auto-elimination. Statements are recorded in an
Investigation Notebook; discoveries unlock new questions and surface possible contradictions. The
player moves freely between characters, revisits anyone, asks the same topic to several people, and
confronts liars with earned contradiction cards. When ready, they submit a structured accusation
(who is responsible + what happened + why / motive + optional key evidence) and receive a reveal that
reconstructs the whole truth.

CORE LOOP:
```
OPEN DAILY CASE
        ↓
Read intriguing briefing
        ↓
Review connected characters
        ↓
Choose someone to interrogate
        ↓
Ask strategically useful questions
        ↓
Receive answers (natural dialogue only)
        ↓
Discover leads / unlock follow-ups / surface contradictions
        ↓
Switch characters freely
        ↓
Confront people with contradictions
        ↓
Build a theory
        ↓
Accuse (culprit + what + why + evidence)
        ↓
Reveal the complete truth
        ↓
Return tomorrow for a completely different case
```

PRIMARY EXPERIENCE:
The intellectual and emotional satisfaction of pulling apart a web of stories. The "wait, that's not
what they told me" moment. The tension of deciding which inconsistency to pursue. Fair, deterministic
deduction — not a guessing game, not a chatbot, not trivia, not binary search.

WHAT MAKES THIS PROJECT DIFFERENT:
- **Interrogation, not identification** — The game is the conversation, the story, and the
  contradictions — not "filter candidates until one remains."
- **Question Cards, not free text** — Curated, contextual, character-aware interrogation options
  eliminate ambiguous interpretation and hallucinated answers (DEC-001).
- **Deterministic statement resolution** — Every (case, character, question, discovered-context)
  resolves to exactly one predetermined statement. Same inputs = same output (INV-002, re-interpreted).
- **Seven internal truth states** — TRUE / FALSE / PARTIALLY_TRUE / MISLEADING / UNKNOWN / EVASIVE /
  CONTRADICTED exist only inside the engine; the player sees dialogue, never labels.
- **Deception is never labelled** — Lies are exposed through contradictions and evidence the player
  earns, not through an on-screen "the witness lied" badge (DEC-SUP-004 / DEC-SUP-014).
- **Knowledge graph** — Discovered statements, unlocked questions, earned contradictions, and pinned
  clues organize the player's reasoning without solving it for them.
- **Solvability guaranteed by construction** — Automated solver verifies ≥2 independent deduction paths
  per case (INV-007, retargeted).
- **Zero backend, zero runtime LLM** — Client-only, offline-capable, instant load, no API costs during
  play. The LLM (if any) only authors cases at dev time (DEC-006, INV-003).

WHAT THIS PROJECT IS NOT:
- A chatbot or LLM conversation game (no runtime LLM).
- A trivia quiz requiring outside knowledge (INV: No Mandatory External Knowledge).
- A "guess the person from demographic attributes" game (SUPERSEDED — see correction report).
- A binary-search / candidate-elimination game (auto-elimination removed).
- A visual novel or AAA detective game (compact web puzzle only).
- A multiplayer or social game.

V1 PRODUCT BOUNDARY:
Single-player client-side web game. Each case is a self-contained crime mystery with a 4–7 character
roster. Question Cards are case-specific and pre-authored (or LLM-authored at dev time). Practice mode
(unlimited curated cases) + Daily case (one per day). LocalStorage persistence for streak and progress.
No accounts, no backend, no runtime LLM calls. Investigation budget ~12 actions; switching characters
and reviewing the notebook are free.
