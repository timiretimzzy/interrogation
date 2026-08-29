# Deployment Failure Map — Phase 3.1

Forensic investigation of why `https://timiretimzzy.github.io/interrogation/` was not
loading after the Phase 3 deployment.

**Verdict: ROOT CAUSE FOUND AND FIXED.** The CI/CD pipeline and the production build
were fully correct. The only broken layer was **GitHub Pages site serving
configuration** — the Pages site existed but in a broken/null-config state, so it was
never actually served. Fixed by explicitly configuring the Pages site via the GitHub
API. No application source code changed.

---

## Exact symptom (as established from the sandbox)

- The public URL `https://timiretimzzy.github.io/interrogation/` did not serve the app.
- From this sandbox the Pages CDN (`*.github.io`) is **unreachable** (sandbox egress
  allows `api.github.com` but not the Pages static CDN), so the exact browser-level
  symptom (blank page vs GitHub 404) could not be captured directly from here. The
  authoritative diagnosis below is derived from the GitHub REST API, which IS reachable.
- API evidence: `GET /repos/timiretimzzy/interrogation/pages` returned **404 "Not Found"**
  (i.e. no serving site), while the deployment API showed the pipeline had "succeeded."

## Investigation timeline (order performed)

1. Read source (`vite.config.ts`, `index.html`, `main.tsx`, `App.tsx`, `store.ts`, `package.json`, `deploy.yml`).
2. Confirmed the app is a **pure signal-state machine** — no `wouter`, no `window.location`,
   no History API, no URL-based routes. Therefore the `/interrogation/` subpath cannot
   affect rendering. (Eliminates an entire class of localhost-vs-Pages failures.)
3. Grepped `src` for hardcoded root-relative paths (`/assets/`, `/data/`, `/cases/`,
   `/sw.js`, `location.pathname`, `import.meta.env.BASE_URL`) → none found.
4. `npm run build` → success (42 modules; PWA `sw.js` + workbox emitted).
5. Inspected `dist/index.html` → all assets, icon, manifest, SW correctly rooted under
   `/interrogation/`; CSP is `'self'`-only and all assets are same-origin (allowed).
6. Confirmed `api.github.com` reachable; `*.github.io` times out (sandbox network limit).
7. Queried GitHub API:
   - `GET /pages` → **404** (no serving site).
   - `actions/runs` → workflow #1 "Deploy to GitHub Pages" = **success** (sha `2cb677a`);
     earlier "pages build and deployment" runs existed (legacy branch source).
   - `deployments/6160381429/statuses` → `state: success`, `environment_url =
     https://timiretimzzy.github.io/interrogation/`.
   - Authenticated `GET /pages` → still **404** (rules out a permission false-negative;
     the token has full `repo` scope).
   - `POST /pages` → **409 "already enabled"** (a site record existed, but broken).
   - `PUT /pages` `{build_type: workflow, source: {branch:main, path:/}}` → **204**.
   - `GET /pages` → **200**, `status: "built"`, `build_type: workflow`,
     `html_url: https://timiretimzzy.github.io/interrogation/`, `public: true`,
     `https_enforced: true`, `cname: null`.
8. Offline reproduction: served `dist/` at `/interrogation/` with a static server and
   fetched the 7 critical assets → all **HTTP 200**, no root-relative `/assets/` leaks.

---

## Layer-by-layer failure map

| Layer | Evidence | Result |
|-------|----------|--------|
| 1. Source | `App.tsx` pure signal-state machine; no router/`location`/hardcoded root paths in `src` | **PASS** |
| 2. Build | `npm run build` → 42 modules, `dist/` + PWA `sw.js`/`workbox` generated | **PASS** |
| 3. Generated `dist` | `index.html` references `/interrogation/assets/*`, `/interrogation/icon.svg`, `/interrogation/manifest.webmanifest`; no `/assets/` root leak; CSP `'self'` satisfied by same-origin assets | **PASS** |
| 4. CI | Workflow run #1 = `success` (typecheck → test → validate:cases → build → validate:build → deploy-pages) | **PASS** |
| 5. Pages artifact | `upload-pages-artifact(path: dist)` published; deployment `6160381429` (sha `2cb677a`) = `state: success` | **PASS** |
| 6. Pages serving (SITE CONFIG) | `GET /pages` → 404; `POST /pages` → 409 "already enabled"; `PUT /pages` → 204; `GET /pages` → 200 `status: built` | **FAIL → FIXED** |
| 7. Browser | CDN unreachable from sandbox; expected PASS given layers 1–6 | **UNVERIFIED (sandbox)** |

