# Deployment Forensics — The Interrogation

**Phase:** 3.1 (cross-host production failure investigation, continued)
**Investigator:** automated agent (sandbox)
**Status:** ROOT CAUSE IDENTIFIED — application code/build are correct; failure is in the hosting/serving layer.

---

## Executive verdict

### YELLOW — ROOT CAUSE IDENTIFIED, LIVE VERIFICATION INCOMPLETE

The production **build is correct and deployable**. The application code, the Vite
configuration, the generated `index.html`, `manifest.webmanifest`, and `sw.js` are
all correct and use relative paths. The same `dist/` was proven to serve every
critical asset with HTTP 200 both at root `/` and at the GitHub Pages subpath
`/interrogation/` using a plain static file server.

The deployed site fails because **the hosting/serving layer is not actually
publishing the built artifact**:

- **GitHub Pages:** the repository has **no active Pages site**. The REST API
  `GET /repos/timiretimzzy/interrogation/pages` and
  `GET /repos/timiretimzzy/interrogation/pages/deployments` both return **404 Not
  Found**. The CI `deploy-pages` step only created a *deployment record* (latest
  `state: "success"`, `environment_url: https://timiretimzzy.github.io/interrogation/`)
  but there is no enabled Pages site to serve it. This is the same root cause from
  the earlier Phase 3.1 investigation, now re-confirmed.
- **Vercel:** no confirmed serving project. `vercel.json` is present and correct,
  but the guessed production URL returns HTTP 404 and no deployment is verified
  from the sandbox.

Live browser verification could **not** be performed from the sandbox because the
sandbox network cannot reach `*.github.io` (connection times out) and has no
Vercel authentication/session. The remediation below is a deployment-configuration
change the repository owner must apply (one click for Pages; one import for Vercel).

---

## 1. Incident

Both GitHub Pages (`https://timiretimzzy.github.io/interrogation/`) and Vercel were
reported as failing, while the application works in the agent's local build/serve
environment. The goal was to find the first broken layer between source and browser,
not to change hosting providers again.

## 2. Control (what is known-good)

| Item | Evidence |
| ---- | -------- |
| Source commit | `8769cbb` (HEAD, pushed to `origin/main`) |
| `vite.config.ts` | `base: './'` (relative) |
| `dist/index.html` | All asset/script/link paths are relative (`./assets/...`, `./manifest.webmanifest`, `./icon.svg`) |
| `dist/manifest.webmanifest` | `start_url: "./"`, `scope: "./"`, relative icon |
| `dist/sw.js` | Precache URLs are **relative** (`"index.html"`, `"assets/index-*.js"`, `"assets/index-*.css"`); no absolute `/interrogation/` or `/assets/` leaks |
| `dist/` not committed | `GET /repos/.../contents/dist/index.html` → 404, so no stale committed `dist` |
| Local serve at `/` | All critical assets return HTTP 200 (verified via static server) |
| Local serve at `/interrogation/` | All critical assets return HTTP 200 (verified via static server) |
| Source audit | Only `import.meta.env.VITE_APP_VERSION` uses env; no `fetch(`, no `navigator.serviceWorker`, no `new URL(` in app code. Case data is bundled, not fetched. |
| Gates | `typecheck`, `test`, `validate:cases`, `build`, `validate:build` all green on CI run #6 |

Conclusion: **the artifact the CI produces is correct and would work on any static
host.** The problem is that the artifact is not being served.

## 3. Investigation timeline

1. Read `vite.config.ts` → confirmed `base: './'` and relative PWA `start_url`/`scope`.
2. Read `src/main.tsx` → service worker is registered **before** `render`, but via
   `registerSW({ immediate: true })` which is fire-and-forget (does not block render
   because `render()` still executes synchronously afterwards).
3. Read generated `dist/index.html`, `dist/manifest.webmanifest`, `dist/sw.js` →
   all relative, no path bugs.
