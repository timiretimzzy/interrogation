# Crime Game Architecture Proposal — The Interrogation

**Status:** PRODUCT CORRECTION UNDER REVIEW
**Companion to:** `PRODUCT_CORRECTION_REPORT.md`
**Scope:** Architecture only. No implementation in this phase.

This document proposes the corrected architecture for a **daily interactive crime-mystery interrogation
game**. It replaces the rejected "hidden-secret identifier" architecture. Every section states the
decision, alternatives considered, why it is recommended, complexity cost, and failure modes.

---

## 0. North Star

> A short, replayable daily crime mystery where players interrogate a network of believable
> characters, uncover lies and contradictions, construct their own understanding of events, and
> experience a satisfying "I figured it out" reveal.

If a feature makes the mystery less interesting to chase the cleaner architecture, it is rejected.

---

## 1. Single Case Lifecycle (generation → accusation)

```
Historical Cases (memory index)
        ↓ novelty analysis
Case constraints (underused structures)
        ↓
LLM generation (dev-time only, behind CaseGenerator adapter)
        ↓
Structured Case (strict JSON)
        ↓ schema + logic + contradiction + solver + similarity validation
        ↓ human / automated quality gate
Published Daily Case (static JSON, immutable)
        ↓
Deterministic gameplay (resolveStatement pure lookup)
        ↓
Player builds knowledge graph (statements, clues, contradictions, unlocks)
        ↓
Structured accusation (culprit + what + why + evidence)
        ↓
Reveal (reconstructs truth)
```

The LLM authors the world. The deterministic engine runs it. These responsibilities never mix.

---

## 2. Case Schema (the source of truth)

**Decision:** One `CaseFile` object is the atomic unit. It carries the canonical truth, the roster,
interrogation cards, contradiction links, clues, and the accusation definition. Generated once,
immutable, shipped as static JSON.

**Alternatives considered:**
- A) Relational DB of entities + join tables — rejected: requires a backend; violates client-only
  invariant; overkill for authored content.
- B) Procedural runtime generation — rejected: violates INV (no runtime LLM), destroys determinism.

**Why recommended:** single static artifact is cacheable, offline, versioned, and trivially
validated.

**Complexity cost:** Low. **Failure modes:** large file size (mitigated by lazy per-case chunk +
initial index only).

```ts
type Genre =
  | 'murder' | 'heist' | 'missing_person' | 'fraud' | 'sabotage'
  | 'blackmail' | 'suspicious_death' | 'locked_room' | 'disappearance' | 'conspiracy';

type TruthState =
  | 'TRUE' | 'FALSE' | 'PARTIALLY_TRUE' | 'MISLEADING'
  | 'UNKNOWN' | 'EVASIVE' | 'CONTRADICTED';

type Role =
  | 'suspect' | 'witness' | 'victim' | 'investigator'
  | 'associate' | 'employee' | 'bystander';

type Personality =
  | 'defensive' | 'charming' | 'nervous' | 'cold'
  | 'manipulative' | 'grieving' | 'cooperative' | 'overconfident';

interface AnswerDimension {
  key: 'culprit' | 'what' | 'motive' | 'evidence';
  from: 'roster' | 'explanationPool' | 'motivePool' | 'evidencePool';
}

interface CaseFile {
  id: string;                 // stable; daily cases use date-derived id
  date?: string;              // for daily mapping (INV-010)
  title: string;              // e.g. "The Vanishing at Blackwood Gallery"
  genre: Genre;              // drives novelty + tone
  tone: string;              // 'tense' | 'clever' | 'dark' | ...
  setting: string;           // 'art_gallery' | 'train' | 'hotel' ... (novelty key)
  difficulty: 'easy' | 'medium' | 'hard';  // derived metric, not cosmetic label
  briefing: string;          // 2–6 sentences
  roster: CharacterId[];      // 4–7 interrogatable characters
  answerDimensions: AnswerDimension[];  // culprit + what + motive (+optional evidence)
  truth: TruthModel;          // canonical solution (never shown in-game)
  characters: Record<CharacterId, Character>;
  questions: CaseQuestion[];  // interrogation cards
  contradictions: ContradictionLink[];
  clues: ClueDef[];           // notebook facts
  leads: LeadDef[];
  evidence: EvidenceDef[];
  interrogationBudget: number; // soft cap ~12 actions (switching/board free)
  solutionPaths: SolutionPath[];     // ≥2 independent
  redHerrings: RedHerringNote[];     // every misleading detail justified
  reveal: RevealScript;       // satisfying debrief
}
```

