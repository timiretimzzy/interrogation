# Response Variability Model — The Interrogation

**Status:** PRODUCT MECHANICS LOCK (design only). No implementation.
**Companion to:** `PRODUCT_MECHANICS_LOCK.md`, `GAMEPLAY_SIMULATION.md`.
**Source of authority:** User directive "PRODUCT MECHANICS LOCK — DO NOT START PHASE 2 REBUILD YET."

---

## 0. The one-sentence principle

> The **crime is shared and fixed**; the **way each character answers is variable per player**, but
> every answer is drawn from a **pre-generated, validated set**, chosen by a **deterministic
> per-session seed** — never by runtime randomness, never by a live LLM.

This resolves the apparent tension in the directive: different players can have genuinely *different*
interrogation experiences of the same case, while the case remains **fair, solvable, and
deterministic**.

---

## 1. What is fixed vs. what varies

| Aspect | Fixed for all players (canonical) | Variable per player (response layer) |
|--------|-----------------------------------|--------------------------------------|
| The crime, victim, location, timeline | ✅ | — |
| The roster and each character's `knowledge` | ✅ | — |
| The culprit, motive, method | ✅ | — |
| Physical evidence and its canonical meaning | ✅ | — |
| Relationships & secrets | ✅ | — |
| Which questions exist and their unlock graph | ✅ | — |
| Which contradictions are *possible* | ✅ | — |
| The exact words a character says to a given question | — | ✅ (one of N pre-authored variants) |
| Tone, cooperation, defensiveness, evasiveness | — | ✅ (per variant) |
| Whether a *particular* lie/evasion is surfaced this run | — | ✅ (weighted, seeded) |

**Decisions in this section:**
- "Case is global; responses vary per player" — **APPROVED FROM USER DIRECTIVE.**
- "Canonical truth never changes across players or variants" — **APPROVED FROM USER DIRECTIVE** (also DEC-015 / INV-101).

---

## 2. Why this is NOT random (and must not be)

The directive explicitly rejects: *"random answer generator → player gets unlucky → case becomes
unsolvable."* Two hard rules follow:

### Rule A — Variants are authored, not invented
The generator (LLM dev-time author or hand-author) must emit, for each `(question × character ×
context)`, the **full set** of plausible responses. Runtime never composes an answer; it only *selects*
from this set. No sentence is produced at play time (INV-003 / DEC-006).

### Rule B — Runtime selection is deterministic per session
The selected variant is a pure function of `(sessionSeed, caseId, questionId, characterId, contextId)`.
There is **no `Math.random`, no clock, no entropy** in the selection. The same inputs always yield the
same variant.

**Decision:** "Runtime must select only from validated pre-generated possibilities; prefer deterministic
per-player/session seeded selection over true runtime randomness" — **APPROVED FROM USER DIRECTIVE.** The
specific algorithm in §4 is **RECOMMENDED — AWAITING APPROVAL**.

---

## 3. The response-variability architecture (5 layers)

```
Layer 1  Canonical Fact
            └─ what actually happened (fixed; INV-101)
Layer 2  Character Knowledge
            └─ what THIS character genuinely knows / believes / is hiding (fixed)
Layer 3  Character Intent
            └─ willingness to cooperate, protect, lie, evade, given their secrets/fears/loyalties
               (fixed per character; drives which variant *types* are authored)
Layer 4  Available Response Variants
            └─ the pre-generated set for (question × character × context):
               truthful / partial / misleading / evasive / deflecting / revised-after-confrontation
               (authored; each tagged with internal truthState + weight + disclosure)
Layer 5  Runtime Selection
            └─ deterministic seeded pick from Layer 4 (NO randomness, NO LLM)
```

Layers 1–4 are **authored once at generation time** (static JSON). Only Layer 5 runs at play time, and
it is a deterministic lookup.

---

## 4. Recommended selection algorithm (RECOMMENDED — AWAITING APPROVAL)

### 4.1 Session seed (stable across refresh)
```
sessionSeed = hash(deviceId, caseId, attemptNonce)
```
- `deviceId` — a stable per-install id (existing persistence layer).
- `attemptNonce` — increments only on a **deliberate restart** (quit to menu → start again). A mere
  **refresh preserves** `sessionSeed`, so responses do **not** reroll. This satisfies the directive's
  "the same player cannot exploit refreshes to reroll responses."
- Stored in `PlayerState`; regenerated only on new attempt.

