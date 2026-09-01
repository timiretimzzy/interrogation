# Phase 4.2.2 Current-Branch Audit

## Scope and verdict

This focused audit verifies the current branch against the Phase 4.2.2 atomic,
deterministic turn-transition contract. It does not assess flagship content or alter
legacy cases.

**Verdict: preserved.** Runtime gameplay and the authoritative state-space validator use
the same canonical turn transaction. No defect was found in the audited contract.

## Current implementation mapping

| Original guarantee | Current implementation | Finding |
| --- | --- | --- |
| One authoritative question transition | `executeTurn` in `src/core/turnEngine.ts:64-192` | Preserved. It validates question/target/availability/repeat/action budget; selects a response; applies records, discoveries, unlocks, contexts, contradictions, action cost, and deductions; then reports changed legal questions. |
| Runtime delegation | `cardEngine.ask` in `src/core/cardEngine.ts:56-77` calls `executeTurn` at line 63 and only maps the result to `AskResult`. `ui/store.ts:84-96` calls this wrapper. | Preserved; no runtime duplicate effect application. |
| Validation delegation | `validateCaseReachability` in `src/core/stateSpaceValidator.ts:151-266` enumerates legal eligible variants and calls `executeTurn` at line 170 with the chosen variant ID. | Preserved; validator explores every legal authored outcome through the canonical transition. |
| Explicit deduction action | `claimDeduction` in `src/core/deductionEngine.ts:77-107`; validator enumerates and calls it at `stateSpaceValidator.ts:121-123,171`. | Legitimate separate canonical action, not duplicate question-transition logic. |

There is no current adversarial-persona simulator. The old `src/core/solver.ts` is a
limited redundancy/solvability analyzer, not a runtime-equivalent validator or simulator:
it models ID effect edges independently (`solver.ts:1-14,139-177`) and does not call
`executeTurn`. This is the already documented limitation in
`ENGINE_CERTIFICATION_REPORT.md`; it is not used as certification authority for
state-space transition safety. Any future adversarial simulator must select legal actions
then invoke `executeTurn` and `claimDeduction`.

## Atomicity

`executeTurn` validates all ordinary rejection conditions and response eligibility before
creating a draft (`turnEngine.ts:71-95`). It then clones all progression-relevant mutable
collections before applying effects (`13-35,97`), changes only the draft
(`109-160`), and returns it rather than mutating input (`173-192`). A post-effect theory
firewall check also occurs before return (`187-190`). Therefore an exception never commits
a partial state: the caller retains its original state object.

Focused tests cover a forced ineligible variant and an intentionally triggered post-effect
firewall rejection, asserting unchanged facts, evidence, clues, unlocks, deductions,
available deductions, contradictions, action count, contexts, and status.

## Determinism and eligibility

`responseSelector.ts:44-58` is the sole eligibility predicate:
context requirement, then all `requires`, then all `excludes`. `eligibleVariants`
filters the entire active context before `weightedPick` is called
(`76-82,123-140`). Selection derives a stable hash from session seed, case, question,
character, and context (`132-139`); weighting walks authored array order with no runtime
RNG (`85-100`). `resolveActiveContext` is also deterministic (`65-74`).

No gameplay `Math.random`, clock, UI state, or mutable global is consulted in the
transition/selection path. Install-time seed generation in `persistence.ts` is outside
turn execution. The focused fixture confirms extremely high-weight excluded and
unsatisfied-required variants never enter competition and identical inputs replay
identically.

## Theory isolation

Normal turns clone but do not write theory or theory board (`turnEngine.ts:29-30`);
the explicit firewall rejects a changed theory board (`187-190`). Deduction evaluation
uses discovered/understood identifiers (`deductionEngine.ts:11-75`), not theory.
Question gating reads only authored discovery, statement, contradiction, and context
atoms (`gating.ts:14-63`), and accusation proof uses known discovered/understood
information (`accusationEngine.ts:60-178`).

The theory UI has an explicit free player-owned write path (`ui/store.ts:128-144`).
It is neither an input to canonical progression nor proof/deduction eligibility. The
focused test supplies arbitrary theory and theory-board contents and obtains identical
progression and legal-transition effects while preserving theory values.

## Deductions, contradictions, and action economy

After discovery and context effects, `executeTurn` recomputes contradictions
(`turnEngine.ts:131-147`) and evaluates deductions against the resulting draft
(`151-160`). Automatic deductions are added once; player-triggered deductions are added
only to availability. `claimDeduction` re-evaluates availability, rejects automatic,
unavailable, and duplicate claims, and returns a new state (`deductionEngine.ts:77-106`).
It does not write theory.

Contradictions are idempotently recomputed from authored statement/gating conditions
(`contradictionEngine.ts:24-45`) and active confrontation questions are force-unlocked
(`48-60`). The validator reaches the same state through `executeTurn`.

Only an interrogation costs an action (`actionEconomy.ts:17-31`); `executeTurn` applies
that cost to the draft after legal selection (`149`). Invalid actions fail earlier.
Validator action enumeration requires positive actions, current availability, no prior
ask of the character/question pair, and at least one eligible variant
(`stateSpaceValidator.ts:103-124`), then uses canonical execution.

## Mutation boundaries

| Class | Current mutation path |
| --- | --- |
| A. Canonical interrogation | `executeTurn`: discoveries, statements, unlocks, contexts, contradictions, action budget, automatic/available deductions. |
| B. Explicit deduction claim | `claimDeduction`: understood/available deduction sets only. |
| C. Initialization/reset | `createInitialPlayerState` and store/persistence lifecycle. |
| D. Accusation | `submitAccusation` writes submitted answers and terminal status after pure `evaluateAccusation` (`accusationEngine.ts:181-192`). |
| E. Validator-only state | State-space validator holds returned canonical states in its graph; its progression fingerprint is read-only projection. |
| Separate legacy analysis | `solver.ts` maintains a reduced `SimState`; it is not a runtime mutation path or canonical validator. |

The only intentional player-side progression-adjacent mutation outside these transitions
is the theory UI write path, which is explicitly isolated as above.

## Tests executed

New focused synthetic regression coverage:
`src/core/turnEngine.audit.test.ts`

1. Runtime `ask` and direct `executeTurn` produce equivalent state; final response fact
   triggers both post-turn automatic and available player-triggered deductions.
2. Eligibility is filtered before weighting and forced ineligible selection is atomic.
3. Post-effect firewall failure leaves all audited progression fields unchanged.
4. Identical inputs replay identically; arbitrary theory does not affect progression.
5. Player-triggered deduction is available before explicit claim, then understood exactly
   once.
6. State-space validation reaches the synthetic fact and both deduction states through
   its canonical action paths.

Executed successfully: `npx vitest run src/core/turnEngine.audit.test.ts` — 6/6 passed.
Final validation also passed: `npm test` — 89 tests across 6 files; `npm run typecheck`;
and `npm run build` (including PWA generation).

## Defects and final conclusion

No audited Phase 4.2.2 defect was found and no production code changed. The known
non-authoritative `solver.ts` duplication and absence of an adversarial simulator remain
documented limitations, not a bypass of runtime or state-space validation. The
deterministic turn architecture remains suitable as the foundation for later flagship
authoring.
