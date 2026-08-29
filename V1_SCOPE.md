# V1 Scope: The Interrogation (Crime-Mystery Interrogation)

> ⚠️ **PRODUCT REDEFINITION — 2025-08-29.** The V1 scope below replaces the prior "Famous People
> identifier" scope (200–500 person pool, demographic cards, real-time candidate filtering). That
> direction is **SUPERSEDED / REJECTED** — see `PRODUCT_CORRECTION_REPORT.md`.

## In Scope (V1 Must-Haves)

### Core Gameplay
- **Single-player crime-mystery interrogation** — no multiplayer, no co-op, no versus.
- **Cases, not secrets** — each V1 case is a self-contained mystery with a 4–7 character roster.
- **Question Cards** — pre-authored, case-specific, contextual interrogation options. Not free-text.
  Not generic templates. Three levels: Discovery / Follow-up / Confrontation.
- **Investigation budget**: ~12 actions (questions / follow-ups / confrontations / accusations).
  Switching characters and reviewing the Notebook are **free** (no action cost).
- **Seven internal truth states**: TRUE, FALSE, PARTIALLY_TRUE, MISLEADING, UNKNOWN, EVASIVE,
  CONTRADICTED — engine-internal only; players see dialogue.
- **Deception predetermined, never labelled** — exposed through contradictions/evidence, not badges.
- **Innocent liars** — some characters lie for reasons unrelated to the crime (INV: Unrelated Secrets).
- **Knowledge graph / Investigation Notebook** — statements, timeline, relationships, clues,
  possible contradictions. Organisational aid, **not** an auto-solver. No auto candidate elimination.
- **Dynamic unlocking** — discoveries open new questions and confrontations.
- **Structured accusation** — culprit + what happened + motive (+ optional evidence). Partial credit.
- **Reveal** — reconstructs the full truth (timeline, lies, innocent liars, missed contradictions).

### Modes
- **Practice Mode** — curated cases, unlimited replays, difficulty tiers derived from measurable
  properties (not cosmetic labels).
- **Daily Case** — one per UTC day, shared globally, streak counter (secondary retention).
- **Spoiler-free share** — emoji grid.

### Case Variety (core system requirement)
V1 must support multiple crime structures: murder, heist/theft, missing person, sabotage, fraud/con,
suspicious incident, locked-room/impossible event. Generation pipeline must deliberately vary crime
type, setting, time period, character count, relationship structures, culprit archetype, motive,
method, narrative twist, information distribution, witness reliability, obvious-suspect-innocence,
and multi-deception. Avoid overused clichés (mansions, dark alleys, jealous spouses, serial killers).

### Persistence & Offline
- **LocalStorage only** — current case, streak, practice completions, settings.
- **Service Worker** — caches assets + case data for offline play.
- **No backend, no database, no auth, no accounts**.

### Technical
- **Client-only static site** — deployable to GitHub Pages / Netlify / Vercel / Cloudflare Pages.
- **TypeScript + Preact** — no heavy runtime (STACK.md).
- **Build-time validation** — automated solver + schema/logic/contradiction/novelty validators in CI.
- **Case data as JSON** — separate from code.
- **Dev-time LLM generation behind `CaseGenerator` adapter** — no provider locked in V1 (directive §25).
- **Historical Case Memory index** — fingerprint DB powering the novelty engine (populated as cases
  are generated; schema present from V1).

## Out of Scope (V1 Explicitly Excludes)

### Gameplay Variants
- ❌ Free-text / natural language questions
- ❌ Runtime LLM-powered responses or interpretation
- ❌ Generic question templates shared across all cases (cards are case-specific)
- ❌ Auto candidate elimination / binary-search filtering (SUPERSEDED mechanic)
- ❌ Demographic "is the person male / won a Nobel Prize" cards (SUPERSEDED mechanic)
- ❌ Player-visible TRUE/FALSE/DECEPTIVE/IRRELEVANT labels during interrogation
- ❌ Known deceptive-count disclosure up front
- ❌ Hint system / "reveal one truth" / "remove a lie"
- ❌ Timed mode / speedrun leaderboard / pressure timer (deferred — D7)
- ❌ Multiplayer / pass-and-play / async challenge
- ❌ Custom puzzle creation / user-generated content

