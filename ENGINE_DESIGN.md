# Engine Design: The Interrogation (Crime-Mystery Interrogation)

**Status:** DESIGN GATE — engine architecture + generic schema. **No source code written.** `src/` remains empty.
**Companion to:** `PRODUCT_CORRECTION_REPORT.md`, `CRIME_GAME_ARCHITECTURE_PROPOSAL.md`, `RESPONSE_VARIABILITY_MODEL.md`, `GAMEPLAY_SIMULATIONS.md`, `CASE_NOVELTY_SYSTEM.md`.
**Inputs for this gate:** two gold-standard cases — `gold-hh-001` (art theft / inside job) and `gold-vd-002` (staged disappearance) — supplied as behavioral-reference fixtures.
**Principle:** *Mechanics are generic; the case is data.* The engine operates only over IDs, gating conditions, and effect edges (`reveals`/`unlocks`/`createsContradiction`). It never branches on case content.

---

## 1. Gold-standard case analysis

Both fixtures are **behavioral references**, not templates. They prove the same engine can host structurally different mysteries.

| Aspect | `gold-hh-001` (heist) | `gold-vd-002` (disappearance) | Generic requirement |
|--------|-----------------------|--------------------------------|---------------------|
| Responsible party | A `suspect` (Julian) | The `victim` herself (Eleanor) | `truth.culpritId` is just "responsible character" — may be anyone in roster |
| Twist | Painting swapped before apparent theft | Disappearance was self-staged | `primaryTwist`/`secondaryTwist` are free text |
| Response keying | `responses` keyed by `characterId` | same | Engine reads `Record<CharacterId, …>`; never assumes fixed character set |
| Category vocab | timeline/access/observation/relationship/evidence/motive/financial/confrontation | timeline/relationship/observation/knowledge/access/evidence/confrontation/motive | `mechanic` is metadata; engine ignores the string |
| Contradiction surfacing | `statementRefs` (CON001) **and** gated (CON002/004/005 have no refs) | `statementRefs` and theme-only (CON004/005) | `surfaceWhen` condition generalizes both |
| Accusation dims | culprit + what + motive (+ evidence) | responsibleParty + whatHappened + motive (+ evidence), different ids | `dimensions[]` is an open array |
| Evidence links | `proves` | `supports` | unified to `supports: FactId[]` |
| Discovery | `discoveryRules` with string triggers | same | Engine ignores string triggers; uses variant/question `reveals`/`unlocks` |
| Innocent liars | Mara (affair), Daniel (debt) | Claire/Ben/Maya/Theodore | INV-109 guard, data-driven |

**Conclusion:** The differences are *data shape and content*, not *mechanism*. One generic schema + one deterministic engine hosts both.

---

## 2. Generic schema (TypeScript interfaces, design-only)

> These interfaces describe **case data** and **player state**. They are the contract between case authors (hand or LLM) and the runtime. No implementation file is created in this gate.