### 4.2 Variant pick (pure, weighted, deterministic)
```
questionSeed = hash(sessionSeed, caseId, questionId, characterId, contextId)
variants     = resolution.contexts[contextId].variants   // pre-generated
cumulative   = prefixSum(variants.map(v => v.weight))
r            = questionSeed mod cumulative.last          // ∈ [0, cumulative.last)
index        = first i where cumulative[i] > r
selected     = variants[index]
```
No floating point needed; integer hash + integer mod. Identical on every device for the same seed.

### 4.3 Why weighted, not uniform
Truthful/cooperative variants carry **high weight** (common). Evasions/deflections **medium**. Lies
**low** (rare; see §6). Presentation variety comes mostly from *tone/cooperation*, not from whether the
critical fact leaks — so the game feels different without becoming unfair.

---

## 5. Recommended schema extension (RECOMMENDED — AWAITING APPROVAL)

Extends the `CaseQuestion` / `Resolution` from `CRIME_GAME_ARCHITECTURE_PROPOSAL.md §5`.

```ts
type ContextId =
  | 'initial'
  | `after_contradiction_${ContradictionId}`
  | `after_clue_${ClueId}`
  | `after_question_${QuestionId}`;

type Cooperation = 'open' | 'guarded' | 'evasive' | 'deflecting' | 'hostile' | 'revised';

interface ResponseVariant {
  id: string;                 // stable, e.g. "q12_julian_vA"
  statement: string;          // dialogue shown to player — NO labels, NO truthState text
  truthState: TruthState;     // INTERNAL ONLY (TRUE|FALSE|PARTIALLY_TRUE|MISLEADING|UNKNOWN|EVASIVE|CONTRADICTED)
  cooperation: Cooperation;    // internal presentation hint (portrait/pace); never a "lying" badge
  discloses?: VariantDisclosure[];  // what canonical info this variant conveys
  reveals?: ClueId[];         // notebook additions
  unlocks?: QuestionId[];     // follow-up / confrontation cards
  createsContradiction?: ContradictionId;
  weight: number;             // generation-assigned; truthful high, lie low
}

interface VariantDisclosure {
  factId: string;             // canonical Fact id (see architecture proposal §4)
  clarity: 'full' | 'partial' | 'none';
}

interface ResolutionContext {
  context: ContextId;         // which situation this block applies in
  variants: ResponseVariant[]; // >=1; selection seeded by session
}

interface QuestionResolution {
  forCharacter: CharacterId;
  contexts: ResolutionContext[];  // at least one with context === 'initial'
}

// Attached to CaseQuestion (replaces the single Resolution[]):
interface CaseQuestion {
  id: QuestionId;
  text: string;
  category: 'opening'|'followup'|'evidence'|'contradiction'|'repeattopic'|'pressure';
  scope: CharacterId | Role | 'any';
  availability: { kind: 'initial' } | { kind: 'unlocked'; when: UnlockCondition };
  resolutions: QuestionResolution[];  // one per relevant character
}
```

**Note:** `category` uses the six-class taxonomy from the directive (§4), replacing the prior
eight-class set. **APPROVED FROM USER DIRECTIVE** (taxonomy). The schema *shape* is RECOMMENDED.

---

## 6. Lies are uncommon and always reasoned (APPROVED FROM USER DIRECTIVE)

- A `MISLEADING`/`FALSE`-from-intent (`DECEPTIVE`) variant may exist **only** for a character whose
  `knowledge` contains a corresponding `lies` or `secrets` entry. This enforces INV-104 (no accidental
  contradictions) and the directive's "a lie must have a reason."
- Such variants carry **low weight** (rarely the selected one) and are **always redundancy-covered**
  (see §7).
- The default, high-weight variants are truthful, incomplete, or evasive — not deceptive.

---

## 7. Fairness invariants (the crux) — RECOMMENDED — AWAITING APPROVAL

> **INVARIANT F (Redundant Critical Facts).** For every canonical fact `F` required to reach a correct
> accusation, the case must satisfy ONE of:
> - **(a) Redundancy:** `F` is disclosed (full or partial) by at least one variant on **each of ≥2
>   independent** question/character routes; **or**
> - **(b) Single-route safety:** if `F` has exactly one route `R`, then **every** variant in `R`'s
>   variant set discloses `F` (no variant withholds it).
>
> Furthermore, for any character who **lies** about `F`, the lie must sit on a route that also has an
> independent truthful route (so the lie can never make the case unsolvable).

This is the precise, testable statement of the directive's "important information must have redundancy /
no single answer can make a case unsolvable." It will become a **build-gate validator** (companion to
INV-007) and a **solver input**: the solver verifies solvability under the *worst-case* (minimum-
disclosure) variant selection while requiring the redundancy graph to still yield ≥2 paths.

