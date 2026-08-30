# Phase 4 Implementation Plan

## 4.2.1 Domain contract / foundation types
- Objective: Establish the shared TypeScript domain contract consumed by runtime gameplay and build-time validation without creating parallel models.
- Key implementation work: Extend the existing case and player-state types for facts, evidence, response eligibility, deductions, progress separation, theory ownership, solution claims, critical facts, and accusation diagnostics; preserve serialization compatibility and optional fields for legacy cases.
- Automated verification: TypeScript compile check; focused unit checks covering the updated type shapes and persistence compatibility.
- Human verification if required: Confirm that the contract matches the approved Phase 4 terminology and does not add runtime behavior.
- Completion condition: All required Phase 4 contract concepts exist in the canonical shared types, are optional where legacy cases omit them, and do not imply runtime logic.

## 4.2.2 Turn transaction
- Objective: Define the atomic turn transition that converts player input and current state into the next deterministic state.
- Key implementation work: Model the single-turn transaction boundary, state cloning, effect application ordering, and validation hooks reused by both gameplay and exhaustive validation.
- Automated verification: Unit tests for idempotence, ordering, and no-state-mutation outside the transaction boundary.
- Human verification if required: Validate that the transaction remains deterministic and game-atomic.
- Completion condition: A single state transition contract exists and is reused for all later runtime and validator logic.

## 4.2.3 Response eligibility
- Objective: Filter authored response variants using knowledge-aware eligibility before weighting and selection.
- Key implementation work: Implement `requires` and `excludes` checks against the player progress model, keeping weight as a post-filter selection factor only.
- Automated verification: Matrix tests covering required fact presence, forbidden fact presence, and weight ordering after filtering.
- Human verification if required: Review one real case to ensure no accidental suppression of valid routes.
- Completion condition: Every response candidate is evaluated against eligibility first; no weight-based bypass is allowed.

## 4.2.4 gold-vn-011 v2 retrofit
- Objective: Update the specific gold case to the approved Phase 4 contract without altering its canonical story.
- Key implementation work: Add the required case metadata, solution claims, deductions, and response eligibility fields in the existing JSON shape while preserving the original narrative.
- Automated verification: Case-load validation plus targeted tests for the retrofitted case.
- Human verification if required: Story and inference quality review for narrative integrity.
- Completion condition: The case loads cleanly under the Phase 4 schema and remains solvable under the expected approval path.

## 4.2.5 Player progress
- Objective: Separate discovery from understanding and preserve progress in a serializable shape.
- Key implementation work: Extend player state with discovered/understood progress, question history, topic tracking, and closed leads while keeping the existing runtime state shape compatible.
- Automated verification: Persistence tests and progress-model tests for state migration and serialization safety.
- Human verification if required: Confirm the distinction between discovered facts and understood deductions is visible and stable.
- Completion condition: Player progress clearly distinguishes information obtained from deductions understood without inferring theory or solution status.

## 4.2.6 Deduction engine
- Objective: Implement deterministic deduction evaluation for authored relationship rules.
- Key implementation work: Evaluate automatic deductions when prerequisites are met, evaluate player-triggered deduction availability, and enforce that automatic deductions never modify the Theory Board.
- Automated verification: Unit tests for prerequisite satisfaction, surface mode behavior, and no automatic theory mutation.
- Human verification if required: Confirm only the intended deduction is surfaced and hidden information remains protected.
- Completion condition: Deduction evaluation is deterministic, authored-only, and separated from theory ownership.

## 4.2.7 Theory Board
- Objective: Make the Theory Board explicitly player-owned and structurally constrained.
- Key implementation work: Define the board as a player-authored theory object with who/why/evidence fields; isolate it from automatic deductions and engine-populated state.
- Automated verification: Persistence and mutation tests proving theory is changed only by explicit player action.
- Human verification if required: Validate that the board remains an intentional player artifact rather than a hidden engine state.
- Completion condition: The Theory Board has no automatic population path and is editable only through explicit player intent.

## 4.2.8 Theory evaluation
- Objective: Provide a deterministic theory evaluation contract for later UI and diagnostic feedback.
- Key implementation work: Evaluate structured theories against the case truth model, returning supported/contradicted/unsupported outcomes without inventing runtime inference.
- Automated verification: Deterministic unit tests for supported, contradicted, and partially supported theories.
- Human verification if required: Sign off on the evaluation vocabulary and diagnostic granularity.
- Completion condition: Theory evaluation is deterministic and consumes the same canonical case truth model used elsewhere.