4. Ran the subpath reproduction harness → initially all 404 because of a **Windows
   path bug in the harness** (`/C:/...` style path from `new URL(...).pathname`), not
   an app bug. The corrected harness (prior turn) and the file-serving proof confirm
   both `/` and `/interrogation/` serve 200.
5. Queried GitHub REST API:
   - `GET /pages` → **404**
   - `GET /pages/deployments` → **404**
   - `GET /deployments` → records exist; latest `6161139262` status `state:"success"`,
     `environment_url: "https://timiretimzzy.github.io/interrogation/"`.
   - Workflow run #6 (`8769cbb`) → `conclusion: "success"`.
6. Checked `vercel.json` in repo (present, correct) and probed
   `the-interrogation.vercel.app` → **HTTP 404**.
7. Confirmed no `gh-pages` branch exists (rules out legacy branch-source misconfig).
8. Read `scripts/validate-build.mjs` → only checks `dist/` + `index.html` exist and
   reports sizes; it does not execute the app (consistent with the artifact being fine).
9. Counted cases → **11** production cases under `src/data/cases/` (registered via
   the manual `index.ts`).

## 4. Hypothesis matrix

| # | Hypothesis | Test | Result | Status |
| - | ---------- | ---- | ------ | ------ |
| H1 | Vite `base` misconfigured (absolute) | Read `vite.config.ts` + `dist/index.html` | `base: './'`, all paths relative | **ELIMINATED** |
| H2 | Subpath `/interrogation/` breaks asset resolution | Serve same `dist` at `/interrogation/` | All assets 200 | **ELIMINATED** |
| H3 | `sw.js` uses absolute/incorrect precache URLs | Read generated `sw.js` | Relative precache URLs | **ELIMINATED** |
| H4 | `manifest.webmanifest` wrong `start_url`/`scope` | Read generated manifest | `"./"` / `"./"` | **ELIMINATED** |
| H5 | `registerSW` before `render` blocks startup | Read `main.tsx` + PWA virtual module semantics | Fire-and-forget, render still runs; root control works | **ELIMINATED** |
| H6 | Production-only code path (`import.meta.env`, `location`, `fetch`, `new URL`) | Source grep | Only `VITE_APP_VERSION` used; no fetch/SW/URL in app code | **ELIMINATED** |
| H7 | Stale committed `dist` deployed instead of fresh build | `GET /contents/dist/index.html` | 404 (not committed) | **ELIMINATED** |
| H8 | CI builds wrong directory | Read workflow + `validate:build` | `upload-pages-artifact` path `dist`; build writes `dist` | **ELIMINATED** |
| H9 | `gh-pages` branch causing legacy source | `git branch -a` | Only `main` exists | **ELIMINATED** |
| H10 | **GitHub Pages not enabled/serving** | `GET /pages`, `GET /pages/deployments` | **Both 404** | **CONFIRMED** |
| H11 | **Vercel not connected/serving** | `vercel.json` present + probe URL | Config correct; URL 404, no verified deploy | **PROBABLE** |
| H12 | Stale service worker serving old bundle | Could not reproduce (no live browser from sandbox) | Possible secondary contributor on a tester's browser | **UNVERIFIED** |

## 5. Code / config audit

| File | Finding |
| ---- | ------- |
| `vite.config.ts` | `base: './'`; PWA `registerType: 'autoUpdate'`, `injectRegister: null`, relative `start_url`/`scope`. Correct. |
| `src/main.tsx` | Registers SW before render, but non-blocking. Works (root control). No change required for root cause. |
| `dist/index.html` | Relative `./assets/...`, `./manifest.webmanifest`, `./icon.svg`. CSP is strict (`default-src 'self'`) but all same-origin, so allowed. Correct. |
| `dist/sw.js` | Workbox precache uses relative URLs; `NavigationRoute` → `index.html`. Correct. |
| `dist/manifest.webmanifest` | `start_url: "./"`, `scope: "./"`. Correct. |
| `.github/workflows/deploy.yml` | Standard Actions-Pages pipeline: checkout → node20 → `npm ci` → typecheck → test → validate:cases → build → validate:build → `configure-pages@v5` → `upload-pages-artifact@v3` (path `dist`) → `deploy-pages@v4`. Correct and would publish once Pages is enabled with Source = GitHub Actions. |
| `vercel.json` | `framework: vite`, `buildCommand: npm run build`, `outputDirectory: dist`, rewrite all to `index.html`. Correct. |
| `scripts/validate-build.mjs` | Confirms `dist/` + `index.html` exist; reports JS size budget. Does not execute the app (by design). |