```ts
// ===== Identifiers & open enums =====
type CaseId = string;
type CharacterId = string;
type QuestionId = string;
type ClueId = string;
type FactId = string;
type EvidenceId = string;
type ContradictionId = string;
type StatementId = string;
type LeadId = string;
/** Context switch id. Engine-extensible; default 'initial'. */
type ContextId = string;

type Role = 'suspect'|'witness'|'victim'|'investigator'|'associate'|'employee'|'bystander'|'accomplice'| string;
type Genre = 'murder'|'heist'|'missing_person'|'fraud'|'sabotage'|'blackmail'|'suspicious_death'|'locked_room'|'disappearance'|'conspiracy'| string;
type Tier = 'A'|'B'|'C';
type Difficulty = 'easy'|'medium'|'hard';

/**
 * INTERNAL-ONLY classification of a response. NEVER rendered to the player.
 * The engine does not branch on this; it is metadata for generation validation
 * and the redundancy solver (which reasons over `discloses`, not over `kind`).
 */
type ResponseKind =
  | 'TRUTH' | 'PARTIAL_TRUTH' | 'MISLEADING' | 'DIRECT_LIE'
  | 'EVASIVE' | 'UNCERTAIN' | 'FALSE_BELIEF' | 'ADMISSION'
  | 'DEFLECTION' | 'TRUTH_AFTER_PRESSURE' | string;

/**
 * Card mechanic: engine-relevant *classification for grouping/UI only*.
 * The engine does NOT branch on it. A case may use any value.
 */
type CardMechanic =
  | 'TIMELINE'|'LOCATION'|'ALIBI'|'RELATIONSHIP'|'MOTIVE'|'OBSERVATION'
  | 'KNOWLEDGE'|'EVIDENCE'|'OBJECT'|'PERSON'|'EVENT'|'FOLLOW_UP'
  | 'CONFRONTATION'|'PRESSURE' | string;

/** Presentation hint only; never a "lying" badge. */
type Cooperation = 'open'|'guarded'|'evasive'|'deflecting'|'hostile'|'revised'| string;

// ===== Case-level =====
interface Briefing { hook: string; context?: string; tension?: string; objective?: string; }

interface PlayerRules {
  investigationActions: number;       // action budget
  switchCharacterIsFree: boolean;     // true
  notebookReviewIsFree: boolean;      // true
  evidenceReviewIsFree: boolean;      // true
  theoryBuildingIsFree: boolean;      // true
  accusationAvailableAtAnyTime: boolean; // true
  externalKnowledgeRequired: boolean;  // false
  runtimeLLMRequired: boolean;        // false
}

interface TimelineEvent { time: string; eventId?: string; description: string; }

interface Truth {
  incident: string;
  culpritId: CharacterId;             // the RESPONSIBLE party (any roster member)
  whatHappened: string;
  motive: string;
  method: string;
  finalLocation?: string;
  timeline: TimelineEvent[];
  criticalFacts: string[];
  importantSecondaryTruths?: string[];
  primaryTwist?: string;
  secondaryTwist?: string;
}

interface PersonalityProfile {
  cooperation?: 'low'|'medium'|'high';
  composure?: 'low'|'medium'|'high';
  defensiveness?: 'low'|'medium'|'high';
  manipulation?: 'low'|'medium'|'high';
  voluntaryDisclosure?: 'low'|'medium'|'high';
}

interface Knowledge {
  knows?: string[];
  doesNotKnow?: string[];
  secrets?: string[];
  lies?: string[];
  beliefs?: string[];                 // mistaken beliefs -> FALSE_BELIEF
  truthfulStatements?: string[];
  lieMotivation?: string[];
  alibi?: { claimed?: string; status?: 'true'|'partial'|'fabricated'|'victim'|'mostlyTrue'|string };
}

interface Character {
  id: CharacterId;
  name: string;
  role: Role;
  visibleDescription: string;
  personality: string;                // archetype label (cooperative/defensive/...)
  personalityProfile?: PersonalityProfile;
  relationshipIds?: string[];
  knowledge: Knowledge;
  isCulprit?: boolean;               // optional mirror of truth.culpritId
}

interface Relationship {
  id: string; a: CharacterId; b: CharacterId;
  type: string; description?: string;
  visibility?: 'public'|'discoverable'|'secret'|string;
}

interface Fact { id: FactId; tier: Tier; category: string; statement: string; critical?: boolean; }

interface Evidence {
  id: EvidenceId; name: string; description: string;
  discoverability: string; supports: FactId[]; optional?: boolean;
}

interface Clue { id: ClueId; title: string; description: string; importance?: 'critical'|'secondary'|'atmospheric'|string; }
interface Lead { id: LeadId; title?: string; description: string; }

// ===== Gating (availability + contradiction surfacing) =====
type GatingAtom =
  | { kind: 'clue'; id: ClueId }
  | { kind: 'evidence'; id: EvidenceId }
  | { kind: 'statement'; id: StatementId }       // a specific recorded statement
  | { kind: 'questionAsked'; id: QuestionId }
  | { kind: 'contradictionActive'; id: ContradictionId }
  | { kind: 'context'; id: ContextId };          // a context switch has occurred
interface GatingCondition { all?: GatingAtom[]; any?: GatingAtom[]; }

// ===== Questions / responses =====
interface FactDisclosure { factId: FactId; clarity: 'full'|'partial'|'none'; }

interface ResponseVariant {
  id: string;
  text: string;                       // dialogue shown to player; NO labels
  kind: ResponseKind;                 // INTERNAL ONLY
  cooperation?: Cooperation;           // INTERNAL ONLY
  weight: number;                     // 1..100, generator-assigned, band-checked (INV-119)
  requiresContext?: ContextId;        // variant only valid in this context
  discloses?: FactDisclosure[];       // solver/redundancy links (INV-114/115)
  reveals?: ClueId[];                 // notebook additions
  unlocks?: QuestionId[];             // follow-up/confrontation cards
  createsContradiction?: ContradictionId;
}

interface ResolutionContext { context: ContextId; variants: ResponseVariant[]; } // >=1; 'initial' required

interface CaseQuestion {
  id: QuestionId;
  mechanic: CardMechanic;
  text: string;
  targetCharacterIds: CharacterId[];  // who this card can be asked of
  availability: { type: 'initial' } | { type: 'unlocked'; when: GatingCondition };
  purpose?: string;
  /** One ResolutionContext set per targeted character. Keyed by character id. */
  responses: Record<CharacterId, ResolutionContext[]>;
  /** Optional question-level fallback effects (applied when any variant selected). */
  reveals?: ClueId[];
  unlocks?: QuestionId[];
}

// ===== Contradictions =====
interface Contradiction {
  id: ContradictionId;
  type: string;                       // 'behavioral'|'timeline'|'knowledge'|'object'|'opportunity'|'relationship'|'self'|'apparent' — metadata/UI
  description: string;
  statementRefs?: StatementId[];      // surfaced when ALL recorded (default surfaceWhen)
  surfaceWhen?: GatingCondition;       // alternative/general surface condition
  importance?: 'critical'|'high'|'secondary'|'low'|string;
  possibleInterpretations?: string[];
  confrontationQuestionId?: QuestionId; // becomes available when active
}

interface Statement {
  id: StatementId;
  characterId: CharacterId;
  sourceQuestionId: QuestionId;
  canonicalMeaning: string;
  truthState: ResponseKind;           // internal
}

// ===== Miscs =====
interface RedHerring {
  id: string; characterId?: CharacterId;
  surfaceSuspicion: string; actualReason: string;
  crimeConnection: 'unrelated'|'indirect'|'none'|string;
  fairnessRole?: string;
}

interface SolutionPath { id: string; name: string; description: string; criticalFacts?: FactId[]; approximateActions?: number; }

interface AccusationOption { value: string; label?: string; }
interface AccusationDimension {
  id: string;                         // 'culprit'|'what'|'motive'|'method'|'evidence'| case-defined
  prompt: string; required: boolean;
  options: (string | AccusationOption)[];
  correctValue: string;
}
interface Accusation { dimensions: AccusationDimension[]; correctSolution: Record<string, string>; }

interface RevealFact { fact: string; importance: string; discoveredThrough?: string[]; howDiscovered?: string; }
interface Reveal { headline: string; narrative: string[]; truthBreakdown: RevealFact[]; }

interface CaseFingerprint {
  genre: Genre; setting: string; crimeStructure: string; truthStructure: string;
  narrativeEnvironment: string; primaryMechanism: string; emotionalTone: string;
  culpritRelationship: string; motiveType: string; methodType: string;
  nCharacters: number; deceptionPattern: string; timelineStructure: string; endingStructure: string;
}

interface QualityGates {
  externalKnowledgeRequired: boolean;
  singleExactQuestionSequenceRequired: boolean;
  automaticCandidateEliminationAllowed: boolean;
  runtimeLLMRequired: boolean;
  allCriticalFactsHaveRedundancy: boolean;
  minimumIndependentSolutionPaths: number;
  innocentLiarExists: boolean;
  truthfulSuspiciousCharacterExists: boolean;
  sameQuestionCanProduceDifferentResponses: boolean;
  responseVariabilityCannotChangeCanonicalTruth: boolean;
  responseVariabilityCannotMakeCaseUnsolvable: boolean;
  revealExplainsMajorContradictions: boolean;
  targetPlayTimeMinutes?: { minimum: number; maximum: number };
}

// ===== Top-level CaseFile =====
interface CaseFile {
  caseId: CaseId;
  date?: string;
  title: string;
  genre: Genre;
  subgenre?: string;
  tone: string;
  setting?: string;
  difficulty: Difficulty;
  estimatedPlayTimeMinutes?: { fast: number; typical: number; deep: number };
  briefing: Briefing;
  playerRules: PlayerRules;
  truth: Truth;
  characters: Character[];
  relationships?: Relationship[];
  facts?: Fact[];
  evidence?: Evidence[];
  clues?: Clue[];
  leads?: Lead[];
  questions: CaseQuestion[];
  statements?: Statement[];
  contradictions: Contradiction[];
  redHerrings?: RedHerring[];
  solutionPaths?: SolutionPath[];
  accusation: Accusation;
  reveal: Reveal;
  fingerprint?: CaseFingerprint;
  qualityGates?: QualityGates;
}
```

