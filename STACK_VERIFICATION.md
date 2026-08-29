# Stack Verification: The Interrogation (Crime-Mystery Interrogation)

> ⚠️ **PRODUCT REDEFINITION — 2025-08-29.** The previous "Stack Verification" matrix mapped the
> stack against the rejected **"hidden-secret identifier"** prototype (FR-001..FR-012, INV-001..INV-015
> of the old spec: people pool, demographic predicate cards, candidate filtering, `hiddenSecretId`,
> four-outcome badges, "guess the person"). That prototype is **SUPERSEDED / REJECTED**. This file is
> rewritten to verify the stack against the corrected crime-mystery interrogation product
> (`REQUIREMENTS.md` FR-001..FR-015 + NFR-001..006; `INVARIANTS.md` INV-001..INV-015 retained/reinterpreted
> + INV-101..INV-120). The old FR/INV numbering is no longer authoritative.

---

## Verification Matrix: Requirements → Stack Alignment (Corrected Product)

### Functional Requirements

| Requirement | Stack Support | Implementation Location (intended) | Verification |
|------------|--------------|------------------------------------|-------------|
| **FR-001**: Case Data Model | ✅ | `src/data/cases/<id>.json` (lazy `CaseFile`) | Schema validation; `truth` required |
| **FR-002**: Interrogation Question System | ✅ | `CaseQuestion` + `resolveStatement` | Deterministic per (character × context) |
| **FR-003**: Answer / Truth States (internal only) | ✅ | `Resolution.truthState` never rendered | UI audit: no label in interrogation view |
| **FR-004**: Deception Design (not labelled) | ✅ | Predetermined lies in case data | INV-107 audit; reveal only |
| **FR-005**: Knowledge Graph & Notebook | ✅ | `knowledgeGraph.ts` + CaseBoard | No auto-elimination; records only |
| **FR-006**: Solvability Validation (≥2 paths) | ✅ | `scripts/validate-cases.mjs` (Phase 3) | Solver in CI; fails on unsolvable/single-path |
| **FR-007**: Practice Mode | ✅ | `src/routes/PracticeList.tsx`, `metaState` | Unlimited plays; completions tracked |
| **FR-008**: Daily Case | ✅ | `src/core/dailyCase.ts` | UTC date → case id; streak in `metaState` |
| **FR-009**: State Persistence | ✅ | `src/core/persistence.ts` | LocalStorage versioned; refresh restores |
| **FR-010**: Reveal Screen | ✅ | `src/routes/Reveal.tsx` | Reconstructs truth, lies, innocent liars, misses |
| **FR-011**: Offline Support | ✅ | `src/sw.ts` (Workbox) + Vite PWA | Precaches shell; case cached on open |
| **FR-012**: Card / Statement Presentation | ✅ | `src/components/QuestionCards.tsx`, `Transcript.tsx` | Statement text only; no badge |
| **FR-013**: Structured Accusation | ✅ | `src/components/Accusation.tsx`, `accusation.ts` | Win iff all `answerDimensions` match `truth` |
| **FR-014**: Case Outcome Scoring | ✅ | `evaluateAccusation` graded score | Partial credit unit tests |
| **FR-015**: Spoiler-Free Share | ✅ | `src/core/share.ts` | Emoji grid; regex-validated |

### Non-Functional Requirements

| Requirement | Stack Support | Verification |
|------------|--------------|-------------|
| **NFR-001**: Performance (<500ms, <100KB) | ✅ | Preact (3KB), Vite code-splitting, lazy case chunks; budgets in CI |
| **NFR-002**: Reliability | ✅ | Error boundaries; try/catch persistence; SW stale-while-revalidate |
| **NFR-003**: Accessibility | ✅ | Semantic HTML, ARIA, CSS variables, `prefers-reduced-motion` |
| **NFR-004**: Browser Support | ✅ | ES2022 target, no polyfills, Custom Properties |
| **NFR-005**: Security | ✅ | CSP `connect-src 'none'`; `validate-build.mjs` greps `eval|fetch|openai`; `truth` only in lazy chunk |
| **NFR-006**: Maintainability | ✅ | TypeScript strict; pure core logic; validator/solver as Node scripts |

---

## Verification Matrix: Invariants → Stack Alignment (Corrected Product)

