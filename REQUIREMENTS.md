# Requirements: The Interrogation (V1 — Crime-Mystery Interrogation)

> ⚠️ **PRODUCT REDEFINITION — 2025-08-29.** FR-001..FR-005, DR-001..DR-004 of the prior "hidden-secret
> identifier" spec are **superseded** (see `PRODUCT_CORRECTION_REPORT.md`). This document is rewritten
> for the canonical crime-mystery interrogation product. Superseded requirement IDs are marked
> `(SUPERSEDED)`.

## Functional Requirements

### FR-001: Case Data Model (SUPERSEDES old FR-001 secret fact-sheet)
- Each case defines a **self-contained crime mystery** with a unique `id` (daily cases use a
  date-derived id).
- A case contains: `briefing`, `roster` (4–7 `Character`s), `truth` (canonical solution), `questions`
  (interrogation cards), `contradictions`, `clues`, `leads`, `evidence`, `answerDimensions`,
  `interrogationBudget`, `solutionPaths`, `redHerrings`, `reveal`.
- The canonical `truth` is fixed before gameplay and never shown to the player (INV: Canonical Truth;
  INV-001 secrecy, retargeted).
- Cases are **deterministic, authored (or dev-time LLM-authored) static data** — no runtime generation.

### FR-002: Interrogation Question System (SUPERSEDES old FR-002 demographic predicates)
- Questions are **Question Cards** — pre-authored, case-specific, not free-text and not generic
  templates (DEC-001).
- A card targets a character (or role) and resolves to exactly one **statement** (natural dialogue)
  per `(character × discoveredContext)`.
- Cards are categorised: `timeline`, `relationship`, `alibi`, `evidence`, `knowledge`, `pressure`,
  `contradiction`, `followup`.
- Three levels: **Discovery** (initial), **Follow-up** (unlocked by discovered info), **Confrontation**
  (unlocked by contradiction/evidence).

### FR-003: Answer / Truth States (SUPERSEDES old FR-003 player-visible outcomes)
- Every statement has an **internal** truth state: `TRUE`, `FALSE`, `PARTIALLY_TRUE`, `MISLEADING`,
  `UNKNOWN`, `EVASIVE`, `CONTRADICTED`.
- These states are **engine-internal only** and never displayed to the player during interrogation
  (INV: Deception Is Not Labelled).
