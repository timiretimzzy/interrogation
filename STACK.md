# Technology Stack: The Interrogation (Crime-Mystery Interrogation)

## Stack Philosophy

**Minimal viable stack for a deterministic, offline-first, client-only crime-mystery interrogation game.**

Priorities: simplicity, implementation speed, zero runtime dependencies, free hosting, easy debugging,
and a build pipeline that can validate authored cases (solvability, ≥2 paths, canonical-truth secrecy).

---

## Approved Stack

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Framework** | Preact | 10.x | 3KB vs React's 40KB; same API; signals built-in; faster hydration |
| **Build Tool** | Vite | 5.x | Fast dev server; optimized production builds; native ESM; code splitting |
| **Language** | TypeScript | 5.x (strict) | Invariant enforcement via types; structured case/character schema; zero runtime cost |
| **Styling** | CSS Modules + CSS Custom Properties | Native | Zero runtime; theming via variables; scoped styles; no build step for CSS |
| **State** | @preact/signals | 1.x | Fine-grained reactivity; no Context boilerplate; 1.5KB; works with Preact |
| **Routing** | wouter | 3.x | 1.5KB; hooks-based; minimal; sufficient for a few routes (home, practice, daily, case, reveal) |
| **Testing (Unit)** | Vitest | 2.x | Fast; Vite-native; TypeScript support; works with Preact. Bumped from 1.x because Vitest 1.x is incompatible with the Node 24 runtime (tests fail to register). See DEC-011. |
| **Testing (E2E)** | Playwright | 1.x | Real browser testing; cross-browser. **NOT installed in this workspace** — see Static Quality Gates. |
| **PWA** | vite-plugin-pwa (Workbox) | 0.x | Standard; maintained; offline-first |
| **Hosting** | Cloudflare Pages | — | Free; fast edge; Functions available if needed later; Git integration |
| **Package Manager** | npm | 10.x | Standard; lockfile; workspaces if needed |

---

## Rejected Alternatives (with reasoning)

| Technology | Rejected Because |
|------------|------------------|
| React | 40KB bundle penalty for zero V1 benefit; Preact API-compatible |
| Next.js | SSR unnecessary for static case; adds complexity, bundle size, cold starts |
| Redux / Zustand | Signals + localStorage simpler for our flat state shape; no middleware needed |
| Tailwind CSS | CSS Modules + variables sufficient; no JIT build step; smaller output |
| IndexedDB wrapper (idb) | Native localStorage API simple enough for our schema; no wrapper needed |
| Custom Service Worker | Workbox handles edge cases (opaque responses, range requests, versioning) |
| Svelte / Solid | Team familiarity with React/Preact patterns; Preact is React-compatible |
| Vite PWA without Workbox | Manual SW error-prone; Workbox is battle-tested |
| GitHub Pages | Cloudflare Pages has better edge performance, Functions support, free tier |

---

## Architecture Overview (Corrected — Crime-Mystery Interrogation)

The product is **not** "narrow a list of entities." The player reads one shared case, interrogates a
roster of characters, collects statements, discovers evidence, detects *authored* contradictions,
confronts suspects, builds a private Case Theory, and accuses. The canonical truth of a case is fixed
authored data; runtime logic is a pure lookup over that data (no filtering engine, no hidden-answer
selection).

```
┌─────────────────────────────────────────────────────────────┐
│                      Vite + Preact                          │
├─────────────────────────────────────────────────────────────┤
│  Routes (wouter)                                            │
│  ├── /                    → Home (mode select)              │
│  ├── /practice           → Practice case list             │
│  ├── /daily              → Daily case (or redirect to /case) │
│  ├── /case/:caseId       → Investigation screen            │
│  └── /reveal/:caseId     → Reveal screen                   │
├─────────────────────────────────────────────────────────────┤
│  State (@preact/signals)                                    │
│  ├── caseState: CaseState | null                           │
│  ├── metaState: MetaState (streak, completions, settings)  │
│  └── uiState: UIState (modals, loading, errors)            │
├─────────────────────────────────────────────────────────────┤
│  Core Logic (pure functions, zero deps)                      │
│  ├── resolveStatement(case, character, question, ctx)       │
│  │       → Resolution (one statement; deterministic)        │
│  ├── knowledgeGraph.ts    → statement/clue/lead accumulation │
│  ├── contradictionEngine.ts → surfaced authored links only  │
│  ├── accusation.ts        → evaluateAccusation(acc, truth)  │
│  ├── solver.ts            → build-time ≥2-path solvability   │
│  ├── persistence.ts       → LocalStorage save/load/migrate  │
│  ├── dailyCase.ts         → getDailyCaseId(date)            │
│  └── share.ts             → generateShareString(state)      │
├─────────────────────────────────────────────────────────────┤
│  Data (JSON, code-split, lazy per case)                     │
│  ├── cases/index.json     → briefing + roster intros (eager) │
│  └── cases/<id>.json      → full CaseFile (lazy on open)    │
└─────────────────────────────────────────────────────────────┘
```