Every field is justified: `truth` is the fixed world; `characters` carry knowledge separate from
statements; `questions` are authored interrogations; `contradictions` are the deduction hooks;
`answerDimensions` make the accusation multidimensional; `difficulty` is computed (see §14), not
asserted.

---

## 3. Character Schema (knowledge ≠ statements)

**Decision:** Split `knowledge` (what the character genuinely knows/believes) from `statements`
(what they tell the player). This is mandatory to support "honest-but-wrong" (FALSE/MISLEADING from a
mistaken belief, not a lie) and "I don't know" (UNKNOWN).

**Alternatives considered:**
- Single `beliefs[]` field — rejected: cannot distinguish "lies" from "mistaken" from "unknown".
- Per-question truth baked only into the answer — rejected: loses the knowledge boundary used to
  validate consistency.

**Why recommended:** the directive's knowledge-boundary model (§8) requires the split.

**Complexity cost:** Medium (more authoring). **Failure modes:** author accidentally contradicts a
character's own knowledge — caught by INV "No Accidental Contradictions" validation.

```ts
interface TruthModel {
  culpritId: CharacterId;
  what: string;             // from explanationPool
  motive: string;           // from motivePool
  timeline: TimelineEvent[];
  keyEvents: string[];
  relationships: RelNote[];
}

interface Character {
  id: CharacterId;
  name: string;
  role: Role;
  personality: Personality;
  intro: string;             // short visible bio (first impression only)
  relationships: RelToOther[];
  knowledge: KnowledgeModel; // SEPARATE from statements (mandatory)
  isCulprit: boolean;
  alibiTrue: 'true' | 'partial' | 'fabricated';
}

interface KnowledgeModel {
  trueTimeline: string;
  claimedAlibi: string;
  observations: string[];     // → TRUE answers
  knowledgeGaps: string[];    // → UNKNOWN answers
  mistakenBeliefs: string[];  // → honest-but-wrong (FALSE/MISLEADING)
  secrets: string[];          // may be innocent or guilty
  lies: string[];            // → intentional deception
  motives: string[];         // character's own motivations
}
```

---

## 4. Fact / Timeline Schema

**Decision:** Canonical facts are explicit, time-stamped, and tagged with `known_by` (which characters
possess them) and `truth`. This is the layer the solver and contradiction engine reason over — not the
player-facing dialogue.

**Alternatives considered:** free prose timeline — rejected: not machine-checkable for solvability.

**Why recommended:** enables deterministic contradiction detection and solver simulation.

```ts
interface TimelineEvent {
  time: string;            // "22:00" or "Day 2 morning"
  what: string;
  participants: CharacterId[];
}

interface Fact {
  id: string;              // "F-023"
  subject: CharacterId;
  predicate: string;       // "location_at_time"
  value: string;
  time?: string;
  truth: boolean;          // canonical
  knownBy: CharacterId[];  // who could truthfully know this
}
```

---

## 5. Question Schema (interrogation cards)

**Decision:** A `CaseQuestion` is a case-authored interrogation card with one or more `resolutions`
(theme, one per `character × discoveredContext`). Questions have `availability` (initial or unlocked by
condition). Three levels map to directive §11: Discovery (initial), Follow-up (unlocked by info),
Confrontation (unlocked by contradiction/evidence).

**Alternatives considered:**
- Global question library reused across cases — rejected: that is the rejected "generic card" model.
- Free-text input — rejected: violates DEC-001/DEC-006.

**Why recommended:** contextual, character-aware, case-aware, dynamically unlocked — exactly the
directive's requirement.

**Complexity cost:** Medium-High authoring. **Failure modes:** dangling unlocks (mitigated by solver
reachability check).