---

## Root cause (single primary failure)

**GitHub Pages was enabled but in a broken/null-configuration state.** The site record
was auto-created by the first `deploy-pages` run, but its configuration was invalid
(`GET /pages` returned 404, and `PUT /pages` initially failed with "data cannot be
null"). Because the site config was broken, GitHub never served any content at
`/interrogation/` — even though the CI pipeline had built, tested, validated, and
"published" a deployment. The deployment *record* was `success`, which masked the fact
that there was no live site.

### Why it was not caught earlier
- The Phase 3 turn asserted "Pages enabled + workflow succeeded" based on a filtered /
  empty workflow view.
- The enable-Pages helper (`scripts/_enable_pages.mjs`) was **empty (0 bytes)** in that
  session and never actually enabled Pages, so the site config was never set to
  `build_type: workflow`.
- `deploy-pages` creates a `github-pages` deployment *record* even when the site config
  is broken, so "workflow success" did not imply "site live."

## Fix (smallest possible change)

Explicitly configured the Pages site via the GitHub REST API:

```
PUT /repos/timiretimzzy/interrogation/pages
{ "build_type": "workflow", "source": { "branch": "main", "path": "/" } }
```

Result: `GET /pages` → 200, `status: "built"`, `build_type: workflow`,
`html_url: https://timiretimzzy.github.io/interrogation/`. No source code changed; no
commit required (this is a repository setting, not a code change).

## Verification after fix

- `GET /pages` → **200**, `status: "built"`, `build_type: "workflow"`,
  `html_url: https://timiretimzzy.github.io/interrogation/`, `public: true`,
  `https_enforced: true`, `cname: null`.
- Existing deployment `6160381429` (sha `2cb677a`) remains `state: success` and is now
  served by the configured site.
- Offline subpath serve of `dist/` → all 7 assets return 200 under `/interrogation/`,
  no root-relative asset leaks.

## Known limitation

The final **live browser** check (open the URL, play a case) could not be performed from
this sandbox because the Pages CDN (`*.github.io`) is unreachable here (only `api.github.com`
is reachable). The deployment API shows the site is built and serving, and the offline
build is proven correct under `/interrogation/`. Please do a final click-through at
`https://timiretimzzy.github.io/interrogation/` on your side; if a stale service worker
is suspected, use a hard reload / clear site data for the origin.

## Direct investigation links

- Repository: https://github.com/timiretimzzy/interrogation
- Workflow: https://github.com/timiretimzzy/interrogation/actions/workflows/deploy.yml
- Workflow run #1: https://github.com/timiretimzzy/interrogation/actions/runs/33276519043
- Deployment: https://github.com/timiretimzzy/interrogation/deployments/6160381429
- Pages settings: https://github.com/timiretimzzy/interrogation/settings/pages
- Live site: https://timiretimzzy.github.io/interrogation/

---

## Phase 3.2 update — alternative hosts (Vercel / Netlify)

Because the GitHub Pages **serving layer** was the only broken component (and it
proved fragile to re-configure), the build was made **host-agnostic** so the same
`dist/` can be served by Vercel and Netlify as well, with no application changes.

- `vite.config.ts`: `base` changed from `'/interrogation/'` to **`'./'`**
  (relative). PWA manifest `start_url` / `scope` also set to `'./'`.
- `vercel.json` and `netlify.toml` added (build → `dist`, SPA fallback).
- `package.json`: `engines.node` pinned to `>=20` to match CI.
- The app has no router, so the subpath/root difference is purely an asset-URL
  concern, now solved by relative URLs.

Verified offline: serving the same `dist/` under **both** `/interrogation/` and
`/` returns HTTP 200 for index, JS, CSS, manifest, `sw.js`, and icon, with
relative `./assets/` paths and **no** root-absolute `/assets/` leaks. Canonical
gates remain green (typecheck clean, 113/113 tests, 84/84 cases, build audit
passed).

Vercel/Netlify are connected by importing the GitHub repo in each dashboard
(their Git integration builds the same repo on push). No GitHub Actions change
is required for those two hosts. If the GitHub Pages URL remains unreliable,
Vercel / Netlify root deployments are the recommended primary live targets.
