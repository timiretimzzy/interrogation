# SYSTEM AUDIT — Phase 4

## Current Architecture

### How are scenarios currently loaded?
Cases are defined as JSON `CaseFile` objects imported from `src/data/cases/`. The `cases` export in `src/data/cases/index.ts` aggregates all 11 cases. Each case is lazy-loaded on demand; `truth` is kept in a separate chunk and never surfaced to the player client. The `caseLoader.ts` module validates structural integrity and referential integrity (no dangling IDs, valid gating references, valid accusation dimensions).

### Where is canonical game state stored?
Canonical state lives in `PlayerState` (in-memory during a session, persisted to `LocalStorage` via `persistence.ts`). Key fields: `discoveredClues`, `discoveredEvidence`, `unlockedQuestions`, `recordedStatements`, `activeContradictions`, `contextSwitches`, `actionsRemaining`, `status`. The engine is pure over `(CaseFile, PlayerState)` — no module imports case content.

### How does conversation currently work?
The conversation flow is:
1. Player selects a question → `availableQuestionsForCharacter` / `allAvailableQuestions` evaluates gating against player state
2. `selectResponse` uses deterministic weighted selection (hashSeed + weightedPick) — same (sessionSeed, case, question, character, context) → identical variant
3. `ask` applies effects: records interrogation, records statement if applicable, reveals clues/evidence, unlocks questions, creates contradictions, spends action
4. `computeActiveContradictions` checks `statementRefs` + `surfaceWhen` gating
5. `buildNotebook` projects state into a read-only organizational aid (People, Statements, Timeline, Evidence, Contradictions, Leads)

### Where are LLM calls made?
Nowhere at runtime. The project explicitly has `runtimeLLMRequired: false` in all playerRules. All response text is pre-authored in case JSON. The only LLM involvement would be in Phase 4 generation pipeline (deferred to Phase 3).

### What data is exposed to the client?
The client (browser) receives:
- Case index (briefing + roster intros) — eager, visible
- Full CaseFile including `truth` — lazy, hidden until reveal
- Player state via LocalStorage — persistent but client-side only
- Never: hidden answer data, canonical truth during gameplay

### How are answers currently determined?
Answers are deterministic: `selectResponse` derives a seed from `hashSeed(sessionSeed, caseId, questionId, characterId, contextId)`, then uses `weightedPick` over variant weights. Same seed → same variant (refresh-safe, device-stable). No LLM, no Math.random, no clock.

### How are answers currently determined?
Player progress is tracked in `PlayerState`:
- `discoveredClues`: discovered clue IDs
- `discoveredEvidence`: discovered evidence IDs
- `unlockedQuestions`: question IDs unlocked through reveals/unlocks
- `recordedStatements`: statement IDs recorded through interrogations
- `activeContradictions`: active contradiction IDs
- `contextSwitches`: earned context IDs (after_clue_*, after_contradiction_*, after_question_*, etc.)
- `actionsRemaining`: budget counter
- `status`: 'playing' | 'won' | 'lost'
- `theory`: silent Theory Board (Record<string, string>, INV-117)
- `accusation`: Record<string, string> of selected accusation answers

### What existing abstractions should be preserved?
- Deterministic seed-based response selection (INV-113/120)
- Gating via `GatingCondition` / `GatingAtom` (clue/evidence/statement/context/contradiction/questionAsked)
- Response variant effects (`discloses`, `reveals`, `unlocks`, `createsContradiction`)
- Contradiction surfacing via `surfaceWhen` + `statementRefs` (INV-116)
- Accusation evaluation against `correctSolution` (INV-013)
- Solver validation (INV-114/115 redundancy, worst-case solvability)
- Player rules (`playerRules` in CaseFile) controlling free actions, accusation availability, LLM requirement
- LocalStorage persistence with `sessionSeed` for refresh stability (INV-120)

## Strengths
- Clean separation of case data (JSON) and engine logic (pure TS functions)
- Deterministic, offline-first, zero runtime RNG/LLM — fair and inspectable
- Comprehensive schema validation at load time (caseLoader)
- Redundancy/independence validation (solver INV-114/115)
- Good gating system that prevents premature revelation
- Clear action budget with free navigation/theory building
- Accusation engine with graded partial credit (INV-013)
- 11 cases already validated and passing all gates

