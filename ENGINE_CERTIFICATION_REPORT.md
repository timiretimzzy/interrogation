# Engine Certification Report — Phase 4.2.11

## Scope and traceability

| Concern | Authoritative implementation | Certification coverage |
| --- | --- | --- |
| Domain/state | `src/core/types.ts` | unit and state-space fixtures |
| Turn transaction | `src/core/turnEngine.ts` | runtime/validator equivalence |
| Eligibility/selection | `src/core/responseSelector.ts` | requires, excludes, deterministic weighting |
| Deductions | `src/core/deductionEngine.ts` | automatic and claimed deductions |
| Contradictions | `src/core/contradictionEngine.ts` | surfaced and confrontation paths |
| Accusations | `src/core/accusationEngine.ts` | proof-gated, spoiler-safe diagnostics |
| State-space | `src/core/stateSpaceValidator.ts` | solvability, safety, leads, disclosure |

Runtime `cardEngine.ask` now delegates to `executeTurn`; exhaustive validation also invokes `executeTurn` for authored response branches. Eligibility is interpreted only by `responseSelector`. No adversarial-persona simulator exists yet; the older solver is a separate, limited analysis model and is not a runtime-equivalent simulator.

## Results

- Cross-system fixtures cover ordinary, gated/excluded responses, automatic and player-triggered deductions, contradictions, readiness, theory-free fingerprints, and capped exploration yielding `unknown`.
- Failed turn validation occurs before draft creation; transition tests verify source state is unchanged.
- Fingerprints retain discoveries, statements, asked character/question pairs, unlocks, contradictions, contexts, deductions, action economy, and status; they intentionally exclude theory, seed, transcript text, and ordering.
- Disclosure tests establish OR-of-AND routes; partial alternatives do not combine.
- Case validation now diagnoses duplicate IDs and dangling eligibility/disclosure references.

## Defects fixed

`cardEngine.ask` previously duplicated the turn transition, allowing runtime and validator behavior to drift. It now maps the canonical transaction result to its presentation contract. Regression coverage asserts state equivalence.

## Verdict

**Ready with documented limitations.** The engine can mechanically certify explored transition reachability, incomplete-exploration uncertainty, explicit lead/disclosure metadata, and structural references. It cannot certify prose meaning, narrative fairness, player comprehension, emotional pacing, or that all malformed semantic content is modeled.

## Remaining risks

- No canonical adversarial policy simulator or constrained property-test generator is implemented.
- State-space feasibility depends on a finite cap; incomplete runs remain unknown.
- The legacy solver duplicates portions of progression logic and must not be treated as certification authority.
- Human playtests remain mandatory before a flagship case is accepted.