```ts
interface CaseQuestion {
  id: QuestionId;
  text: string;            // natural question shown to player
  category:
    | 'timeline' | 'relationship' | 'alibi' | 'evidence'
    | 'knowledge' | 'pressure' | 'contradiction' | 'followup';
  scope: CharacterId | Role | 'any';   // who you can ask
  availability:
    | { kind: 'initial' }
    | { kind: 'unlocked'; when: UnlockCondition };
  resolutions: Resolution[];            // one per (character × context)
}

type UnlockCondition =
  | { type: 'discoveredClue'; clueId: ClueId }
  | { type: 'askedQuestion'; questionId: QuestionId }
  | { type: 'contradiction'; contradictionId: ContradictionId }
  | { type: 'flaggedContradiction'; contradictionId: ContradictionId };

interface Resolution {
  forCharacter: CharacterId;
  requiresContext?: DiscoveredContextId;  // state-dependent answer
  statement: string;          // what the player READS (no labels)
  truthState: TruthState;     // internal only — never shown
  reveals?: ClueId[];         // add to Case Board
  unlocks?: QuestionId[];     // follow-up / confrontation cards
  createsContradiction?: ContradictionId;
}
```

---

## 6. Unlock Graph

**Decision:** Unlocks are explicit edges: a `Resolution` may `unlocks` new `CaseQuestion`s and/or
`reveals` clues, and a `ContradictionLink` may `exposedBy` a confrontation card. The runtime evaluates
`availability.when` against the player's discovered set.

**Alternatives considered:** implicit unlock by keyword matching dialogue — rejected: non-deterministic,
untestable.

**Why recommended:** deterministic, validatable, and creates the "discoveries open new paths" feeling.

**Complexity cost:** Low (data edges). **Failure modes:** unreachable question (mitigated by solver
reachability over the graph).

---

## 7. Contradiction Model

**Decision:** Contradictions are **authored links** between two `StatementRef`s (a `question × character`
pair). They are recorded privately by the engine when both statements are in the transcript, and a
**confrontation card** (`exposedBy`) is unlocked. The player sees "⚠ Possible inconsistency" — the
engine never declares who is lying.

**Alternatives considered:**
- Runtime inference of contradictions from statement text — rejected: needs LLM, non-deterministic,
  risks false contradictions (directive §20 "Contradiction Integrity").
- Show "X IS LYING" — rejected: destroys the game.

**Why recommended:** preserves ambiguity; player interprets; contradiction is earned, not given.

**Complexity cost:** Medium. **Failure modes:** two TRUE statements falsely flagged — prevented by
authored-only links + validation that both refs exist.

```ts
interface ContradictionLink {
  id: ContradictionId;
  note: string;             // "⚠ Possible inconsistency" text
  involves: [StatementRef, StatementRef];  // question×character pairs
  exposedBy: QuestionId;     // confrontation card that lights it up
  implication: string;       // shown after confrontation, not before
}
```

---

## 8. Knowledge Boundary / Answer-State Model

**Decision:** Seven internal truth states (TRUE / FALSE / PARTIALLY_TRUE / MISLEVANT / UNKNOWN /
EVASIVE / CONTRADICTED). They are **engine-internal only**; players see dialogue. FALSE = honest
mistake; DECEPTIVE = intentional lie (never labelled); IRRELEVANT becomes UNKNOWN / "doesn't apply to
me" (knowledge boundary, not schema inapplicability).

**Alternatives considered:** keep four player-visible outcomes — rejected: directive forbids labels.
Collapse to 3 states — rejected: loses honest-vs-deceptive and evasive distinction.

**Why recommended:** matches directive §11 and the knowledge-boundary model.

**Complexity cost:** Low (enum). **Failure modes:** UI accidentally leaking a label — caught by
invariant audit + test.

---

## 9. Accusation Model

**Decision:** Structured accusation over `answerDimensions`: culprit (from roster) + what (explanation
pool) + motive (motive pool) + optional evidence (evidence pool). Win iff every dimension matches
`truth`. Partial matches produce a graded score (directive §21).

**Alternatives considered:** single "pick the suspect" — rejected: too shallow, the rejected model.
Free-text theory — rejected: not gradable, not fair.

**Why recommended:** rewards understanding, not guessing; supports partial-credit scoring.

**Complexity cost:** Low-Medium. **Failure modes:** too many options overwhelming — capped at 3–4
decisions; pools sized per case.

```ts
interface Accusation {
  culprit?: CharacterId;
  what?: string;     // explanationPool choice
  motive?: string;   // motivePool choice
  evidence?: string; // evidencePool choice (optional)
}

interface RevealScript {
  narrative: string;        // reconstructed truth
  culprit: string;
  what: string;
  motive: string;
  timeline: TimelineEvent[];
  lies: { character: CharacterId; statement: string; truth: string }[];
  innocentLiars: CharacterId[];   // why they lied
  keyClues: ClueId[];
  missedContradictions: ContradictionId[];
}
```

