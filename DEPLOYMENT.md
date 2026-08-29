# Deployment — Controlled Test Build

This document covers the **controlled user-testing deployment** of the current
deterministic game. It is NOT the final public launch and does NOT include the
LLM case-generation pipeline, novelty engine, accounts, or analytics (all later
phases).

## Targets (one build, three hosts)

| Host | URL | Notes |
|------|-----|-------|
| GitHub Pages | `https://timiretimzzy.github.io/interrogation/` | served under the project subpath |
| Vercel | `https://<project>.vercel.app/` | root domain, connect the repo |
| Netlify | `https://<project>.netlify.app/` | root domain, connect the repo |

- **Repository:** https://github.com/timiretimzzy/interrogation
- **Deployment branch:** `main`
- **Hosting:** static — any static host. The build is **host-agnostic**.

## One build serves every host

The application is a fully static client-side SPA with **no backend, no API, no
database, and no client-side router** (it is a pure signal-state machine in
`src/ui/App.tsx`). All case content is bundled at build time.

The only thing that previously tied the build to a specific host was the Vite
`base` path. As of Phase 3.2 the build uses a **relative base** (`base: './'`),
so Vite emits **relative asset URLs** (`./assets/...`, `./icon.svg`,
`./manifest.webmanifest`). A single `dist/` build therefore works identically:

- under the GitHub Pages subpath `/interrogation/` (browser resolves
  `./assets/x.js` against `/interrogation/` → `/interrogation/assets/x.js`), and
- at the root of Vercel / Netlify (`/assets/x.js`).

This was verified by serving the same `dist/` under both `/interrogation/` and
`/` and confirming every asset (index, JS, CSS, manifest, `sw.js`, icon) returns
HTTP 200 with no root-absolute `/assets/` leaks.

## Architecture

```
GitHub repository (main)
        │  push / workflow_dispatch
        ▼
GitHub Actions  (.github/workflows/deploy.yml)
        │  npm ci → typecheck → test → validate:cases
        │        → build (vite, relative base) → validate:build
        │        → upload-pages-artifact (dist)
        ▼
actions/deploy-pages  →  GitHub Pages (GitHub Actions source)
        ▼
Static game at /interrogation/

SAME repository + SAME dist/ can ALSO be deployed by:
  • Vercel   — connect the GitHub repo; Vercel builds & serves root  (vercel.json)
  • Netlify  — connect the GitHub repo; Netlify builds & serves root (netlify.toml)
```

All three hosts serve the **identical** `dist/` produced by `npm run build`.
`additional` hosts can be added by pointing them at the repo; no code change is
required beyond the relative base (already in place).

## Build configuration

- **Vite `base`:** `'./'` (relative). Every emitted asset URL is relative, so the
  build is portable across subpath and root hosts. Verified in `dist/index.html`.
- **PWA:** `vite-plugin-pwa` (Workbox, `generateSW` mode), `registerType:
  autoUpdate`. The service worker is registered in `src/main.tsx` via
  `virtual:pwa-register`. `autoUpdate` invalidates a previously cached bundle on
  the next load, preventing testers from being pinned to a stale build. The PWA
  manifest `start_url` and `scope` are also relative (`./`).
- **Manifest icon:** an SVG (`public/icon.svg`) is provided so the manifest and
  favicon do not 404.
- **CSP:** `default-src 'self'; script-src 'self'; style-src 'self'
  'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self';
  form-action 'self'`. `connect-src` is restricted to `'self'` (no third-party,
  no backend, no analytics). This still permits the same-origin service-worker
  update checks that `autoUpdate` relies on.

## Build identifier

`vite.config.ts` derives `APP_VERSION = 0.3.0-test+<git short hash>` at build
time and injects it as `import.meta.env.VITE_APP_VERSION`. It is shown in the
tester footer ("Test build · <version>") so a bug report can name the exact
build. The version is rebuilt on every CI run from the deployed commit.

## How to deploy — GitHub Pages

1. Commit changes to `main`.
2. `git push origin main`.
3. The `Deploy to GitHub Pages` workflow runs automatically (also manually via
   `workflow_dispatch`).
4. The deployment **fails** if any gate fails (`typecheck`, `test`,
   `validate:cases`, `build`, `validate:build`). No "build anyway" path exists.

> **GitHub Pages status note:** Pages serving has been the most fragile layer
> (Phase 3.1 found the site was in a broken/null-config state and not actually
> served). It is configured with **source = GitHub Actions**. If the subpath URL
> is still not loading, treat Vercel / Netlify below as the primary live targets
> — they do not depend on the GitHub Pages site-config quirk.

## How to deploy — Vercel

No GitHub Actions change is needed; Vercel builds the same repo on its own.

1. Log into Vercel → **Add New → Project** → import
   `github.com/timiretimzzy/interrogation`.
2. Framework Preset: **Vite**. Build Command: `npm run build`. Output Directory:
   `dist`. (These are also pinned in `vercel.json`.)
3. Deploy. Every push to `main` auto-redeploys.
4. (Optional) Add a custom domain later under Project → Domains.

## How to deploy — Netlify

1. Log into Netlify → **Add new site → Import an existing project** → connect the
   GitHub repo.
2. Build command: `npm run build`. Publish directory: `dist`. (Pinned in
   `netlify.toml`, which also sets `NODE_VERSION = 20` and a SPA fallback
   redirect.)
3. Deploy. Every push to `main` auto-redeploys.

## How to verify a deployment (any host)

- Open the host URL in a normal browser.
- Confirm the page, CSS, and JS load with no fatal console errors.
- Start a case, read the briefing, ask a question, switch characters, open
  Theory/Notebook, make an accusation, read the reveal.
- Refresh mid-case and confirm state persists (LocalStorage).
- Check the footer shows the expected `Test build · <version>` for the deployed
  commit.

## Rollback

- **GitHub Pages:** re-run / activate the previous successful deployment in
  **Settings → Pages → Deployment history** (or **Actions → Deployments**), or
  `git revert` the offending commit and push; CI redeploys the previous good build.
- **Vercel:** instantly promote any previous deployment from the project's
  Deployments list.
- **Netlify:** "Deploys" → any prior deploy → **Publish deploy**.
- `dist/` is git-ignored, so rollback never depends on committed build output.

## Known limitations

- **Content:** the 11 seed cases are hand-authored test content, not a daily
  production feed. The case picker is intentional (testers exercise different
  cases), not the final "Today's Case" UX.
- **PWA/offline:** the service worker precaches the app shell; full offline play
  is best-effort and should be confirmed on the deployed build before being
  claimed as supported.
- **Secrets:** none. The client bundle contains case truth by design (a static
  single-player game); there are no API keys, credentials, or backend tokens in
  the build.
- **CSP `unsafe-inline` style:** required for the bundled component styles; no
  inline scripts are used.
- **GitHub Pages subpath:** served at `/interrogation/`; if it is flaky, prefer
  the Vercel / Netlify root deployments for tester access.