Proposed new invariants to add to `INVARIANTS.md`:
- **INV-113 (Response Determinism Within Session):** Same `(sessionSeed, question, character, context)`
  → identical variant, across refresh and device. No runtime RNG/LLM in selection.
- **INV-114 (Redundant Critical Facts):** as INVARIANT F above.

---

## 8. Repeat questions and post-confrontation changes

### 8.1 Same question, different character (repeat-topic)
"Where was Amelia at 9?" asked of Victor vs. Sarah are **different `CaseQuestion`s** (different
`scope`/`forCharacter`), each with its own variant set and own seed. This is how the player "asks the
same subject of several people" — the engine treats each as an independent, deterministic pick. No new
mechanic required; it falls out of §4.2.

### 8.2 Same question, same character, re-asked in same context
Returns the **same** variant (seed unchanged). Realistic: a person doesn't spontaneously change their
story without new pressure.

### 8.3 Same question after confrontation (context switch)
Once a contradiction is flagged or a confrontation card played, the character enters a new `ContextId`
(`after_contradiction_<CId>` / `after_clue_<ClueId>`). A **different `ResolutionContext`** (the
"revised story" variants) is selected. This is how "their behavior changes" and "new information
emerges" happen — deterministically, because `contextId` is part of the seed.

**Decision:** "A character can change their answer after confrontation, via a context switch (not a
reroll)" — **APPROVED FROM USER DIRECTIVE** (the mechanism is RECOMMENDED).

---

## 9. No refresh reroll — guarantee

Because `sessionSeed` lives in `PlayerState` (LocalStorage, INV-009) and is **not** derived from clock
or `Math.random` at play time, refreshing the page reproduces the exact same variant selections. A
player who reloads to "see if the answer changes" gets the same answer. Only a deliberate *restart* (new
`attemptNonce`) yields a fresh seed — which is legitimate replay variety, not an exploit, since it
forfeits progress.

**Detected by:** a unit test that serializes `PlayerState`, reloads, and asserts identical transcripts.

---

## 10. Generation responsibilities (dev-time only)

The generator must, per `(question × character × context)`:
1. Produce **≥2 variants** where the directive implies variability (otherwise a single variant is fine
   for trivial facts).
2. Tag each with `truthState`, `cooperation`, `discloses[]`, `weight`.
3. Ensure deceptive variants reference a `knowledge.lies`/`secrets` reason (§6).
4. Ensure INVARIANT F holds for every required fact (§7) — the validator rejects otherwise.
5. Author the `after_*` revised-story contexts for confrontation-enabled questions.

Multi-variant generation is more expensive but bounded (a few variants per question). See
`CRIME_GAME_ARCHITECTURE_PROPOSAL.md §11` — this adds a "Stage 8: Multiple Response Variant Generation"
step.

---

## 11. Solver implication

The retargeted `solver.ts` (architecture proposal §14) simulates investigation under the
**least-cooperative-but-fair** variant selection (minimum disclosure per question, subject to INVARIANT
F) and confirms:
- a correct accusation is still reachable,
- ≥2 independent paths survive,
- key evidence is still accessible within budget,
- no single lie implies guilt (INV-109).

If the worst-case variant set breaks solvability, the case is rejected and the generator is asked to
add a redundant route or raise a withheld variant's disclosure.

---

## 12. Decision summary

| Decision | Status |
|----------|--------|
| Case global; responses vary per player | **APPROVED FROM USER DIRECTIVE** |
| Canonical truth fixed across players/variants | **APPROVED FROM USER DIRECTIVE** |
| Variants pre-generated; runtime selects only | **APPROVED FROM USER DIRECTIVE** |
| Deterministic per-session seeded selection (no runtime RNG/LLM) | **APPROVED FROM USER DIRECTIVE** (algorithm RECOMMENDED) |
| Redundancy / no single answer blocks solvability | **APPROVED FROM USER DIRECTIVE** (formalized as INV-114, RECOMMENDED) |
| Lies uncommon; each lie reasoned | **APPROVED FROM USER DIRECTIVE** |
| Six-class question taxonomy | **APPROVED FROM USER DIRECTIVE** |
| Context-switch (not reroll) for post-confrontation answers | **APPROVED FROM USER DIRECTIVE** (mechanism RECOMMENDED) |
| Hash-seeded weighted selection algorithm (§4) | **RECOMMENDED — AWAITING APPROVAL** |
| Variant/context schema extension (§5) | **RECOMMENDED — AWAITING APPROVAL** |
| INV-113 / INV-114 additions | **RECOMMENDED — AWAITING APPROVAL** |