| Invariant | Stack Enforcement | Test Strategy |
|-----------|-------------------|--------------|
| **INV-001**: Canonical Truth Never Exposed Before Reveal | Lazy per-case chunk; `truth` absent from initial bundle; build audit greps `culpritId`/`truth` outside case chunks | `validate-build.mjs`; DevTools + Network audit |
| **INV-002 / INV-102**: Statement Determinism (no runtime LLM) | `resolveStatement()` pure lookup; no RNG/date/session in resolution | 1000-run unit; replay integration |
| **INV-003**: No Runtime Interpretation / No LLM | CSP `connect-src 'none'`; no runtime AI dep; LLM only dev-time behind `CaseGenerator` | Build audit zero matches; Network → zero requests |
| **INV-006**: Fair Question Availability | Build-time info-value analysis; solver ≥2 viable first moves | CI fails if <2 opening leads |
| **INV-007 / INV-105**: ≥2 Solution Paths | Case-graph solver in CI | `validate:cases` non-zero on unsolvable/single-path |
| **INV-009**: State Persists | Single LocalStorage key; versioned; in-memory fallback | E2E: refresh / close / private mode |
| **INV-010**: Daily Consistency (UTC) | UTC date → case id; no server | Unit: same date → same id |
| **INV-011**: No Runtime Network | Static lazy chunks; SW cache | Lighthouse offline; Network audit |
| **INV-013**: Win/Loss Correct | `evaluateAccusation` pure; reveal shows truth | Unit: correct/partial/wrong |
| **INV-014**: No Silent Corruption | Versioned schema; try/catch | E2E: corrupted JSON, quota |
| **INV-015**: Share No Spoilers | Emoji grid only; regex-validated | Unit: no secret names |
| **INV-103**: Character Knowledge Boundaries | `truthState` ↔ `knowledge`; validator checks | Unit per resolution |
| **INV-104**: No Accidental Contradictions | Logic validation vs `knowledge` | Logic gate |
| **INV-106**: No External Knowledge | Self-contained case; solver + entertainment gate | Solver + human gate |
| **INV-107**: Deception Not Labelled | UI renders statement text only; invariant audit | UI audit for forbidden labels |
| **INV-108**: Fair Evidence Access | Solver verifies key evidence reachable | `validate:cases` |
| **INV-109**: Unrelated Secrets (innocent liars) | ≥1 innocent liar per case; solver guards | Solver guard; unit |
| **INV-110**: Historical Novelty | Fingerprint distance + banned combos | Novelty validator (CI) |
| **INV-111**: Case Completeness | Schema validation at publish | Validator rejects missing fields |
| **INV-112**: Reveal Coherence | `reveal` required; entertainment gate | Manual review of seed cases |
| **INV-113 / INV-120**: Response Determinism & Seed Stability | `weightedPick(hash(sessionSeed,…),variants)`; `sessionSeed` persisted, not runtime entropy | Reload → identical; replay → different seed |
| **INV-114**: Redundant Critical Facts | Validator + solver min-disclosure check | Reject single-route withholding |
| **INV-115**: Fact Tier Classification | Generator tags Tier A/B/C; validator enforces | Unit: untagged/single-route Tier A → reject |
| **INV-116**: Contradictions Authored-Only | UI surfaces only matched `ContradictionLink` | Unit: linked pair only |
| **INV-117**: No Pre-Reveal Feedback | Silent Theory Board; submit = first feedback | UI audit for feedback strings |
| **INV-118**: Free Investigation Never Blocks | Switch/Notebook/Theory free; accusation always available | Integration: budget exhausted → accuse still reachable |
| **INV-119**: Response Variability Bounds | Generator validator: justification + weight bands | Validator unit |

---

## Stack Risk Assessment

| Risk | Mitigation in Stack | Residual Risk |
|------|---------------------|--------------|
| Preact ecosystem smaller than React | Core logic framework-agnostic; only UI uses Preact | LOW — Preact mature, React-compatible |
| Vite PWA plugin complexity | Workbox handles edge cases; injectManifest gives control | LOW — Standard pattern |
| Signals learning curve | Minimal API (signal, computed, effect) | LOW — Simpler than Redux/Zustand |
| TypeScript strict mode friction | Enforces invariants at compile time | NONE — Benefit, not risk |
| CSS Modules + variables vs Tailwind | Zero runtime; smaller bundle | NONE — Benefit for V1 constraints |
| Case solver performance in CI | Per-case timeout; incremental validation (changed cases only) | MEDIUM — Monitor CI time |
| Cloudflare Pages limits | Free tier generous; static site fits | LOW — Monitor usage |

---

## Missing from Stack (Intentionally)

| Feature | Reason | Post-V1 Path |
|---------|--------|--------------|
| Analytics/telemetry | Privacy pillar (NFR-005); zero runtime requests | Never — privacy is a feature |
| Error tracking (Sentry) | Adds network requests; bundle size | Self-hosted if needed post-V1 |
| Feature flags | No backend; client-only | Not needed for V1 scope |
| A/B testing | No backend; single-player | Not needed |
| i18n | V1 English only (V1_SCOPE) | Add JSON locale files + switcher post-V1 |
| Dark/light theme toggle | System preference only (V1_SCOPE) | Add toggle + localStorage post-V1 |
| Sound/haptics | Out of scope (V1_SCOPE) | Add post-V1 if retention demands |
| Undo last question | Out of scope (V1_SCOPE) | Add post-V1 if playtest demands |

---

## Verification Conclusion

The stack (Preact + Vite + TypeScript strict + CSS Modules + @preact/signals + wouter + vite-plugin-pwa +
Vitest) **fully supports the corrected crime-mystery interrogation product**: deterministic client-only
case resolution, lazy per-case canonical-truth chunks, offline PWA, structured accusation, and a build-time
case solver enforcing solvability / ≥2 paths / redundancy. The stack introduces no architecture that
depends on, or implies, the rejected candidate-elimination / people-identifier model.

**No requirements or invariants conflict with the chosen stack.**

**The stack introduces no unnecessary complexity** — every technology answers "what does this do?" and
"why is it necessary?" with direct requirement traceability.

---

## Approval Status

- [x] Stack documented in STACK.md (corrected)
- [x] Requirements traceability verified (corrected product IDs)
- [x] Invariants traceability verified (corrected product IDs)
- [x] Risks assessed
- [ ] **Human approval pending** — Stack locked pending explicit approval

**Next Step**: Upon human approval, proceed to Phase 2 — Minimum Playable Core implementation against the
corrected case/interrogation model.

---

## SUPERSEDED / REJECTED PROTOTYPE (historical record — DO NOT REUSE)

The deleted prior `STACK_VERIFICATION.md` verified the old FR-001..FR-012 / INV-001..INV-015 against
`src/data/secrets/people.json`, `src/core/cardResolver.ts` (`resolveCard`), `src/core/candidateFilter.ts`
(`filterCandidates`), `hiddenSecretId`, and a "guess the remaining candidate" win. Those requirements,
invariants, file paths, and the candidate-filter/people-pool model are **rejected** and must not be
recreated. The old matrix referenced aspirational routed/state folders that did not exist in the flat
prototype; the corrected matrix above references the intended rebuild layout in `STACK.md`.
