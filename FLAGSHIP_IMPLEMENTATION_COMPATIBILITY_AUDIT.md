# Flagship implementation compatibility audit — The Last Broadcast

## Verdict

**CONDITIONAL GO.** The information model is implementable with explicit IDs, authored
response effects, and the constraints below. Runtime and the authoritative state-space
validator agree on question transitions. The legacy `solver.ts` is not canonical and is
not an adversarial simulator; it must not certify flagship transition safety.

## A. Current canonical execution map

| Concept | Current implementation | Authoritative file/function | Input → output | Known limitation |
| --- | --- | --- | --- | --- |
| Question selection | Button calls store action | `src/ui/CharacterPanel.tsx:60`; `src/ui/store.ts:84-96` | character/question → saved state | UI exposes only available/unasked questions. |
| Runtime transition | Thin wrapper delegates | `src/core/cardEngine.ts:56-77` `ask` | state/question → `AskResult` | Cannot select a variant at runtime. |
| Canonical turn | Validates, clones, selects, applies effects, recomputes, returns | `src/core/turnEngine.ts:64-192` `executeTurn` | state/character/question/(variant) → `TurnResult` | No semantic interpretation of prose. |
| Question gate | Initial, force-unlocked, or gate predicate | `src/core/gating.ts:37-63` | clue/evidence/statement/asked/contradiction/context → boolean | Facts and deductions are not `GatingAtom` types. |
| Context | First earned non-initial context in authored order | `src/core/responseSelector.ts:65-74` | state/contexts → context ID | No priority field; only one active context is selected. |
| Eligibility | `requiresContext`, all `requires`, no `excludes` | `src/core/responseSelector.ts:44-82` | variant/state → boolean | Requirements are a flat AND; IDs must be known. |
| Selection | Eligibility precedes deterministic weighted pick | `src/core/responseSelector.ts:84-140` | eligible variants/stable hash → variant | Different variants can have different effects unless authors prevent it. |
| Effects and discoveries | Records statement; applies question/variant clues, evidence, facts, unlocks, contexts | `src/core/turnEngine.ts:109-141` | selected response → draft state | `reveals` is split by declared clue/evidence IDs; facts require `discloses`. |
| Contradictions | Explicitly created or recomputed from references/gates; confrontations force-unlock | `src/core/contradictionEngine.ts:24-60`; `turnEngine.ts:131-147` | authored IDs/state → active IDs/questions | No text comparison or automatic dialogue. |
| Deductions | Automatic becomes understood; player-triggered becomes available | `src/core/deductionEngine.ts:34-75`; `turnEngine.ts:151-160` | known IDs → deduction state | Prerequisites are flat AND only. |
| Deduction claim | Explicit, duplicate-safe state transition | `src/core/deductionEngine.ts:77-107` | available ID → understood ID | UI currently has no claim action wired. |
| Action economy | Legal interrogation costs one; other categories are free | `src/core/actionEconomy.ts:17-31`; `turnEngine.ts:86-88,149` | state/category → actions remaining | No time progression mechanic. |
| Accusation | Per-dimension exact answer plus all proof IDs gates win | `src/core/accusationEngine.ts:60-192` | state/answers → evaluation/status | Proof requirements are flat AND; a failed accusation ends the case. |
| Diagnostics | Missing-proof message suppresses authored mismatch; mismatch is option-specific | `src/core/accusationEngine.ts:117-141` | selected wrong value + sufficient proof → message | No partial-answer recovery after submission. |
| Lead lifecycle | Validator-only reachability metadata | `src/core/types.ts:219-226`; `src/core/stateSpaceValidator.ts:199-235` | `leadResolution` edges → diagnostics | Runtime never writes `closedLeads` or closes a lead. |
| Disclosure pacing | Validator checks material disclosure against OR-of-AND routes | `src/core/stateSpaceValidator.ts:237-250` | pre-turn known IDs/routes → diagnostic | Runtime does not block premature disclosure. |
| Fingerprint | Projects future-relevant progression state | `src/core/stateSpaceValidator.ts:74-85` | state → stable JSON | Deliberately excludes transcript text/order, theory, seed, and nonce. |
| Validator reuse | Enumerates eligible authored variants, calls canonical turn and claim functions | `src/core/stateSpaceValidator.ts:103-175` | legal actions → canonical states | Default 10,000-state cap yields `unknown`. |
| Legacy solver | Separate optimistic/worst reduced simulation | `src/core/solver.ts:22-268` | `SimState`/effects → analytical result | Does **not** call `executeTurn`, omits action consumption and full state semantics. |

### Canonical status

`executeTurn` is genuinely the single canonical **question progression** transaction:
runtime delegates through `cardEngine.ask`, and the state-space validator creates each
question outcome through it (`turnEngine.audit.test.ts:85-108,182-190`). `claimDeduction`
is the separate canonical player action. The reduced legacy solver duplicates selected
effect logic and is not a canonical transition consumer. No adversarial-persona simulator
exists.

## B. Feature-to-engine compatibility matrix

