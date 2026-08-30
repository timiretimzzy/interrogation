# Phase 4 Orientation Report

## What the existing project currently does
The project already has a working deterministic crime-investigation runtime centered on authored case data, question cards, response variants, evidence disclosure, contradiction surfacing, accusation evaluation, and reveal output. It stores canonical case truth separately from the player-facing state and uses deterministic session seeding for stable per-player response selection. The current runtime emphasizes authored narrative flows, case validation, and local state persistence without runtime LLM calls.

## What Phase 4 is changing
Phase 4 changes the runtime from a flat question-and-answer flow into a structured investigation model in which a player must distinguish between discovered facts, understood deductions, explicit theory ownership, and the final solution claim. It adds a knowledge-aware response contract, authored deduction rules, a player-owned Theory Board, diagnostic accusation mismatch feedback, and stronger validation for critical facts, minimum solution paths, and premature disclosure risk.

## What existing functionality will be reused
- The canonical case model and deterministic question flow already present in the runtime.
- The existing authored response-variant model and weighted selection pipeline.
- The existing player state and persistence model for session-scoped progress.
- The already-established case validation and solver style for build-time safety checks.
- The current accusation structure as the base for solution-dimensional evaluation.
- The existing contradiction and evidence systems as a foundation for deduction and theory support.

## What will be added
- A Phase 4-aware response-eligibility contract using `requires` and `excludes` checks.
- A canonical deduction model with automatic and player-triggered surfaces.
- A distinct `discovered` vs `understood` progress model.
- A player-owned Theory Board separate from automatic deductions.
- Solution claims and minimum-solution-path metadata for case-level and runtime guidance.
- Diagnostic mismatch support on accusation dimensions.
- Exhaustive state-space and worst-case validation checks for final case safety.

## What will be modified
- The shared types in the game domain contract to include Phase 4 concepts without introducing parallel models.
- The player-state representation so it can track discovery, understanding, and explicit theory ownership.
- The accusation dimension model to carry authored mismatch diagnostics.
- The case JSON contract to cover critical facts, minimum solution paths, solution claims, and deduction metadata.
- Validation routines to include structural, solvability, and premature-disclosure checks.

## What will remain untouched
- Runtime gameplay remains deterministic and authored; no runtime LLM generation is introduced.
- The project remains case-driven rather than generator-driven.
- The canonical world truth stays authorial and case-controlled.
- Existing gameplay mechanics not part of Phase 4 remain intact unless deliberately extended by the approved contract.
- No unrelated gameplay systems or UI flows are redesigned as part of this phase.

## The locked runtime architecture
The locked runtime architecture is: authored case data, deterministic question selection, knowledge-aware response eligibility, state transitions driven by a single atomic turn boundary, discovered vs understood progress tracking, authored deductions, explicit Theory Board ownership, and accusation evaluation against canonical solution claims. All runtime logic is deterministic and pure over the case and player state; no runtime LLM path is permitted.

## The locked build-time validator architecture
The locked build-time validator architecture is: schema consistency checks, referential integrity validation, critical-fact and minimum-solution-path sufficiency checks, exhaustive state-space traversals, worst-case response-path evaluation, premature disclosure checks, and adversarial tunnel-vision validation. The validator exists to reject unsafe or under-specified cases before they are accepted into the runtime.

## Known risks
- Overrestricting response eligibility could accidentally make a valid route unreachable.
- Automatic deduction logic could accidentally mutate player-owned theory state if not strictly separated.
- A case can appear solvable but still fail under worst-case response path assumptions.
- Diagnostics can become too shallow if they merely reduce to a score instead of authored mismatch guidance.
- The project must preserve backward compatibility for existing cases while adding optional Phase 4 metadata.

## Explicit non-goals
- Runtime LLM calls.
- Free-text interrogation or open-ended AI dialogue.
- Redesigning the project architecture or case pipeline.
- Building a second parallel representation of the same domain model.
- Implementing UI or gameplay features beyond the approved Phase 4 contract.
- Retrofitting every case in the same task; compatibility remains optional and incremental.

## Implementation sequence
1. Establish the shared domain contract and types.
2. Define the atomic turn transaction.
3. Implement response eligibility and player progress.
4. Add deduction and Theory Board support.
5. Connect theory and accusation evaluation.
6. Validate case state, state-space reachability, and solution sufficiency.
7. Run premature disclosure, worst-case, and adversarial tunnel-vision checks.
8. Integrate the content and UI at the approved contract boundary.
9. Complete the human gameplay gate before broader rollout.

## The single next implementation task
The single next implementation task is 4.2.1: Domain contract / foundation types.

This document describes the Phase 4 direction only. It does not claim that the runtime or validation logic has already been implemented.