## 4.2.9 Solution / accusation flow
- Objective: Connect canonical solution claims to accusation submission and diagnostic feedback.
- Key implementation work: Bind accusation dimensions to solution claims, preserve WHO/WHAT/WHY/HOW/WHEN where applicable, and prepare the engine for mismatch diagnostics without UI work.
- Automated verification: Correct and incorrect accusation tests, plus required-dimension checks.
- Human verification if required: Review diagnostic text quality and dimension coverage for each case.
- Completion condition: The accusation flow can resolve a valid solution and provide structured mismatch feedback at the engine boundary.

## 4.2.10 Case-state validator
- Objective: Validate case integrity and contract completeness at build time.
- Key implementation work: Check required fields, referential integrity, response eligibility syntax, deduction prerequisites, solution claim alignment, and case-level consistency without runtime mutation.
- Automated verification: Existing schema validation plus new case-contract tests.
- Human verification if required: Review edge-case failures for authored-case safety.
- Completion condition: Any case that does not satisfy the domain contract is rejected before runtime use.

## 4.2.11 State-space explorer
- Objective: Explore the authored case as a deterministic state graph for validation and solvability checking.
- Key implementation work: Build the exhaustive DFS/state-space harness over case facts, response variants, and deduction availability to confirm the graph is traversable under the approved semantics.
- Automated verification: Deterministic exhaustive traversal tests with a small solver harness and known golden cases.
- Human verification if required: Check that the exploration model reflects real gameplay and not a generic search shortcut.
- Completion condition: The validator can traverse the authored decision graph completely and report reachable state outcomes.

## 4.2.12 Solvability validator
- Objective: Confirm the case remains solvable under worst-case and minimum-path logic.
- Key implementation work: Check critical fact reachability, minimum solution-path sufficiency, and redundancy across independent evidence routes without creating runtime UI obligations.
- Automated verification: Solver tests for critical fact coverage and independent path existence.
- Human verification if required: Confirm the validator is rejecting high-risk authored cases before release.
- Completion condition: Every case can reach a legitimate solution in at least the required independent evidence paths.

## 4.2.13 Premature disclosure + worst-case validation
- Objective: Guard against invalid early reveals and fragile response paths.
- Key implementation work: Add validation for premature disclosure conditions, worst-case response-path checks, and case-level failure modes that create false certainty or dead ends.
- Automated verification: Validator test cases for early reveals and extreme worst-case route exhaustion.
- Human verification if required: Review adversarial or tunnel-vision edge cases and the validation thresholds.
- Completion condition: No case passes if it can be prematurely disclosed or collapse under the worst-case route assumptions.

## 4.2.14 Property-based case testing
- Objective: Stress the case contract against broader authored variation.
- Key implementation work: Generate structural case variants or property checks around the approved domain contract to reveal missing fields, duplicate IDs, or invalid dependency patterns.
- Automated verification: Property-based tests with seeded random case generation and invariants.
- Human verification if required: Only if the generated cases reveal a real contract or story inconsistency.
- Completion condition: The domain contract is resilient to common authored-case mistakes and remains deterministic under validation.

## 4.2.15 Premature/tunnel-vision adversarial test
- Objective: Run the explicitly required adversarial test strategy against the approved Phase 4 model.
- Key implementation work: Validate the single tunnel-vision scenario that checks for premature disclosure and path brittleness without altering the case architecture or adding runtime LLM logic.
- Automated verification: One dedicated adversarial test suite covering the specified tunnel-vision behavior.
- Human verification if required: Confirm the test reflects the intended product risk and not a synthetic overload of the system.
- Completion condition: The adversarial test passes and demonstrates that the phase remains robust against premature certainty and narrow path exploitation.

## 4.2.16 Content/UI integration
- Objective: Wire the approved domain contract into authored content and the player-facing surfaces without redesigning the interface.
- Key implementation work: Integrate the canonical field names into content assembly and UI state handling while keeping the engine and validator in sync.
- Automated verification: Integration tests for authored case loading and UI-state compatibility.
- Human verification if required: Review visible narrative flow and theory board behavior.
- Completion condition: The content and UI consume the same domain contract already validated in code and content fixtures.

## 4.2.17 Human gameplay gate
- Objective: Confirm the product is ready for human play under the approved design constraints.
- Key implementation work: Run the human-facing verification gate for the fully assembled Phase 4 flow and check that the case contracts, narrative quality, and player progress model remain coherent.
- Automated verification: Final smoke tests and validator runs covering the required contract and gameplay invariants.
- Human verification if required: Full playtest for pair-of-eyes validation of deduction, theory, and accusation clarity.
- Completion condition: The case passes the contract validator, solver checks, and human gameplay gate without runtime LLM dependency or architecture drift.