- `FALSE` = the character is honest but mistaken/misinformed (not necessarily "they lied").
- `DECEPTIVE` (intentional lie) is **never labelled**; it is exposed through contradictions/evidence.
- `UNKNOWN` (genuinely doesn't know) and `EVASIVE` (avoids) replace the old IRRELEVANT-as-schema
  concept with a knowledge-boundary model (INV: Character Knowledge Boundaries).
- Determination is deterministic: same case + same card + same context = same statement (INV-002).

### FR-004: Deception Design (SUPERSEDES old FR-004 known-count disclosure)
- Deceptive statements are **predetermined** in case data.
- The player is **not** told the total deceptive count up front and is **not** shown per-statement lie
  labels (DEC-SUP-004 / DEC-SUP-014).
- Deception is discovered through contradictions, evidence, and confrontations the player earns.
- At least some lies may be **unrelated to the central crime** (innocent liar) where appropriate
  (INV: Unrelated Secrets).

### FR-005: Knowledge Graph & Investigation Notebook (SUPERSEDES old FR-005 candidate filtering)
- The game **does not auto-eliminate** suspects. The player reasons.
- The Investigation Notebook automatically records: statements per character, timeline facts,
  relationships, clues/leads, and **possible contradictions** (ambiguous, never "X is lying").
- Discoveries unlock new questions and contradictions; the system is an organisational aid, not an
  auto-solver.

### FR-006: Solvability Validation (RETAINED, retargeted)
- Automated solver runs at build time for every case.
- Verifies: the correct accusation is reachable; **≥2 independent solution paths** exist
  (INV: Multiple Solution Paths); key evidence is accessible within budget; the solution cannot be
  trivially guessed from one answer; **guilt is not implied by any single lie** (innocent-liar guard).
- Cases failing validation are **rejected from build**.
- Solver algorithm: search/simulation over question sequences against the statement/evidence graph.

### FR-007: Practice Mode (RETAINED)
- Unlimited plays from curated case set.
- Progress tracked: completed cases, actions used, contradictions found, accuracy of accusation.

### FR-008: Daily Case (RETAINED)
- One case per calendar day (UTC date), same for all players.
- Streak counter: consecutive days with completed daily case (secondary retention; primary is novelty).
- Shareable result: spoiler-free (FR-015 / INV-015).

### FR-009: State Persistence (RETAINED)
- LocalStorage only. Persists: current case state (interrogations, discovered clues, unlocked
  questions, flagged contradictions, accusation), daily streak, last daily date, practice completions.
- Survives browser close, refresh, offline. No PII.

### FR-010: Reveal Screen (RETAINED, re-expressed)
- On win/loss: reconstruct the complete truth — timeline, culprit, what happened, motive, which
  characters lied and why (including innocent liars), which clues mattered, which contradictions could
  have exposed the truth, what the player missed.

### FR-011: Offline Support (RETAINED)
- Service worker caches all static assets + case data. Game fully playable offline after first visit.

### FR-012: Card / Statement Presentation (RETAINED, re-expressed)
- Interrogation screen shows: current character (avatar/initials, name, role, short intro), current
  dialogue, available Question Cards.
- Investigation Notebook accessible without leaving play.
- Character switcher always visible and frictionless.
- Played cards show the statement text only (no outcome badge).

### FR-013: Structured Accusation (NEW)
- Player may accuse at any time with a structured set of decisions over `answerDimensions`:
  culprit (from roster) + what happened (explanation pool) + motive (motive pool) + optional key
  evidence (evidence pool).
- Win iff every required dimension matches `truth`. Partial matches yield a graded score (FR-014).
- A player may correctly identify the culprit but misunderstand what/motive — the result reflects that.

### FR-014: Case Outcome Scoring (NEW)
- Evaluate: correct culprit, correct method, correct motive, important contradictions discovered,
  actions used.
- Partial understanding is rewarded (e.g. "✓ culprit, ✗ motive, ✓ contradiction found").

### FR-015: Spoiler-Free Share (RETAINED, INV-015)
- Emoji summary: solved/unsolved, culprit identified, contradictions found, key connections, actions
  used, questions asked. Never reveals culprit, twist, method, or sensitive identities.

## Non-Functional Requirements (RETAINED from prior spec)

### NFR-001: Performance
- Initial load <500ms on 3G (Lighthouse Performance ≥90). Interaction latency <100ms.
- Bundle ≤100KB gzipped (excluding case data). Case data lazy-loaded per case.

### NFR-002: Reliability
- Zero runtime errors in normal play. Graceful degradation if LocalStorage unavailable.

### NFR-003: Accessibility
- Keyboard navigation; semantic HTML + ARIA; WCAG AA contrast; reduced-motion; visible focus.

### NFR-004: Browser Support
- iOS Safari 15+, Chrome Android 100+, Firefox 100+, Edge 100+, Safari 15+. No polyfills (ES2022).

### NFR-005: Security
- No secrets in client (canonical truth only in lazy case chunk). No eval. CSP
  `connect-src 'none'`. No external runtime requests.

### NFR-006: Maintainability
- TypeScript strict mode (DEC-012: `strict: true`; two extra-strict flags removed for V1).
- Case data as JSON, separated from code. Solver + validators as Node scripts, not in client bundle.
- Tests for: solver, statement resolution, knowledge-graph/unlock integrity, persistence.

## Data Requirements (NEW — SUPERSEDES old DR-001..DR-004)

> Full TypeScript interfaces live in `CRIME_GAME_ARCHITECTURE_PROPOSAL.md`. Summary of the schema:

### DR-001: Case Schema (SUPERSEDES old Person schema)
```
CaseFile { id, date?, title, genre, tone, setting, difficulty, briefing,
           roster: CharacterId[], answerDimensions: AnswerDimension[],
           truth: TruthModel, characters: Record<CharacterId, Character>,
           questions: CaseQuestion[], contradictions: ContradictionLink[],
           clues, leads, evidence, interrogationBudget, solutionPaths,
           redHerrings, reveal }
```

### DR-002: Character Schema (knowledge ≠ statements)
```
Character { id, name, role, personality, intro, relationships,
            knowledge: { trueTimeline, claimedAlibi, observations[],
                         knowledgeGaps[], mistakenBeliefs[], secrets[],
                         lies[], motives[] },
            isCulprit, alibiTrue }
```

### DR-003: Question / Statement Schema (SUPERSEDES old predicate card)
```
CaseQuestion { id, text, category, scope, availability, resolutions: Resolution[] }
Resolution   { forCharacter, requiresContext?, statement, truthState (internal),
               reveals?, unlocks?, createsContradiction? }
```

### DR-004: Contradiction / Player-State Schema
```
ContradictionLink { id, note, involves: [StatementRef, StatementRef],
                    exposedBy: QuestionId, implication }
PlayerState { caseId, interrogations, discoveredClues, leads,
              unlockedQuestions, flaggedContradictions, pressure?,
              accusation?, status }
```

## Acceptance Criteria (Definition of Done per Feature)

| Feature | Criteria |
|---------|----------|
| Interrogation | Select character → context cards → dialogue appears; no outcome label shown |
| Dynamic unlock | Discoveries unlock follow-ups/confrontations; all unlocks reachable (solver-verified) |
| Contradiction | Two collected statements matching an authored link surface "⚠ possible inconsistency"; confrontation card unlocks |
| Deception | Lies never labelled in-game; exposed only via contradiction/evidence at reveal |
| Knowledge graph | Notebook records statements/clues/contradictions; never auto-solves |
| Accusation | Structured decisions; win iff all dimensions match truth; partial credit scored |
| Practice / Daily | Unlimited practice; one dated daily; streak persists |
| Persistence | Refresh mid-case → state restored; close → streak preserved |
| Offline | After first visit, full game works offline |
| Solver | Build fails if any case unsolvable or single-path |
| Share | Spoiler-free emoji result |
| Reveal | Reconstructs truth, lies, innocent liars, missed contradictions |