## Weaknesses (current limitations Phase 4 addresses)
- **Flat conversation model**: Questions are isolated trivia; no logical chain from discovered evidence to theory formation
- **No Theory Board**: `theory` field exists as `Record<string, string>` but is silent (INV-117) — no structured player-owned theory, no evaluation, no deduction connections
- **No deduction system**: No automatic deductions from prerequisite facts, no player-triggered "aha" connections, no curated logical connections
- **No distinction discovery/understanding**: Player collects facts but the engine does not distinguish "I learned X" from "I understand how X connects to Y"
- **No structured accusation flow**: Accusation is a flat record comparison; no diagnostic feedback on *what is missing* or *what is supported*
- **No solution paths**: Cases have `solutionPaths` but they are not integrated into the player experience — no minimum path tracking, no evidence coverage reporting
- **No minimum solution paths enforcement at runtime**: Solver validates at build time, but the player has no visibility into whether they're on a valid path
- **No player progress model beyond flat discoveries**: `discoveredClues` / `discoveredEvidence` are just sets; no `understood` set, no `recentTopics` for continuity, no `closedLeads` to prevent dead-end repetition
- **No response eligibility beyond context**: `ResponseVariant` has `requiresContext` but no `requiresFacts` / `excludesFacts` — critical facts cannot gate response eligibility, preventing "lie repeating after evidence is known" prevention
- **No diagnostic accusation feedback**: Wrong accusation only says "you lost" with a score; no diagnostic "you got culprit right but motive wrong" feedback

## Integration Points (smallest possible path)

### 1. ResponseVariant extension
**File**: `src/core/types.ts`  
**Current**: `ResponseVariant` has `id`, `text`, `kind`, `cooperation`, `weight`, `requiresContext`, `discloses`, `reveals`, `unlocks`, `createsContradiction`  
**Change needed**: Add `requires?: string[]` (Fact IDs that must be discovered) and `excludes?: string[]` (Fact IDs that must NOT have been discovered)  
**Impact**: Response eligibility filtering in `responseSelector.ts` — `eligibleVariants` must check `requires`/`excludes` against player state

### 2. PlayerProgress model
**File**: `src/core/types.ts`  
**Current**: `PlayerState` has flat `discoveredClues`, `discoveredEvidence`, `theory?: Record<string, string>`, `accusation?: Record<string, string>`  
**Change needed**: Add `discovered: Set<string>`, `understood: Set<string>`, `theory: TheoryBoard`, `questionsAsked: string[]`, `recentTopics: string[]`, `closedLeads: Set<string>`  
**Impact**: Player state management across turns; automatic deductions may update `understood`; Theory Board is player-owned

### 3. Deduction engine
**File**: `src/core/deductionEngine.ts` (new)  
**Current**: No deduction module exists  
**Change needed**: Implement deterministic deduction evaluation — automatic deductions (prerequisite satisfaction → `understood` update) and player-triggered deductions (explicit player action → `understood` + Theory Board)  
**Impact**: New module; unit tests for deduction evaluation

### 4. Theory Board
**File**: `src/core/types.ts` + `src/core/theoryBoard.ts` (new)  
**Current**: `theory?: Record<string, string>` in PlayerState  
**Change needed**: Replace with explicit `TheoryBoard` structure (`who?: string`, `why?: string`, `citedEvidence: Set<string>`) + engine evaluation API  
**Impact**: Player can form theory before final accusation; engine evaluates and gives diagnostic feedback

### 5. Theory Evaluation
**File**: `src/core/theoryEvaluation.ts` (new)  
**Current**: No dedicated theory evaluation module  
**Change needed**: Deterministic `evaluateTheory(theory: TheoryBoard, world: WorldModel)` returning `unsupported | partially_supported | contradicted | confirmed`  
**Impact**: New module; feeds diagnostic accusation feedback

### 6. Accusation diagnostic
**File**: `src/core/accusationEngine.ts`  
**Current**: `evaluateAccusation` returns `won`/`score`/`perDimension`  
**Change needed**: Enhance to return diagnostic text per dimension identifying missing/incorrect supported claims, not just correct/incorrect  
**Impact**: Player gets "You identified the culprit correctly but your explanation does not account for the motive" rather than just "3/5 correct"

### 7. Solution model integration
**File**: `src/core/solver.ts` (modify) + case JSON `criticalFacts` / `minimumSolutionPaths` / `solutionClaims`  
**Current**: Solver validates INV-114/115 at build time; `solutionPaths` exists on case but not used at runtime  
**Change needed**: Use solver's state-space exploration to track reachable critical facts, minimum paths, and solution readiness; integrate with player progress  
**Impact**: Solver now also serves runtime player guidance

