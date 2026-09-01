# Gold-Standard Gap Register

## Ready

| Capability | Status and importance | Dependency / next phase |
| --- | --- | --- |
| Deterministic selected-question turns | Atomic turn, gating, contextual eligibility, weighted selection, discoveries, contradictions, and deductions exist; this preserves canonical truth. | Use for flagship authoring. |
| Knowledge-layer separation | `PlayerState` separates discovered facts, understood deductions, and theory fields; deductions do not write theory. | Preserve in flagship tests. |
| Deduction surfaces | Automatic and explicit player-triggered deductions are implemented. | Flagship authoring. |
| Structured accusation basics | Dimensions and deterministic canonical answer comparison exist. | Extend diagnostics later. |

## Needs validation refinement

| Capability | Status and importance | Dependency / recommended phase |
| --- | --- | --- |
| Progression-state fingerprint | Validator now uses a canonical progression projection, but flagship-scale exploration must still be measured against real new content. | Flagship validator calibration. |
| Response-branch analysis | Validator now reports existential solvability and universal safety separately; response semantics need future flagship validation. | Flagship validator calibration. |
| Critical proof validation | Validator checks `SolutionClaim.requiredEvidenceIds` for readiness, but does not yet validate claim completeness or evidence quality. | Gold-standard schema refinement. |
| Accusation readiness | Current readiness is only `accusationAvailableAtAnyTime`, not proof-gated readiness. | Accusation contract implementation. |

## Needs implementation

| Capability | Status and importance | Dependency / recommended phase |
| --- | --- | --- |
| Diagnostic accusation feedback | `diagnosticOnMismatch` exists in types but evaluation returns only correctness and score. Needed to explain theory gaps. | Accusation evaluation and diagnostics. |
| Lead lifecycle | Authored leads and `closedLeads` storage exist, but no OPEN/STRENGTHENED/WEAKENED/CLOSED behavior is evaluated. Needed for fair closure. | Lead-closure mechanics. |
| Claim-proof contract | `SolutionClaim` has evidence IDs but is not connected to accusation evaluation or validation. Needed for backward-authored proof. | Gold-standard schema/validator refinement. |
| Premature-disclosure checks | No validator checks that claims become provable too early. | Validator refinement. |

## Human playtest required

| Capability | Status and importance | Dependency / recommended phase |
| --- | --- | --- |
| Comprehension and pacing | Graph reachability cannot show whether evidence is understandable or pacing is satisfying. | Flagship human transcripts. |
| Fair misdirection | Canonical consistency can be checked mechanically, but plausibility of alternatives requires players. | Flagship human transcripts. |
| Tunnel-vision resilience | Define biased-player simulation later; validate its realism and corrective feedback with humans. | Adversarial simulation after accusation diagnostics. |