## 6. Generated `dist` audit

`dist/` contains: `index.html`, `manifest.webmanifest`, `sw.js`, `workbox-*.js`,
`icon.svg`, `assets/index-*.js`, `assets/index-*.css`. No nested `dist/dist`,
no `src/`, no extra `interrogation/` layer. Structure is flat and correct for both
root and subpath static hosting.

## 7. Service-worker audit

- Registration: `registerSW({ immediate: true })` from `virtual:pwa-register`.
- Generated `sw.js` located at dist root; on GitHub Pages resolved to
  `/interrogation/sw.js` (scope `/interrogation/`), on Vercel to `/sw.js` (scope `/`).
- Precache manifest uses **relative** URLs → no base-path defect.
- `autoUpdate` + `clientsClaim` + `skipWaiting` → a new correct build replaces a
  stale one automatically. This means a *correct* redeploy self-heals a stale SW.
- **Not the root cause** of the current failure (the site is not served at all, so no
  SW can load). Listed as **UNVERIFIED secondary** only in the sense that a tester who
  previously visited an old broken build could retain a stale SW; the fix below
  (enabling Pages with the correct build) will self-heal that on next load.

## 8. Live HTTP audit

| Host | Result | Note |
| ---- | ------ | ---- |
| `https://timiretimzzy.github.io/interrogation/` | **Connection timed out** (HTTP 000) | Sandbox cannot reach `*.github.io` CDN. The repository owner's browser reaches it but reports failure. |
| `https://the-interrogation.vercel.app/` | **HTTP 404** (107 bytes, text/plain) | Vercel returns 404 for this (likely wrong) subdomain; no verified Vercel project/deploy. |

The GitHub API (which IS reachable) is authoritative for config state and shows
**no enabled Pages site** (H10 CONFIRMED).

## 9. Browser audit

Could not be performed from the sandbox (no reachable CDN, no headless browser with
network egress to the hosts). All HTTP-level evidence was gathered via `curl` +
static-server reproduction. Console/network evidence on the live hosts must be
captured by the repository owner (see Verification checklist).

## 10. Root cause

```
source/config          → correct (relative base, correct sw.js/manifest)
        ↓
Vite build             → correct (CI run #6 success; dist verified)
        ↓
generated artifact     → correct (serves 200 at / and /interrogation/)
        ↓
CI upload + deploy      → creates a deployment RECORD (state: success)
        ↓
HOSTING / SERVING LAYER → BROKEN
   • GitHub Pages: site NOT enabled (GET /pages → 404). Nothing is published.
   • Vercel: no confirmed serving project (URL → 404).
        ↓
public browser          → cannot load the application (404 / timeout / stale)
```

**Primary root cause:** the deployment target is not actually serving the artifact.
- GitHub Pages: no active Pages site (`GET /pages` and `GET /pages/deployments` both
  404). The `deploy-pages` action produced a deployment *record* but there is no
  enabled site with Source = GitHub Actions to publish it. This has recurred across
  every deploy (the earlier Phase 3.1 "fix" did not persist).
- Vercel: `vercel.json` is correct, but no connected/serving project is verified.

**This is NOT a code, Vite, base-path, service-worker, or case-loading defect.**
All of those were tested and eliminated.

## 11. Why the sandbox did not expose it