---

## 10. Player State Schema

**Decision:** `PlayerState` records interrogations (per character transcript), discovered clues/leads,
unlocked questions, flagged contradictions, optional pressure, accusation, and status. Persisted to
LocalStorage (INV-009). Survives refresh.

**Alternatives considered:** derive everything from transcript — rejected: need explicit unlocked set
+ flagged contradictions for UI.

**Why recommended:** minimal, serializable, supports the Case Board and persistence.

```ts
interface PlayerState {
  caseId: string;
  interrogations: Record<CharacterId, {
    questionId: QuestionId;
    statement: string;
    truthState: TruthState;   // stored internal, never rendered as label
  }[]>;
  discoveredClues: ClueId[];
  leads: LeadId[];
  unlockedQuestions: QuestionId[];
  flaggedContradictions: ContradictionId[];
  pressure?: number;          // optional (deferred per D7)
  accusation?: Accusation;
  status: 'playing' | 'won' | 'lost';
}
```

---

## 11. Generation Pipeline (LLM at dev-time only)

**Decision:** A `CaseGenerator` abstraction with a pluggable `LLMProviderAdapter`. Generation is a
deterministic **ordered** pipeline (directive §26):

1. Select novelty constraints (underused structure).
2. Generate canonical truth first.
3. Generate character knowledge boundaries.
4. Generate interrogation graph (questions, answers, unlocks, confrontations).
5. Structural validation.
6. Automated solver simulation (≥2 paths).
7. LLM critique pass (structured criticisms only, no rewrite).
8. Repair or reject (bounded attempts).

**Alternatives considered:** "Generate a murder mystery" one-shot — rejected: guaranteed clichés.
Ship the LLM output raw — rejected: no validation, no fairness guarantee.

**Why recommended:** controlled creativity; every case is structurally valid and solvable before
publication.

**Complexity cost:** High (pipeline + validators). **Failure modes:** generation cost/rate limits —
mitigated by caching + hand-authored seed cases + provider abstraction (no provider locked yet, per
directive §25).

```text
CaseGenerator (interface)
   └─ GenerationRequest (novelty constraints + strict schema spec)
        └─ LLMProviderAdapter (free/near-free provider, chosen later)
             └─ Raw Case Draft (strict JSON)
                  └─ Schema Validation
                  └─ Logic Validation (consistent with TruthModel)
                  └─ Contradiction-Graph Validation
                  └─ Solvability Simulation (≥2 paths)
                  └─ Similarity / Repetition Check
                  └─ Human Review Queue (initially mandatory)
                       └─ Approved Structured Case → static JSON
```

---

## 12. Historical Case Memory / Novelty Engine

**Decision:** Maintain a `CaseFingerprint` index (metadata only, not full text) for every approved case.
Before generation, compute structural distance across: crime_type, setting, incident_mechanism,
culprit_role, motive_type, relationship_structure, narrative_twist, solution_structure. Ban recently
overused combinations; prefer underused. Detect **structural sameness** (e.g. jealous-spouse / jealous-
partner / business-partner-for-money all collapse to `{relationship_conflict → jealousy → direct
murder}`), not surface synonyms.

**Alternatives considered:** send full history to LLM each time — rejected: cost + context bloat.
Random generation — rejected: repetition.

**Why recommended:** enforces "don't generate the same game in different clothes" (directive §25).

**Complexity cost:** Medium. **Failure modes:** cold-start (mitigated by seeding banned patterns +
hand-authored bootstrap); over-constraining (mitigated by preferring, not forcing).

```ts
interface CaseFingerprint {
  caseId: string;
  genre: Genre;
  setting: string;
  incidentMechanism: string;
  culpritRole: Role;
  motiveType: string;
  relationshipStructure: string[];
  narrativeTwist: string;
  nSuspects: number;
  primaryDeceptionPattern: string;
  solutionStructure: string;
  tone: string;
}
```

---

## 13. Validation Pipeline

**Decision:** Four gates, all must pass (directive §36):
- **A. Structural validity** — JSON valid; all refs resolve; unlocks reachable; timeline coherent.
- **B. Logical solvability** — solution deducible; ≥2 paths; critical facts accessible; culprit
  consistent with canonical truth; no external knowledge required.