| Flagship feature | Classification | Representation and constraint |
| --- | --- | --- |
| Canonical truth; character knowledge boundaries | SUPPORTED WITH AUTHORING DISCIPLINE | `truth`, character `knowledge`, and authored response IDs; knowledge metadata never reasons at runtime. |
| Prior-day rehearsal; false live assumption; temporal contradiction | SUPPORTED WITH AUTHORING DISCIPLINE | Separate claim/fact/evidence IDs, explicit contradiction, and later excluded/revised variants. |
| Priya concealment; partial truths; lies; evasions | SUPPORTED DIRECTLY | `kind`/`cooperation` metadata plus contextual variants using `requires`/`excludes`. |
| Evidence presentation; technical, forensic, witness, finance, archive routes | SUPPORTED DIRECTLY | Question/variant `reveals` for evidence and `discloses` for facts. |
| Independent corroboration; multiple discovery routes | SUPPORTED WITH AUTHORING DISCIPLINE | Multiple questions disclose the same normalized fact/evidence; validator explores alternatives. |
| Competing theories: Elias, Kells, suicide/accident, post-death framing | SUPPORTED WITH AUTHORING DISCIPLINE | Player-owned theory plus explicit evidence, contradictions, redirect questions, and closure metadata. |
| Explicit theory closure; false-lead closure; obsolete questions | PARTIALLY SUPPORTED | Validator recognizes `leadResolution`; runtime/UI does not close or annotate leads. Use revised/excluded response variants and authored successor questions. |
| Contradiction confrontations | SUPPORTED DIRECTLY | `statementRefs` or `surfaceWhen`, then `confrontationQuestionId`; no inferred contradiction. |
| Two automatic deductions | SUPPORTED DIRECTLY | `surface: 'automatic'`, explicit AND prerequisites. |
| Player-triggered central deduction; “The absent voice” | SUPPORTED DIRECTLY | `surface: 'player_triggered'`; explicit claim moves available → understood and does not alter theory. |
| Disclosure pacing; premature-solution prevention | PARTIALLY SUPPORTED | `disclosureRequirements` validates OR-of-AND routes, but runtime never blocks an incorrectly authored disclosure. |
| Lead redirection | SUPPORTED WITH AUTHORING DISCIPLINE | `leadResolution: redirected` validates only; pair it with concrete unlock/disclosure/contradiction effects. |
| Accusation dimensions; proof requirements | SUPPORTED WITH AUTHORING DISCIPLINE | Four exact-match dimensions with flat AND `proofRequirements`; normalize alternatives into common facts/deductions. |
| Spoiler-safe diagnostics | SUPPORTED DIRECTLY | Author option-specific `diagnosticOnMismatch`; it appears only after that dimension's proof is known. |
| Player-owned theory | SUPPORTED DIRECTLY | Store-only `theory`; turn firewall and gates do not consume it. |
| Solution readiness | PARTIALLY SUPPORTED | Validator readiness requires critical facts, `solutionClaims` evidence, and every player-triggered deduction; runtime accusation is available at any time. |
| Response variation safety | SUPPORTED WITH AUTHORING DISCIPLINE | Weight only variants with equivalent critical effects and closure consequences. |

## C. Critical assumption results

| Test | Result |
| --- | --- |
| C1 temporal deception | **Pass.** The new synthetic test records an initial live claim, later reveals rehearsal proof, selects only a revised variant because the old variant is excluded, and retains the original transcript (`src/core/turnEngine.audit.test.ts`). Reinterpretation is authored IDs, not semantic memory. |
| C2 independent routes | **Pass with constraint.** Alternative questions may reveal the same normalized fact; disclosure routes are OR-of-AND only in validator metadata. Deduction and accusation requirements are AND, so never encode an OR there directly. |
| C3 central aha | **Pass.** Existing audit test proves availability, explicit claim, theory isolation, and duplicate rejection (`turnEngine.audit.test.ts:168-180`). Readiness can require the claimed deduction (`stateSpaceValidator.ts:95-102`). |
| C4 competing-theory recovery | **Pass with constraint.** Exhaustive canonical validator distinguishes an existential route from an unsafe legal branch (`stateSpaceValidator.test.ts:35-45`). A false theory is player prose, so recovery must be concrete question effects and a valid state-space result. |
| C5 response variation | **Pass with constraint.** Eligibility is filtered before deterministic weighting. The validator explores every eligible variant, so any progression-divergent weighted branch must still reach readiness; safer flagship rule is identical critical effects. |
| C6 disclosure pacing | **Pass, validator-only.** Outer routes are OR and each inner route is AND; checked against pre-turn knowledge after canonical graph construction. Runtime does not enforce it. |
| C7 false-lead closure | **Pass, validator-only.** `leadResolution` marks an edge meaningful and supports closure/reachability diagnostics; it does not mutate game state or UI. |
| C8 accusation diagnostics | **Pass with constraint.** Proof gates every dimension; wrong supported answers receive only their authored option's message. Four explanatory dimensions are supported, but alternative proof paths need normalized IDs because proofs are AND. |

## D. Hidden-assumption audit

