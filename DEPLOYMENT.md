# Deployment — Controlled Test Build

This document covers the **controlled user-testing deployment** of the current
deterministic game. It is NOT the final public launch and does NOT include the
LLM case-generation pipeline, novelty engine, accounts, or analytics (all later
phases).

## Target

- **Live URL:** https://timiretimzzy.github.io/interrogation/
- **Repository:** https://github.com/timiretimzzy/interrogation
- **Deployment branch:** `main`
- **Hosting:** GitHub Pages (project site, served under `/interrogation/`)

## Architecture

```
GitHub repository (main)
        │  push / workflow_dispatch
        ▼
GitHub Actions  (.github/workflows/deploy.yml)
        │  npm ci → typecheck → test → validate:cases
        │        → build (vite, base '/interrogation/') → validate:build
        │        → upload-pages-artifact (dist)
        ▼
actions/deploy-pages  →  GitHub Pages (GitHub Actions source)
        ▼
Static game at /interrogation/
```

The application is a fully static client-side SPA. There is **no backend, no
API, no database, and no server-side route resolution**. All case content is
bundled at build time.

## Build configuration

- **Vite `base`:** `/interrogation/` — every emitted asset URL is rooted under
  the project-pages subpath, so the site works at
  `https://<user>.github.io/interrogation/`.
- **PWA:** `vite-plugin-pwa` (Workbox, `generateSW` mode), `registerType:
  autoUpdate`. The service worker is registered in `src/main.tsx` via
  `virtual:pwa-register`. `autoUpdate` means a redeployed build invalidates the
  previously cached bundle on the next load, which prevents testers from being
  pinned to a stale build.
- **Manifest:** `start_url` and `scope` are `/interrogation/`. An SVG icon
  (`public/icon.svg`) is provided so the manifest and favicon do not 404.
- **CSP:** `default-src 'self'; script-src 'self'; style-src 'self'
  'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self';
  form-action 'self'`. `connect-src` is intentionally restricted to `'self'`
  (no third-party, no backend, no analytics). This still permits the
  same-origin service-worker update checks that `autoUpdate` relies on.

## Build identifier

`vite.config.ts` derives `APP_VERSION = 0.3.0-test+<git short hash>` at build
time and injects it as `import.meta.env.VITE_APP_VERSION`. It is shown in the
tester footer ("Test build · <version>") so a bug report can name the exact
build. The version is rebuilt on every CI run from the deployed commit.

## How to deploy

1. Commit changes to `main`.
2. `git push origin main`.
3. The `Deploy to GitHub Pages` workflow runs automatically.
4. Alternatively, run it manually from the Actions tab
   (`workflow_dispatch`).

The deployment **fails** if any gate fails (`typecheck`, `test`,
`validate:cases`, `build`, `validate:build`). No "build anyway" path exists.

## How to verify a deployment

- Open https://timiretimzzy.github.io/interrogation/ in a normal browser.
- Confirm the page, CSS, and JS load with no fatal console errors.
- Start a case, read the briefing, ask a question, switch characters, open
  Theory/Notebook, make an accusation, read the reveal.
- Refresh mid-case and confirm state persists.
- Check the footer shows the expected `Test build · <version>` for the deployed
  commit.

## GitHub Pages configuration

Pages is configured with **source = GitHub Actions** (not a `gh-pages` branch).
The workflow's `actions/configure-pages` step ensures this; the deployed artifact
is the `dist/` upload, never a committed `dist/`.

## Rollback

GitHub Pages keeps a deployment history. To roll back:

- In the repo **Settings → Pages → Deployment history**, or via the
  **Actions → Deployments** view, re-run / activate the previous successful
  deployment; or
- `git revert` the offending commit on `main` and push; CI redeploys the
  previous good build.

`dist/` is git-ignored, so rollback never depends on committed build output.

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
- **CSP `unsafe-inline` style:** required for the bundled CSS-in-JS-free
  component styles; no inline scripts are used.