### Schema generalisation notes (vs. the two gold cases)
- **`responses` keyed by character** → kept as `Record<CharacterId, ResolutionContext[]>`. Engine iterates; it never assumes a fixed set of characters.
- **`discoveryRules` with string triggers** → **not consumed by the engine.** The same effect is expressed structurally via each variant's `reveals`/`unlocks`/`createsContradiction` and each question's optional `reveals`/`unlocks`. The string-trigger block is redundant authoring and should be dropped from any case the engine loads (a loader can validate its absence or ignore it).
- **`evidence.proves`/`supports`** → unified to `supports: FactId[]`.
- **`culpritId`/`responsibleParty`** → unified to `truth.culpritId` (the responsible party; may be the "victim" in a staged case).
- **`truth_after_pressure` + `requiresContext`** → generalized `ContextId` taxonomy (`initial`, `after_clue_<id>`, `after_evidence_<id>`, `after_contradiction_<id>`, `after_question_<id>`, arbitrary).
- **`statementRefs` vs theme-only contradictions** → unified via `surfaceWhen` (`statementRefs` → default surfaceWhen "all refs recorded").
- **Accusation dimensions** → open array; each case decides which are `required`.

---

## 3. Runtime architecture (subsystems)

All subsystems are **pure functions over `(CaseFile, PlayerState)`** plus effect-application helpers. No module imports case content.