The sandbox **can** build and serve the static `dist/` locally, and that always
succeeds (it is just files). The sandbox **cannot** reach the live CDN
(`*.github.io` times out) and has no Vercel session. Therefore a green local
build + successful CI run created false confidence ("the build is fine, so the
hosts should work"), while the actual failure lives entirely in the
GitHub Pages / Vercel **serving configuration**, which is invisible to a local
build-and-serve test. The decisive evidence is the GitHub REST API: `GET /pages`
→ 404 proves no site is serving, independent of any browser.

## 12. Fix

The fix is a **deployment-configuration change**, not a code change. No application
source was modified for this root cause.

### GitHub Pages (required)

Enable the site so the existing successful workflow publishes:

1. Go to **Repository → Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions** (not a branch).
3. That is it — the next push (or a manual *Run workflow*) makes
   `deploy-pages` actually publish `dist/` to `https://timiretimzzy.github.io/interrogation/`.

> If the site was previously set to a branch source (e.g. `gh-pages`) and that branch
> no longer exists, switch it to **GitHub Actions** as above. Do **not** recreate a
> `gh-pages` branch.

### Vercel (required)

1. Log in to Vercel → **Add New → Project** → import `github.com/timiretimzzy/interrogation`.
2. Framework **Vite**; Build `npm run build`; Output `dist` (already in `vercel.json`).
3. Deploy. Live at `https://<project>.vercel.app/`.

### Code hardening considered and NOT applied

Moving `registerSW` after `render` was evaluated (it is good practice) but the
investigation **eliminated** it as a cause (root control works with current ordering,
and SW registration is non-blocking). No source change was made for this root cause.
If desired later, it is a safe, optional improvement.

## 13. Verification

### Local (performed, CONFIRMED)
- `npm run build` → success.
- Serve `dist/` at `/` → assets 200.
- Serve `dist/` at `/interrogation/` → assets 200.
- `npm run typecheck`, `npm test`, `npm run validate:cases`, `npm run validate:build` → green.

### Required on the live hosts (owner action — sandbox cannot reach CDN)
1. After enabling Pages (Source = GitHub Actions), open
   `https://timiretimzzy.github.io/interrogation/` in a **clean browser context**
   (or after *Unregister service workers* + *Clear site data* to defeat any stale SW).
2. Confirm: HTML loads, JS/CSS load, case selector shows **11 cases**, no console errors.
3. Play one full case: briefing → character → question → response → switch →
   discovery → contradiction → confrontation → Theory → accusation → reveal.
4. Repeat on the Vercel URL.
5. Confirm the footer build id reads `0.3.0-test+8769cbb`.

## 14. Prevention

- Once Pages is enabled with Source = GitHub Actions, the existing
  `.github/workflows/deploy.yml` (typecheck → test → validate:cases → build →
  validate:build → deploy) is the regression gate. Any future broken build fails CI
  before deploy.
- Keep `base: './'` so one artifact serves every host.
- Do not re-introduce a `gh-pages` branch or branch-source Pages config.
- Optionally add a post-deploy smoke check (e.g. a scheduled `curl`/Playwright job
  that asserts the live URL returns 200 and contains `id="app"`), to catch a
  non-serving site automatically.

## 15. Build identity

| Layer | Value |
| ----- | ----- |
| Local build commit | `8769cbb` |
| CI run | #6 (commit `8769cbb`), conclusion `success` |
| GitHub Pages deployment record | `6161139262` (`state: success`, `environment_url: https://timiretimzzy.github.io/interrogation/`) |
| Live Pages site | **none / not enabled** (`GET /pages` → 404) |
| Vercel | `vercel.json` present; no verified deployment |
| Build id (footer) | `0.3.0-test+8769cbb` |

## 16. Direct investigation links

- Repository: https://github.com/timiretimzzy/interrogation
- Commit `8769cbb`: https://github.com/timiretimzzy/interrogation/commit/8769cbb
- Workflow: https://github.com/timiretimzzy/interrogation/actions/workflows/deploy.yml
- Run #6: https://github.com/timiretimzzy/interrogation/actions/runs/33280439692
- Pages deployments API (404 = no site): `GET https://api.github.com/repos/timiretimzzy/interrogation/pages/deployments`
- Live (owner must verify): https://timiretimzzy.github.io/interrogation/