- **C. Human entertainment** — opening creates curiosity; ≥2 interesting characters; ≥1 "wait…"
  moment; satisfying reveal; structurally different from recent cases. A case passing A+B but failing C
  is rejected.
- **D. Novelty** — fingerprint distance vs recent cases above threshold.

**Why recommended:** separates "valid" from "fun" — the directive's key insight.

**Complexity cost:** Medium-High. **Failure modes:** validator false-negative (good case rejected) —
bounded retries + human override.

---

## 14. Automated Solver Strategy

**Decision:** Retarget the existing `src/core/solver.ts` search algorithm to the **statement/evidence
graph**. The solver simulates multiple investigation strategies (BFS/backtracking over question
sequences) and verifies:
- the correct accusation is reachable,
- ≥2 independent paths exist,
- key evidence is accessible within budget,
- the solution cannot be trivially guessed from one answer,
- guilt is **not** implied by any single lie (innocent-liar guard),
- difficulty metrics (chars, secrets, deceptive statements, min depth, path count) are computed and
  stored (directive §28 — difficulty emerges from measurable properties, not a label).

**Alternatives considered:** keep the old candidate-filter solver — rejected: the candidate model is
gone. Pure LLM "is this solvable?" — rejected: not mathematical.

**Why recommended:** reuses the existing, tested search core; satisfies INV-007 in the new domain.

**Complexity cost:** Medium (retarget). **Failure modes:** state space explosion — mitigated by
pruning + per-case timeout (carry RISK-011 mitigation).

---

## 15. Runtime State Machine (deterministic, zero LLM)

**Decision:** Runtime is a pure function `resolve(card, character, case, discoveredContextSet) →
Resolution`. The UI renders `statement` only. The engine maintains the knowledge graph by applying each
`Resolution`'s `reveals` / `unlocks` / `createsContradiction`. Confrontation cards become available
when their `ContradictionLink.exposedBy` condition is met. Accusation is evaluated against `truth`.

**States:** `briefing → roster → interrogating(character) → [switch/confront] → accuse → reveal`.
Switching characters and opening the Case Board are free (no action cost). Each meaningful question /
follow-up / confrontation / accusation spends one action from `interrogationBudget` (~12).

**Alternatives considered:** runtime LLM interpretation — rejected (INV-003). Linear dialogue tree —
rejected (no investigation freedom).

**Why recommended:** fully offline, deterministic, fair, and matches the directive's runtime diagram
(§32).

**Complexity cost:** Medium. **Failure modes:** soft-lock (budget exhausted, no accusation) — mitigated
by allowing accusation at any time; dead-end (no winning path) — mitigated by solver gate.

---

## 16. Open Decisions Needing Approval

| # | Decision | Recommended default | Approval |
|---|----------|---------------------|----------|
| D1 | DEC-005 reinterpret (keep human characters; delete identifier rationale) | Keep scope, delete rationale | YES |
| D2 | V1 generation: hand-authored seed cases behind `CaseGenerator` | Ship 2–3 hand-authored | YES |
| D3 | Budget ~12 actions; switching/board free | Adopt | YES (tuning) |
| D4 | DEC-010 witness personality meaningful vs decoration | Meaningful | YES |
| D5 | Novelty engine: schema + hooks now, populate later | Schema now | YES |
| D6 | Accusation dimensions: culprit + what + motive (evidence optional) | 3 decisions | YES |
| D7 | Pressure/timer meter | Defer V1 | YES |

---

## 17. V1 Cutline (what NOT to build yet)

- No backend, accounts, multiplayer, runtime LLM, procedural conversation.
- No voice/art assets, 3D, image generation.
- No full drag-and-drop evidence board (use auto Case Board).
- No pressure/timer meter (defer per D7).
- No live novelty generation service (schema + validation hooks only; populate on generation later).
- No large dataset generation (2–3 seed cases first).
- No leaderboards, analytics, social beyond spoiler-free share.

Keep it a compact, static, offline, daily deduction game.

---

## 18. Recommended Next Phase

1. Author 1–2 hand-written seed cases against this schema (used for the gameplay audit).
2. Implement `resolveStatement` + knowledge graph + contradiction engine + Case Board + accusation +
   reveal (Phase 2 rebuild).
3. Retarget `solver.ts`; pass seed cases through all four validation gates.
4. Only then build the LLM generation + novelty + validation pipeline (Phase 3).

No source change to the superseded person-identifier prototype. No autonomous product-shaping
decisions.