```
CaseFile (lazy JSON)
   │  CaseLoader (schema-validate; truth kept out of initial bundle — INV-001)
   ▼
PlayerState (LocalStorage; INV-009)
   │
   ├─ CardEngine.availableQuestions(case, state, characterId)
   │     → evaluates each question.availability against GatingCondition
   ├─ CardEngine.ask(case, state, characterId, questionId)
   │     → ResponseSelector.pick → ResolutionContext (context from state) → variant
   │     → applyEffects(variant) : reveals clues, unlocks questions,
   │       flags createdContradiction, records Statement, spends 1 action
   ├─ ContradictionEngine.active(case, state)
   │     → for each Contradiction, eval surfaceWhen / statementRefs
   │     → mark active; unlock confrontationQuestionId
   ├─ Notebook.read(state) → {people, statements, timeline, evidence, contradictions, leads}
   ├─ CharacterSwitch.free(state, toId) → no action cost (INV-118)
   ├─ AccusationEngine.evaluate(case, accusation) → per-dimension match vs truth; graded score (INV-013)
   └─ RevealEngine.build(case, state) → reveal + what player missed
```

### 3.1 CaseLoader
- Validates `CaseFile` against the schema; rejects unknown-required-field violations.
- Splits delivery: `briefing` + roster intros + `accusation` dimension prompts are in the initial index; `truth`, `characters.knowledge`, full `questions`/`contradictions`/`reveal` live in a lazy per-case chunk loaded on open. Build audit greps `culpritId`/`truth` outside case chunks (INV-001).

### 3.2 PlayerState
```ts
interface PlayerState {
  caseId: CaseId;
  sessionSeed: number;                 // hash(deviceId, caseId, attemptNonce) — INV-120
  attemptNonce: number;
  interrogations: Record<CharacterId, { questionId: QuestionId; variantId: string; text: string; contextId: ContextId }[]>;
  discoveredClues: ClueId[];
  discoveredEvidence: EvidenceId[];
  unlockedQuestions: QuestionId[];
  activeContradictions: ContradictionId[];
  flaggedContradictions: ContradictionId[];   // player-elected to pursue
  contextSwitches: ContextId[];                // earned contexts (after_clue_*, after_contradiction_*, ...)
  actionsRemaining: number;                    // from playerRules.investigationActions
  theory?: Record<string, string>;             // silent Theory Board (INV-117)
  accusation?: Record<string, string>;
  status: 'playing'|'won'|'lost';
}
```
Free actions (switch, notebook, evidence review, theory build/edit) mutate state **without** decrementing `actionsRemaining` (INV-118). Interrogation actions (ask/follow-up/present-evidence/confront) cost 1.