> Module/file names above are the intended rebuild layout (not yet implemented). The point is the
> conceptual model: a **CaseFile** is the unit of game state, characters are interrogated, statements
> accumulate in a knowledge graph, and an accusation is checked against the case `truth`.

---

## Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    preact(),
    vitePluginPWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: { name: 'The Interrogation', short_name: 'Interrogate', start_url: '/',
                  display: 'standalone', background_color: '#0a0a0a', theme_color: '#0a0a0a' },
    }),
  ],
  build: { target: 'es2022', minify: 'esbuild', cssCodeSplit: true, sourcemap: false },
  resolve: { alias: { '@': 'src' } },
});
```

- Per-case data is split automatically by dynamic `import()` of each `cases/<id>.json` (no manual chunk
  entries). The previous config's `'people-pool'` / `'card-library'` manual chunks referenced deleted
  data files and are **removed** (they belonged to the rejected identifier architecture).
- No source maps in production (INV-003 secrecy hygiene).
- CSP headers via Cloudflare Pages `_headers` file.

---

## TypeScript Config (Strict)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

> DEC-012: the two extra-strict flags (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) are
> removed for V1. `strict: true` stays. Re-add only after data/test boundaries use brand + index guards.

---

## Project Structure (intended rebuild)

```
src/
├── main.tsx                 # App entry, SW registration
├── app.tsx                  # Root, providers, routing
├── routes/
│   ├── Home.tsx
│   ├── PracticeList.tsx
│   ├── Case.tsx             # Investigation screen (interrogation + Case Board)
│   └── Reveal.tsx
├── components/
│   ├── CaseBoard.tsx        # Notebook: People/Statements/Timeline/Evidence/Contradictions/Leads
│   ├── CharacterPanel.tsx
│   ├── Transcript.tsx
│   ├── QuestionCards.tsx
│   ├── Accusation.tsx       # Structured Case Theory submission
│   └── ShareButton.tsx
├── core/
│   ├── types.ts             # CaseFile / Character / Resolution / PlayerState
│   ├── resolveStatement.ts
│   ├── knowledgeGraph.ts
│   ├── contradictionEngine.ts
│   ├── accusation.ts
│   ├── solver.ts            # retargeted case-graph solver (build-time)
│   ├── persistence.ts
│   ├── dailyCase.ts
│   └── share.ts
├── state/
│   ├── caseState.ts
│   ├── metaState.ts
│   └── uiState.ts
├── data/
│   └── cases/               # CaseFile JSON (lazy per case)
├── styles/
└── sw.ts                    # Workbox injectManifest SW
```

---

## Data Loading Strategy

| Data | Size (est.) | Loading | Caching |
|------|-------------|---------|---------|
| App shell (JS/CSS) | ~30KB gz | Eager | SW precache |
| Case index (briefing + roster intros) | ~5KB gz | Eager (small) | SW precache |
| Full case (truth + characters + questions + contradictions) | ~10–20KB gz | Lazy (on open) | SW cache-first |

**Key invariant**: Canonical truth never in the initial bundle (INV-001). The full `CaseFile` (including
`truth`) is loaded **only** when the case is opened, and `truth` is never rendered until the reveal.

---

## Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "validate:cases": "node scripts/validate-cases.mjs",
    "validate:build": "node scripts/validate-build.mjs",
    "typecheck": "tsc --noEmit"
  }
}
```

> The legacy `validate:puzzles` script (which ran `scripts/validate-puzzles.mjs`, the old candidate-
> filter solver) is **removed**. The corrected case validator is `scripts/validate-cases.mjs`
> (Phase 3 deliverable) and is wired as `validate:cases`. `lint` (ESLint) is not installed in this
> workspace.

---

## CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run validate:cases   # case solvability / ≥2 paths / worst-case variants
      - run: npm run validate:build    # bundle-size + canonical-truth-leak audit
      - run: npm run build
      - run: npm run test:e2e   # optional; requires Playwright browsers
