# Gold-Standard Case Contract

## Purpose and scope

This contract defines the target for new flagship and future cases. Existing cases are legacy regression fixtures, not reference designs. The runtime remains deterministic and selection-based: no runtime LLM determines truth, discovery, eligibility, deduction, state, or accusation correctness.

## 1. Target player experience

An excellent case supports orientation, multiple initial theories, active investigation, complication through contradictions, reassessment, convergence through independent evidence, one central insight, proof, and a structured accusation. These are cognitive stages, not a mandatory question order.

## 2. Canonical solution skeleton

Author backward from canonical claims: at least `WHO`, `WHAT`, `WHY`, and `HOW`; add `WHEN`, opportunity, collaborator, or cover-up where material. For each claim record its ID, truth, gameplay value, required evidence, and minimum proof threshold. A single culprit-naming clue is not sufficient: claims require synthesis.

## 3. Evidence design

Classify each authored item by its role: direct, corroborating, contradictory, contextual, fair misleading, or closure evidence. Misleading evidence must be true, plausibly support an alternative theory, and become explainable or deprioritizable. Closure evidence ends attention on a lead rather than creating perpetual noise.

## 4. Multiple routes without fake redundancy

Critical proof requirements generally need independent routes; flavor and context may have one. Central-aha prerequisites may be intentionally constrained. A standard case should provide multiple meaningful routes to accusation readiness, where independence means distinct information sources or reasoning, not repeated wording of the same clue.

## 5. Character interrogation model

For each character author: knowledge, ignorance, false beliefs, secrets, voluntary disclosures, pressure/context requirements, lies, and position-changing conditions. Major characters need coherent boundaries; minor characters may know little. No response may reveal truth the character does not know.

## 6. Questions and responses

Questions must present distinct investigative purposes—such as establishing, challenging, corroborating, confronting, testing an alibi, exploring motive, connecting evidence, or closing a lead—not paraphrased fake choices. Responses are authored canonical outcomes that reveal, corroborate, contradict, evade, redirect, admit, or close. Avoid padding.

Eligibility precedes weighting. `requires`, `excludes`, and context prevent nonsense such as obsolete lies or premature admissions. Weights provide variation and pacing only: critical progression cannot depend on a lucky weighted outcome.

## 7. Deductions and knowledge layers

Discovered information, understood deductions, and player theory are separate. An automatic deduction is passive and never writes theory. A player-triggered deduction is normally the one central, earned aha; it becomes understood only when explicitly claimed. Add deductions only when they establish a relationship beyond restating facts.

## 8. Theory, contradiction, and lead behavior

The theory board is player-owned: the engine may expose facts, evidence, deductions, and contradictions, but never auto-fills claims, evidence selections, or belief. Contradictions must change gameplay through pressure, credibility, availability, or closure. For build-time validation, an actionable question is a lead. A lead is meaningful only when a reachable outcome adds new facts, clues, evidence, unlocks, contradictions, or deductions, or explicitly redirects/closes a lead. A false lead must have an authored `ResponseVariant.leadResolution` route naming the question-lead it redirects or closes; becoming unavailable is not closure.

`leadResolution` is validator-only metadata and does not alter runtime state. Its `leadIds` are question IDs and its kind is `redirected` or `closed`. This keeps normal leads inferred from existing question/effect graph semantics while making otherwise non-semantic false-lead closure authorable.

## 9. Premature solvers and fair misdirection

Test a player who selects a plausible suspect early, seeks confirming questions, avoids contradiction, claims supporting deductions, and accuses as soon as minimally defensible. The case must leave legitimate corrective evidence accessible and explain what an incomplete theory fails to explain. Do not prevent early correct guesses.

Fair misdirection is canonically explainable and supports a reasonable wrong interpretation. The wrong theory should fail by explaining less evidence, never because the author withholds an unstated reinterpretation.

## 10. Accusation contract

Accusations are structured canonical claims, not free text. Each dimension has a prompt, canonical answer, applicable proof requirements, and mismatch diagnostics. Partial correctness must identify the unexplained dimension rather than only returning a score.

## 11. Mechanical-solvability contract

Keep these claims distinct:

- **Reachability:** required facts and actions can occur.
- **Existential solvability:** at least one legal path reaches sufficient proof.
- **Universal progression safety:** no legitimate sequence irreversibly loses all routes to required proof.
- **Proof sufficiency:** reachable information supports each canonical claim.
- **Player comprehension:** a human can reasonably connect that proof.

Information can optionally declare `disclosureRequirements` on a fact, clue, or evidence item. It is a list of alternative prerequisite routes: every ID in one inner list must be discovered/understood before the item is disclosed, and any complete inner list is sufficient. Omission imposes no disclosure-order constraint. These requirements are separate from response eligibility and permit nonlinear routes.

Current deterministic validation can prove structural reachability, lead safety, and authored disclosure ordering only when exploration completes. It cannot prove prose semantics, narrative quality, proof quality, fairness, or player comprehension.

## 12. Future validation targets

Future case acceptance progresses through: schema validation; reference integrity; truth completeness; reachability; critical-path validation; deduction prerequisites; eligibility dead ends; lead lifecycle and closure; premature disclosure; worst-case progression; adversarial player simulation; and human playtesting. Incomplete state exploration is an unknown certification, never a pass.

## 13. Anti-patterns

Prohibited: isolated culprit reveals; dialogue-first proofless design; disguised linearity; fake branching; random clue dumping; lucky-RNG critical facts; uncloseable red herrings; knowledge-boundary violations; premature secrets; author-only twists; restatement deductions; theory auto-completion; semantic accusation grading; unexplained rejection; and mechanically reachable cases without a human-understandable proof chain.

## 14. Flagship-case acceptance criteria

The first new flagship case must demonstrate non-linear interrogation; multiple meaningful routes; competing theories; character-specific knowledge; contextual eligibility; a meaningful contradiction; fair misdirection and closure; appropriate automatic deductions; at most one central player-triggered aha; independent player theory; diagnostic structured accusation; mechanical reachability validation; adversarial testing; and human-played transcripts. It will be the vertical slice; no legacy case has this status.