## Components to Add
- `docs/phase-4/SYSTEM_AUDIT.md` (this file)
- `docs/phase-4/NARRATIVE_ENGINE_SPEC.md` (design spec)
- `docs/phase-4/IMPLEMENTATION_PLAN.md` (task breakdown)
- `src/core/deductionEngine.ts` (new)
- `src/core/theoryBoard.ts` (new)
- `src/core/theoryEvaluation.ts` (new)
- `src/core/types.ts` modifications (ResponseVariant requires/excludes, PlayerProgress, TheoryBoard)
- `src/core/accusationEngine.ts` modifications (diagnostic feedback)
- `src/core/responseSelector.ts` modifications (requires/excludes filtering)
- `src/core/caseLoader.ts` modifications (solution path validation)

## Components to Modify
- `src/data/cases/index.ts` (may need solution path metadata)
- `src/core/engine.test.ts` (add deduction/theory tests)
- `src/core/cases.test.ts` (add solvability validation)

## Components to Leave Alone
- All case JSON files — do not change story to fit new schema
- `src/core/gating.ts` — gating logic is fine; Phase 4 adds eligibility on top
- `src/core/contradictionEngine.ts` — contradiction logic is fine
- `src/core/accusationEngine.ts` core evaluate — enhance, don't rewrite
- `src/core/cardEngine.ts` — ask flow is fine; add eligibility filtering as layer
- `src/core/persistence.ts` — persistence is fine
- Existing test suite — extend, don't break

## Confirmed Domain Model (preliminary)
- **Fact**: canonical piece of info; supports/contradicts/unlocks other facts
- **Evidence**: discoverable piece supporting reasoning
- **ResponseVariant**: pre-authored dialogue with deterministic selection; extended with `requires`/`excludes`
- **Deduction**: curated logical connection between discovered facts; automatic vs player-triggered
- **PlayerProgress**: discovered/understood/theory/question history/closed leads
- **Theory Board**: player-owned structured theory (who/why/evidence)
- **Theory Evaluation**: deterministic classification (unsupported/partially_supported/contradicted/confirmed)
- **AccusationDimension**: structured dimension (WHO/WHAT/WHY/HOW) with correctValue and diagnostic
- **SolutionClaim**: canonical claim required for solution (WHO/WHAT/WHY/HOW)
- **criticalFactIds**: Tier-A facts critical for solution
- **minimumSolutionPaths**: distinct evidence routes to solution

## Confirmed Gameplay Model (preliminary)
- Player asks questions → variants selected deterministically → effects applied → state updates
- Critical facts have ≥2 independent routes (INV-114); worst-case route exists (INV-115)
- Protected information cannot reveal before deterministic conditions (gating + requires/excludes)
- Discovery ≠ understanding ≠ solving (Rule 4)
- LLM cannot decide truth; engine owns truth (Rule 1)
- Failed AI calls leave state unchanged (Rule 7)
- No artificial linear progression (Rule 5)
- Candidate relevance ≠ authorization (Rule 3)
- Discovery ≠ understanding (Rule 4)
- The LLM performs, the engine decides (Rule 6)

## Known Risks
1. **Response eligibility**: Adding `requires`/`excludes` to ResponseVariant could make cases unsolvable if over-used; must validate all 11 existing cases
2. **Theory Board ownership**: Ensuring engine never silently populates Theory Board; only player explicit action populates it
3. **Discovery ≠ understanding**: Designing deduction system that connects facts without making the game trivial
4. **Accusation diagnostics**: Providing useful diagnostic without reducing to a numerical score or LLM judgment
5. **Solution path visibility**: Making minimum solution paths visible to player without revealing answer or breaking discovery flow
6. **Backward compatibility**: All 11 existing cases must remain valid after schema changes; no case should break

## Deliberately Not Building (Phase 4.1 scope)
- Graph database — ordinary TypeScript objects and IDs suffice
- Multi-agent framework — single-player only
- Autonomous director service — engine decides, LLM performs
- Vector similarity / semantic question matching — deterministic matching only
- Automatic curiosity scoring — not needed; player drives pace
- Scenario generation pipeline — cases are hand-authored
- Persistent accounts / cloud sync — OUT OF SCOPE (client-only LocalStorage)
- Large template libraries — case-specific cards only
- Complex reputation / psychology systems — not demonstrated need
- Free-text interrogation — Q cards only (DEC-001/002/003)
- Runtime LLM calls — explicitly outlawed (DEC-006/INV-003)
- Dynamic AI character goals — authored static per case
- Automatic hypothesis scoring — engine evaluates structured theory only
- Multi-language i18n — V1 English only (DEC-007)
- Animations, sound, theming beyond baseline — post-V1 polish

## Next Implementation Task
Task 4.2.1 — Domain Contract: Implement the minimum new/updated TypeScript types required by the approved Phase 4 model (ResponseVariant requires/excludes, Deduction, PlayerProgress, TheoryBoard, SolutionClaim, AccusationDimension diagnostic support, critical facts / minimum solution paths).