| Assumption | Result | Resolution |
| --- | --- | --- |
| Semantic NPC memory, dynamic reasoning, natural-language mutation, arbitrary dialogue | UNSUPPORTED | Encode every change as explicit context/eligibility/effect IDs. |
| Free-form evidence presentation | UNSUPPORTED | Use authored questions and `reveals`/`discloses`. |
| Time, trust, relationship systems | UNSUPPORTED | Represent only resulting facts, contexts, and questions. |
| Automatic lead closure or contradiction dialogue | UNSUPPORTED | Author closure metadata and specific confrontation/revised responses. |
| OR deduction/proof requirements | VALID WITH AUTHORING CONSTRAINT | Normalize route outputs into a common fact/deduction; requirements themselves are AND. |
| Facts and evidence interchangeable | UNSUPPORTED | Facts use `discloses`; evidence/clues use `reveals`; only recognized state IDs satisfy each contract. |
| Validator understands prose/player theory | UNSUPPORTED | It evaluates IDs and effects only; theory is deliberately excluded. |
| Transcript history available as a gate | VALID WITH AUTHORING CONSTRAINT | Use recorded statement IDs or `questionAsked`; fingerprints can collapse text/order safely because transitions do not consume them. |
| Unlimited questions | UNSUPPORTED | Every question costs one action and repeat asks per character/question are rejected. |
| More expressive context selection | VALID WITH AUTHORING CONSTRAINT | Contexts are monotonic; first earned non-initial context wins. Avoid simultaneously-earned competing contexts. |

## E. Historical integrity check

| Historical claim | Current code confirms? | Test exists? | Drift |
| --- | --- | --- | --- |
| 4.2.2 atomic deterministic turn | Yes | `turnEngine.audit.test.ts` | None |
| 4.2.3 canonical eligibility | Yes | `engine.test.ts`, audit test | None |
| 4.2.4 automatic/claimed deductions | Yes | `engine.test.ts`, audit test | None |
| 4.2.7 existential vs universal semantics | Yes | `stateSpaceValidator.test.ts` | None |
| 4.2.8 proof-gated diagnostics | Yes | `engine.test.ts:301-362` | None |
| 4.2.9 lead/disclosure validation | Yes | `stateSpaceValidator.test.ts:100-177` | None |
| 4.2.10 adversarial simulation | No canonical simulator | No | Historical aspiration remains unimplemented; legacy solver is reduced analysis. |
| 4.2.11 runtime canonical reuse/legacy retirement | Runtime and validator: yes | audit test | Solver remains intentionally noncanonical; legacy cases were not used here. |

## F. Rules Phase 4.3.2 must follow

1. Map every question to explicit effects; prose never creates progression.
2. Use `requires`/`excludes` and one unambiguous earned context for changing accounts.
3. Keep all weighted variants equivalent for required facts, evidence, unlocks, contradictions, and lead closure.
4. Normalize alternative routes into shared facts/evidence/deductions before using AND-only deductions or accusation proof requirements.
5. Encode pacing in `disclosureRequirements` and also gate the disclosing response; validator detection is not runtime prevention.
6. Give each false lead an explicit productive effect or `leadResolution`, plus a concrete redirect/closure question.
7. Keep theory out of gates, deduction prerequisites, and proof requirements.
8. Make D-01 and D-02 automatic; make D-03 explicitly claimable and include it in solution readiness only if intended.
9. Treat all interrogation cards, including confrontations, as action-costing; derive the budget from the approved question graph.
10. Keep the four accusation dimensions exact-match, non-spoiling, and flat-AND proof-gated.

## G. Open-question decisions

| Open question | Decision |
| --- | --- |
| Final accusation labels | Use **Who caused Mara’s death?**, **Why was Mara killed?**, **How was Mara poisoned?**, and **How was the apparent timeline falsified?** They describe explanatory dimensions without revealing answers. |
| Action budget | Defer the exact number until Phase 4.3.2 counts mandatory and recovery cards; set it to the longest validated safe route plus two recovery actions. The engine makes any premature fixed number unsafe. |
| Tincture corroboration scope | Keep monkshood/aconitine as forensic corroboration, not a fifth required accusation branch. Require targeted delivery evidence, not provenance of the source container. |
| Clarity of two arguments | Keep real 8:52 argument and prior-day rehearsal as distinct statement/evidence IDs and test them through separate questions; do not rely on dialogue wording alone. |

## Engine gaps

No blocking runtime engine gap. Non-blocking limitations are: no canonical adversarial-persona simulator; legacy `solver.ts` duplicates a reduced transition model; lead closure and disclosure requirements are validator metadata rather than runtime behavior; and no runtime readiness UI/claim-deduction UI exists.

## Final decision

**CONDITIONAL GO** for **PHASE 4.3.2 — FLAGSHIP CASE INTERROGATION AND QUESTION ARCHITECTURE**. That phase may design character structure, categories, gates, evidence presentations, confrontations, lead redirection/closure, aha setup, and route convergence. It must not write production dialogue or JSON until architecture approval.