### 3.3 ResponseSelector (deterministic, NO runtime RNG/LLM)
```
questionSeed = hash(sessionSeed, caseId, questionId, characterId, contextId)
variants    = contexts[contextId].variants   // pre-generated
cum        = prefixSum(variants.map(v => v.weight))
r          = questionSeed mod cum.last        // integer
index      = first i where cum[i] > r
selected    = variants[index]
```
- `contextId` is resolved from `state.contextSwitches` (`initial` unless a relevant earned context exists).
- Same `(sessionSeed, …)` → identical variant across refresh/device (INV-113/120). No `Math.random`, no clock, no LLM.
- Selection is **weighted** (truthful/cooperative high weight; lies low), not uniform.

### 3.4 CardEngine
- `availableQuestions`: a question is available iff `availability.type === 'initial'` **or** (`unlocked` AND `gatingSatisfied(case, state, when)`). `gatingSatisfied` evaluates `all`/`any` over `GatingAtom`s against `discoveredClues/Evidence`, recorded `Statement`s, asked `Question`s, `activeContradictions`, and `contextSwitches`.
- `ask`: calls `ResponseSelector.pick`, then `applyEffects`.

### 3.5 applyEffects (the information graph)
For the selected variant:
- push `reveals` clues into `discoveredClues` (dedup),
- push `unlocks` questions into `unlockedQuestions`,
- if `createsContradiction`, add to `activeContradictions` (and surface),
- record a `Statement` (`id` derived from question×character×context×variant; used by `statementRefs` contradictions),
- spend 1 action (unless the card is a free action — it isn't).
Question-level `reveals`/`unlocks` are applied as a fallback when present.

### 3.6 ContradictionEngine
`isActive(case, state, c)`:
- if `c.statementRefs` present → active when every ref's `Statement` is recorded;
- else if `c.surfaceWhen` present → active when `gatingSatisfied`;
- else if `c.confrontationQuestionId` is currently available → active.
When active: add to `activeContradictions`, and mark `confrontationQuestionId` available (overrides its own gating if needed). UI shows `⚠ Possible inconsistency: <description>` — never "X is lying" (INV-107/116).

### 3.7 Notebook / Theory Board
Read-only projections of `PlayerState`: People (roster + relationships), Statements (recorded), Timeline (discovered clue/evidence timestamps + `truth.timeline` hidden until reveal), Evidence (discovered), Contradictions (active, labelled "possible inconsistency"), Leads (unlocked-but-unasked questions). Theory Board is **silent** (INV-117): building/editing produces no correctness signal.

### 3.8 AccusationEngine
- Builds a form from `accusation.dimensions`; each `required` dimension must be answered.
- `evaluate`: for every dimension, compare `accusation[dim.id]` to `correctSolution[dim.id]`. Win iff all `required` dimensions match. Returns graded score (correct culprit / what / motive / contradictions found / actions used) for the reveal — partial credit allowed (FR-014).
- Accusation is **always available** (INV-118); it is the first and only correctness event (INV-117).

### 3.9 RevealEngine
Renders `reveal` (static, authored) plus a per-player "what you missed" derived from `state` vs `truth`/`solutionPaths`.

### 3.10 Persistence
Single LocalStorage key; versioned; `sessionSeed` persisted so refresh does not reroll (INV-120). In-memory fallback (INV-014).

---

## 4. Response-variability architecture

Five layers (authored at generation time; only Layer 5 runs at play):

```
L1 Canonical Fact (fixed)        ─┐
L2 Character Knowledge (fixed)    │  authored once
L3 Character Intent (fixed)       │
L4 Response Variants (fixed set) ─┘
L5 Deterministic Selection = weightedPick(hash(seed, case, q, char, ctx), variants)
```

- **Case global, responses per-player:** all players share `CaseFile` (L1–L4). L5 selection differs per `sessionSeed`.
- **No reroll on refresh:** `sessionSeed` is persisted; refresh re-runs L5 with the same seed → same variant (INV-113/120).
- **No identity infra:** `sessionSeed = hash(deviceId, caseId, attemptNonce)`. `deviceId` is a stable per-install id already in the persistence layer; `attemptNonce` increments only on a deliberate restart. No login.
- **Context switch ≠ reroll:** returning to a character *after* a clue/contradiction/question unlocks a new `ContextId`; L5 reseeds with the new `contextId`, deterministically yielding the "revised story" variant block. Re-asking in the *same* context yields the *same* variant.
- **Variation classes** (directive §10): `wording` (same fact, different phrasing), `disclosure` (different amount revealed), `behavioral` (different emotional tone), `truth` (rarely different truthfulness), `context` (new info after leverage). The redundancy solver reasons over `discloses`, so *wording* and *behavioral* variation never affect solvability.

---

## 5. Probability model (generation-time authoring + INV-119 bands)

The **runtime does not compute probabilities** — selection is a weighted pick over authored weights. The probability model is **authoring guidance** enforced by the validator (INV-119). Per-response-block weight bands:

| Response class | Band | Notes |
|----------------|------|-------|
| TRUTH | 40–55% | default; ordinary factual questions skew higher |
| PARTIAL_TRUTH | 15–25% | |
| EVASIVE / DEFLECTION | 10–18% | |
| UNCERTAIN | 3–8% | **only** when justified by `knowledge` (`doesNotKnow`/`beliefs`); never a cheap block (INV-119a) |
| DIRECT_LIE | 2–6% | only for chars with a `lies`/`secrets` reason (INV-104) |
| MISLEADING / FALSE_BELIEF / ADMISSION | case-tuned | low; ADMISSION gated behind `requiresContext` (pressure) |

**Sensitivity & intent modulation** happen at **generation time**: the author (or LLM) assigns weights already reflecting question sensitivity and the character's `personalityProfile` (cooperative → higher TRUTH; defensive → higher EVASIVE/DEFLECTION; calculating/manipulative → higher PARTIAL/MISLEADING). Because weights are static at runtime, INV-119 bands remain enforceable by the validator. The runtime never re-derives probabilities, preserving determinism.

---

## 6. Fairness / redundancy system (INV-114/115)

**Redundant Critical Facts (INV-114):** for every Tier A fact `F` required for a correct accusation, the case satisfies either
- **(a)** `F` is disclosed (full/partial) by ≥1 variant on each of ≥2 independent question/character routes; **or**
- **(b)** `F` has exactly one route `R` and *every* variant in `R` discloses `F`.
Any character who **lies** about `F` must sit on a route with an independent truthful alternative.

The **solver** (retargeted `solver.ts`) simulates the **worst-case (minimum-disclosure) variant selection** under INV-119 bands and confirms: correct accusation still reachable, ≥2 independent paths survive, key evidence accessible within budget, no single lie implies guilt (INV-109). Cases failing are rejected at build (INV-007/114). The redundancy graph is computed from `discloses` links, so it is content-agnostic.

---

## 7. Contradiction system

Types are **metadata** (behavioral / timeline / knowledge / object / opportunity / relationship / self / apparent). The engine treats them identically. Two design rules:
1. **Authored-only** (INV-116): a contradiction surfaces *only* via a `Contradiction` entry — never by runtime text comparison.
2. **Earned, ambiguous**: surfaced as "⚠ Possible inconsistency: <description>"; the player decides. Apparent contradictions (both accounts could be true) are first-class and listed in `possibleInterpretations`.
Confrontation cards unlock via `confrontationQuestionId` when the contradiction is active; their `after_contradiction_*` context variants yield revised answers — deterministic (§4).

---

## 8. Question / card system (mechanics vs. content)

- **Generic card mechanics** (`CardMechanic`) are a controlled vocabulary for UI grouping (TIMELINE, LOCATION, ALIBI, RELATIONSHIP, MOTIVE, OBSERVATION, KNOWLEDGE, EVIDENCE, OBJECT, PERSON, EVENT, FOLLOW_UP, CONFRONTATION, PRESSURE). The engine **ignores** the value; it only uses `targetCharacterIds`, `availability`, and `responses`.
- **Availability modes** map to gating:
  - Initial → `{ type: 'initial' }`
  - Contextual / Follow-up / Evidence-driven / Contradiction-driven / Revisit / Pressure-Confrontation → `{ type: 'unlocked'; when: GatingCondition }` over clues/evidence/statements/questions/contradictions/contexts.
- No fixed card count, no fixed category set, no standardized wording. A case may omit any mechanic.

---

## 9. Overfitting audit (gold-specific things the engine must NOT assume)

| Gold artifact | Why it tempts overfit | Generic rule |
|---------------|----------------------|--------------|
| `responses` keyed by Julian/Mara/Daniel/… | hardcode character names | iterate `case.characters` + `responses` map |
| `discoveryRules` string triggers (`Q003-S-01_OR_…`) | parse trigger grammar | ignore; use variant `reveals`/`unlocks` + `surfaceWhen` |
| categories `access`/`financial`/`observation` | branch on category | `mechanic` is UI-only |
| `culpritId` (hh) vs `responsibleParty` (vd) | two field names | single `truth.culpritId` = responsible party |
| 6 characters in both | assume fixed roster size | any count ≥1 |
| Julian lies a lot | assume culprit lies more | INV-109: innocent liars exist; lie count is data |
| `evidence.proves` (hh) vs `supports` (vd) | two fields | unified `supports` |
| `truth_after_pressure` + `requiresContext` | special-case | `ContextId` taxonomy |
| `qualityGates`/`fingerprint`/`estimatedPlayTimeMinutes` | runtime logic | metadata for validator/novelty only |
| reveal `truthBreakdown[].howDiscovered` references clues | parse reveal text | reveal is static authored text |

**Net:** the engine contains **zero** case-specific literals. Every decision is over IDs + gating + effect edges.

---

## 10. Synthetic fixtures (prove generality — design-only, not production)

Two schema-level fixtures are provided in `design/synth-fixtures/` to exercise structurally different cases than the gold pair:

- **`fixture-missing-person-train.json`** — 4 characters, `missing_person` genre, accusation dims `{culprit, what, motive}` where `what ∈ {abducted, ran_away, accident}`; contradiction surfacing via `statementRefs` (timeline) **and** a `surfaceWhen` (knowledge) contradiction; evidence-driven unlock of a confrontation.
- **`fixture-corporate-sabotage.json`** — 5 characters including `employee`/`investigator` roles, `sabotage` genre, accusation dims `{culprit, what, motive, method}` (adds a `method` dimension); contradiction types `opportunity` + `behavioral`; evidence `supports` links; `surfaceWhen` gating on evidence for the confrontation.

Together with `gold-hh-001` and `gold-vd-002` they give **four structurally different loadable fixtures** (heist / staged-disappearance / missing-person-train / corporate-sabotage), satisfying the "≥3 structurally different fixtures load successfully" test requirement. They are explicitly **not** production content.

---

## 11. Implementation sequence (for the NEXT gate — NOT executed here)

1. `CaseFile` + `PlayerState` types (`src/core/types.ts`) + JSON schema.
2. `caseLoader` (validate + lazy truth chunk) + `persistence` (`sessionSeed`).
3. `responseSelector` (hash + weighted pick) + unit tests for determinism/refresh.
4. `gating` + `cardEngine` (availability, ask, applyEffects).
5. `contradictionEngine` (surfaceWhen / statementRefs / confrontation unlock).
6. `notebook` projection + Theory Board (silent).
7. `actionEconomy` (budget, free actions).
8. `accusationEngine` (evaluate vs `truth`, graded) + `revealEngine`.
9. Retarget `solver.ts` to statement/evidence graph; add INV-114/115 redundancy + worst-case-variant gate.
10. Hand-author 2–3 seed cases (incl. the two gold cases) passing all gates.
11. Runtime tests (loading, switching, variability, determinism, context, contradictions, discovery, budget, free actions, accusation, reveal, no-runtime-LLM) + browser playtest.

**No source code is written in this gate.** The above is the ordered plan for the approved build.

---

## 12. Open decisions to confirm before build

| # | Decision | Status |
|---|----------|--------|
| Schema `responses` keyed-by-character + `discloses` links | Recommended in this doc | **RECOMMENDED — AWAITING APPROVAL** |
| Drop `discoveryRules` string triggers in favor of structured effects | Recommended in this doc | **RECOMMENDED — AWAITING APPROVAL** |
| `ContextId` taxonomy for post-confrontation answers | Approved in prior gate (mechanism) | **AWAITING** algorithm sign-off (INV-120) |
| Probability bands (INV-119) as generation-time authoring | Defined §5 | **RECOMMENDED — AWAITING APPROVAL** |
| INV-114/115 redundancy + worst-case solver gate | Defined §6 | **RECOMMENDED — AWAITING APPROVAL** |
| `surfaceWhen` generalization of contradictions | Recommended in this doc | **RECOMMENDED — AWAITING APPROVAL** |

These are the only open items; everything else is already APPROVED FROM USER DIRECTIVE in prior gates.

---

## 13. Current project state

- `src/` is **empty**; no engine code exists yet.
- This document plus the two synthetic fixtures are **design artifacts only**.
- The next human-approved step is the Phase 2 build per §11 (no source created until then).

**Stop condition:** This gate produces design only. No `src/**` files were created; the legacy people-identifier architecture remains fully purged; the engine design is case-agnostic.
