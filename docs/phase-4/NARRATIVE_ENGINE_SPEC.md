# Narrative Engine Specification

## Objective
The Phase 4 narrative engine is a deterministic investigation model built over authored case data. It supports selection-based questioning, facts/evidence, contradictions, deductions, Theory Board ownership, and solution evaluation without runtime LLM calls or hidden branching.

## Core architecture
- Selection-based authored-question interaction is the primary loop.
- Runtime gameplay is deterministic and pure over case data and player state.
- Authored response variants are the only source of dialogue; they are selected deterministically and never generated at runtime.
- `requires` / `excludes` are applied before weighting; weight never bypasses eligibility.
- Canonical world truth is authored and fixed per case; the runtime may only reveal and evaluate it.
- Facts and evidence are distinct: facts are canonical case truths; evidence is discoverable support material for the player.
- Contradictions are authored relationships that activate under deterministic conditions.
- Curated deductions may be automatic or player-triggered.
- Automatic deductions may affect `understood` but must never mutate the Theory Board.
- The Theory Board is a player-owned, explicit theory object.
- Solution claims and accusation dimensions represent the canonical resolution the player must establish.
- The runtime and build-time validator consume the same domain contract.

## 1. Selection-based authored-question interaction
The player selects a question card. The game resolves the active character and context, filters the eligible response variants, selects a deterministic variant, and applies any authored effects. The design remains authored and inspectable, with no free-text runtime generation.

## 2. Deterministic runtime gameplay
The runtime must be deterministic by construction:
- same case + same session seed = same selection path
- no runtime randomness for truth or narrative delivery
- no runtime LLM calls unless free-text input becomes an approved requirement
- atomic turn transactions for consistent state transitions
- case-authoring effects are the only source of world-state change

## 3. Authored response variants
Each response variant remains authored and pre-written. The approved contract includes:
- `id`
- `text`
- `weight`
- `requires`
- `excludes`
- type classification such as truth, partial truth, evasive, lie, or admission

Rules:
- `requires` checks whether referenced IDs are already present in the relevant player state.
- `excludes` makes a response ineligible if any referenced ID has already been discovered.
- Weight is applied only after eligibility filtering.
- Response type is descriptive metadata only; it does not determine canonical truth.

## 4. Canonical world truth, facts, and evidence
The world model is the authored fact graph and canonical truth description. Facts are the canonical information of the case; evidence is what the player can discover and reason with. Evidence may come from testimony, records, observations, objects, timeline information, or case-specific sources.

The engine never rewrites canonical truth. It only reveals relevant evidence, records discovery, and evaluates the player’s deductions and theory.

## 5. Contradictions and deductions
Contradictions and deductions are authored relationships between facts and statements:
- Contradictions activate under deterministic conditions and can surface when the relevant state is satisfied.
- Deductions are curated logical connections that may be automatic or player-triggered.

Automatic deductions:
- trigger when all prerequisites are satisfied
- make the deduction understood
- may surface a passive notification
- must never populate or mutate the Theory Board

Player-triggered deductions:
- become available when prerequisites are satisfied
- require explicit player activation
- add to `understood` only when activated
- represent the intentional “aha” moment

At most one player-triggered deduction is expected per case; the case-level validator enforces that rule.

## 6. Discovered vs understood vs Theory Board
The distinctions are intentional:
- `discovered`: information the player has obtained
- `understood`: deductions or conclusions the engine recognizes as satisfied
- `TheoryBoard`: explicit player theory recorded through player action only

Discovery does not imply understanding. Understanding does not imply theory. The engine may evaluate a theory but cannot silently author one.

## 7. Explicit player theory
The Theory Board is the player-owned theory record. In the approved contract it carries:
- `who`
- `why`
- `citedEvidence`

The board can only change through explicit player action. Automatic deductions never populate `who`, `why`, evidence, or suggest a theory into the board.

## 8. Solution claims and accusation dimensions
The case may carry explicit solution claims per dimension, including WHO, WHAT, WHY, HOW, and WHEN where applicable. The accusation model can also carry authored diagnostic text keyed to incorrect option IDs so mismatch feedback explains what the theory failed to account for rather than only scoring the answer.

## 9. Critical facts and minimum solution paths
The case definition supports:
- `criticalFactIds`
- `minimumSolutionPaths`
- `solutionClaims`

A minimum solution path represents sufficient evidence for a legitimate solution; it is not a required dialogue order. Players may discover information in different sequences, but the path represents evidence sufficiency rather than script sequence.

## 10. Diagnostic accusation feedback
Diagnostic feedback is authored and deterministic. It is keyed by incorrect option ID and written to explain the missing or contradicted part of the player’s theory. This is a structured explanation layer above raw score comparison.

## 11. Atomic turn transaction and deterministic state updates
Every turn is one atomic transaction:
1. resolve the question and variant
2. apply eligibility filtering
3. apply all authored effects
4. update discovered and understood progress
5. surface contradictions or deductions if triggered
6. finalize deterministic state for the next turn

No partial turn is allowed. The resulting state must be internally consistent before the turn is considered complete.

## 12. Build-time validation and exhaustive validation
The case must pass build-time validation before runtime use. Required checks include:
- structure and referential integrity
- response eligibility consistency
- deduction prerequisite integrity
- solution claim alignment
- critical fact reachability
- minimum solution path sufficiency
- premature disclosure checks
- worst-case response-path checks
- adversarial tunnel-vision validation

The validator is not gameplay code; it is a safety gate for authored cases.

## 13. Premature disclosure checks and adversarial strategy
The validator must reject cases that prematurely disclose critical information or create brittle, single-path logic. The specified adversarial strategy is a tunnel-vision test to simulate a narrow, least-informative path and verify the case remains valid, non-collapse-prone, and not prematurely solved.

Worst-case path checks ensure that even under the weakest route, the case remains solvable and does not rely on lucky fact order.

## 14. Prohibited runtime LLM behavior
The project explicitly forbids runtime LLM calls. All dialogue remains authored. The engine decides truth, eligibility, and transitions; it does not delegate them to a live model. Free-text input remains out of scope unless a separate approved requirement is introduced.

## 15. Critical invariants
- automatic deductions never auto-fill or mutate the Theory Board
- Theory Board remains player-owned and explicit
- discovered and understood remain distinct
- canonical truth is not mutated at runtime
- runtime logic never creates hidden branching or hidden truth updates
- the validator and runtime share the same domain contract

## 16. Phase 4 implementation boundary
This specification defines the approved Phase 4 contract. It does not implement runtime code or validator logic; it governs the later TypeScript and validation milestones.