### Content
- ❌ Sexual violence, rape, graphic torture, graphic gore, crimes exploiting children (hard ban)
- ❌ Living politicians / controversial figures (curate for broad appeal)
- ❌ Cases requiring outside trivia (every case self-contained)
- ❌ Localization / non-English support (V1 English only)
- ❌ Audio / voice narration

### Social / Meta
- ❌ Accounts / login / cloud sync
- ❌ Leaderboards (global, friends, daily)
- ❌ Achievements / badges / XP / progression systems
- ❌ Social sharing beyond spoiler-free emoji grid
- ❌ Comments / discussion / community features
- ❌ Analytics / tracking / telemetry (zero — privacy pillar)

### Technical / Infrastructure
- ❌ Backend API / serverless / database at runtime
- ❌ Real-time sync / WebSockets
- ❌ A/B testing / feature flags / remote config
- ❌ Complex state management (signals sufficient)
- ❌ CSS-in-JS (vanilla CSS + custom properties)
- ❌ Test infra beyond Vitest (+ Playwright if installed; not required for V1 gate)
- ❌ Storybook / component-library docs
- ❌ Monorepo

### Generation (deferred to Phase 3)
- ❌ Live novelty generation service in V1 (schema + validation hooks only; populate later)
- ❌ Large dataset generation (2–3 hand-authored seed cases first)
- ❌ Locking a specific LLM provider in V1 (abstract behind interface)

### Accessibility (Beyond Baseline)
- ❌ High-contrast toggle (respects system `prefers-contrast`)
- ❌ Dyslexia font toggle
- ❌ Switch / voice control specific testing

### Polish (Post-V1)
- ❌ Animations beyond subtle transitions
- ❌ Sound / haptics
- ❌ Confetti
- ❌ Theming (system auto only)
- ❌ Undo last question
- ❌ Replay / review mode

## V1 Content Requirements (Minimum Viable Content)

| Asset | Minimum | Target |
|-------|---------|--------|
| Hand-authored seed cases | 2 | 3 |
| Characters per case | 4 | 5–7 |
| Total interrogation questions per case | 20 | 30–40 |
| Questions initially available per character | 6 | 8–12 |
| Questions unlocked dynamically per case | 10 | 15–20 |
| Meaningful contradictions per case | 3 | 5–8 |
| Independent secrets per case | 2 | 3–5 |
| Core evidence threads per case | 3 | 4–6 |
| Optimal solution path (questions) | 8 | 10–15 |
| Max reasonable playthrough | 20 min | — |

**Content Quality Bar:**
- Every case passes structural + logical + entertainment + novelty gates (REQUIREMENTS FR-006;
  architecture proposal §13).
- Every case solvable with ≥2 independent paths; no single lie implies guilt.
- At least one "wait…" moment; satisfying reveal; structurally distinct from recent cases.

## V1 Technical Constraints (unchanged from prior scope)

| Constraint | Limit |
|------------|-------|
| Initial JS bundle (gzipped) | ≤ 100 KB |
| Case data (gzipped, lazy per case) | ≤ 80 KB |
| Total initial transfer | ≤ 200 KB |
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 |
| Lighthouse Best Practices | ≥ 90 |
| Zero runtime dependencies | Only devDependencies |
| Browser support | Last 2 major versions each |
| No polyfills | ES2022 baseline |

## V1 Definition of Done

1. All INVARIANTS verified by automated tests + manual audit.
2. All REQUIREMENTS acceptance criteria met.
3. ≥2 seed cases validated by solver (≥2 paths each) + quality gate.
4. Game playable offline after first visit (Lighthouse PWA audit).
5. LocalStorage persistence survives close/refresh/private mode.
6. Daily case consistent across timezones (UTC date).
7. Share output verified spoiler-free.
8. No canonical-truth data in initial production bundle (build audit).
9. Deployed to staging URL, smoke-tested on mobile + desktop.
10. Human playtest: 3+ people complete a case without confusion; report ≥1 contradiction realization.

## Post-V1 Candidates (Not Committed, For Reference)

- Generation pipeline at scale (LLM + novelty + validation).
- Pressure/timer meter (if proven valuable).
- Evidence-board drag UI (if Notebook insufficient).
- Category expansion of crime types; holiday/special cases.
- Statistics dashboard (contradiction rate, avg actions, best streak).
- Native app wrapper (Capacitor/Tauri).
- Localization.