```

---

## Validation Scripts (Build Gates)

### `scripts/validate-cases.mjs` (Phase 3 — replaces the deleted `validate-puzzles.mjs`)
- Loads every `CaseFile` JSON.
- Runs the retargeted case-graph solver; fails if any case is unsolvable, single-path, or unsolvable
  under the worst-case (minimum-disclosure) response-variant combination (INV-114).
- Validates fact-tier redundancy (INV-115) and authored-only contradictions (INV-116).

### `scripts/validate-build.mjs` (kept)
- Verifies `dist/` exists and reports gzipped asset sizes against the budget.
- Canonical-truth-leak audit: greps the production bundle for `culpritId` / `truth` outside lazy case
  chunks (INV-001); greps for `eval|Function|fetch|openai|anthropic` (INV-003).
- Verifies CSP-compatible build (no inline scripts beyond Vite's).

---

## CSP Headers (Cloudflare Pages `_headers`)

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
```

---

## Offline Strategy

1. **Install**: SW precaches app shell on first visit.
2. **Case index**: Eager; precached.
3. **Full case**: Lazy (network-first with short timeout → cache fallback) on open; cached thereafter.
4. **Updates**: `skipWaiting` + `clients.claim`; banner "New version — refresh".

---

## Bundle Size Budgets (Enforced in CI)

| Artifact | Limit (gzipped) |
|----------|-----------------|
| Initial JS (framework + app + routing + state + core logic) | ≤ 50 KB |
| Initial CSS | ≤ 10 KB |
| Case index (eager) | ≤ 5 KB |
| **Total initial transfer** | **≤ 100 KB** |
| Single full case (lazy) | ≤ 20 KB |

---

## Browser Support Baseline

- **Target**: ES2022, CSS Grid, Custom Properties, `localStorage`, Service Worker
- **Minimum versions**: iOS Safari 15+, Chrome 100+, Firefox 100+, Edge 100+
- **No polyfills**: Code transpiled to ES2022; unsupported browsers get graceful degradation notice
- **Testing matrix**: Playwright on Chromium, Firefox, WebKit (mobile + desktop viewports) — *not installed in V1 workspace*

---

## Developer Experience

```bash
npm install
npm run dev          # Hot-reload dev server at localhost:5173
npm run test:watch   # Unit tests in watch mode
npm run typecheck    # Strict TypeScript check
```

---

## V1 Static Quality Gates

ESLint is **not** part of the V1 toolchain. The V1 static quality gates are:
1. `npm run typecheck` — TypeScript `strict`.
2. `npm test` — Vitest unit suite (solver, statement resolution, knowledge-graph/unlock integrity, persistence).
3. `npm run validate:cases` — case solvability / ≥2 paths / worst-case-variant gate (Phase 3).
4. `npm run validate:build` — bundle-size + canonical-truth-leak build gate.

`test:e2e` requires `@playwright/test` + browser binaries (not installed); it will fail until added.

---

## Stack Lock Confirmation

**This stack is locked for V1.** No new dependencies, frameworks, services, or architecture patterns
without explicit ORANGE decision review. The *technology* choices are unchanged from the prior
prototype; only the data model, core logic, and UI change (they are rebuilt for the corrected
crime-mystery interrogation product).

**Approved by**: [Pending human approval]
**Date**: [Pending]
**Git commit**: [To be recorded after approval]

---

## SUPERSEDED / REJECTED PROTOTYPE (historical record — DO NOT REUSE)

The first prototype implemented a **"hidden-secret identifier"**: a pool of historical people
(`src/data/secrets/people.json`), a library of demographic predicate cards (`src/data/cards/library.json`),
person puzzles whose `hiddenSecretId` was a historical figure (`src/data/puzzles/*`), and a candidate-
elimination engine (`predicateEval.ts` → `cardResolver.ts` → `candidateFilter.ts` → `gameFlow.ts` makeGuess).
That architecture is **rejected** (see `PRODUCT_CORRECTION_REPORT.md`). The following artifacts were
**deleted during the architecture-reset purge** and must not be recreated:

- `src/data/secrets/people.json`, `src/data/cards/library.json`, `src/data/puzzles/*`, `src/data/index.ts`
- `scripts/validate-puzzles.mjs` (old candidate-filter solver)
- `vite.config.js` (duplicate config)
- `.eslintrc.cjs` (orphaned; ESLint not installed)

Concepts explicitly forbidden as active architecture (may appear only in these historical notes):
candidate elimination / filtering, people pool, person attributes, demographic predicates,
question = boolean predicate, puzzle = hidden person, win = identify remaining person.
