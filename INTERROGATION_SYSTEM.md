# Interrogation System — The Interrogation

**Status:** PRODUCT MECHANICS LOCK (design only). No implementation.
**Companion to:** `GAMEPLAY_CORE_LOOP.md`, `INFORMATION_ARCHITECTURE.md`, `RESPONSE_VARIABILITY_MODEL.md`.
**Authority:** User directive PART 1 (context/leverage), PART 5 (profiles, taxonomy, contradictions),
PART 6 (response limits), PART 7 (lie model), PART 8 (notebook), PART 4 (unlock graph).

This document specifies *how interrogation works as a system*: the characters, the questions, the
conversation context, the response types, and the lies. Schema shapes are illustrative (final schema in
`CRIME_GAME_ARCHITECTURE_PROPOSAL.md` §3–§5, extended by `RESPONSE_VARIABILITY_MODEL.md` §5).

---

## 1. Character interrogation profiles (PART 5A)

Personality is **not decoration** (resolves DEC-026 in favor of DEC-030). It influences *how* a
character behaves — cooperation, verbosity, defensiveness, redirect — but **never** which canonical
facts are true or whether they are ultimately guilty (INV-102/103/104). An innocent person can be
evasive; a guilty person can be cooperative.

| Profile | Default cooperation | Behavior | Risk if overused |
|---------|--------------------|----------|------------------|
| **Cooperative** | High | Answers directly; may volunteer | Boring if everyone is this |
| **Defensive** | Medium | Answers but challenges the framing ("That's not the right question") | Can feel obstructive |
| **Evasive** | Low | Avoids specifics; deflects to feelings/generalities | Player may misread as guilt |
| **Nervous** | Medium-High | Over-explains; occasionally contradicts *themself* (honest mistake) | Could accidentally imply guilt |
| **Calculating** | Low-Medium | Minimal, careful answers; reveals little unprompted | Slow to yield info |
| **Hostile** | Low | Requires stronger evidence for useful info; may refuse soft questions | Needs escalation path |
| **Manipulative** | Medium | Technically truthful but redirects suspicion to another character | Dangerous — can mislead the player (intended!) |
| **Emotional** | Variable | Strong reactions to certain topics; may blurt secrets under pressure | Tone swings |

**Rules:**
- Profile is a *default tendency*, not a hard rule. Each response variant still carries its own
  `cooperation` tag (`RESPONSE_VARIABILITY_MODEL.md` §5), so a normally Cooperative character can be
  evasive on one sensitive topic.
- Profile **must not encode guilt.** The solver validates that guilt distribution is independent of
  profile (INV-109: a lie does not imply guilt; an evasive manner does not imply guilt).
- Profile drives **voice and framing only** (wording, length, whether a follow-up is "offered" vs
  "dragged out of them"). It is the difference between two truthful answers reading differently.

**Recommended:** ship all eight profiles; assign 1–2 per case deliberately so the cast feels varied.

---

## 2. Question taxonomy (PART 5B)

The directive lists 13 candidate categories. We adopt a **13-class taxonomy** but enforce a strict
**unlocking philosophy** so the player never sees a flat deck of 50 cards.

| Class | Unlocks when | Example |
|-------|--------------|---------|
| **ALIBI** | initial | "Where were you after dinner?" |
| **TIMELINE** | initial | "What time did you leave?" |
| **RELATIONSHIP** | initial | "How well did you know the victim?" |
| **MOTIVE** | initial (suspect) | "Did you have a reason to want this?" |
| **OBSERVATION** | initial | "What did you see that evening?" |
| **KNOWLEDGE** | initial | "Did you know the alarm was disabled?" |
| **CHARACTER_HISTORY** | initial | "Tell me about your background." (atmosphere / Tier C) |
| **OPPORTUNITY** | initial (access holders) | "Who could have entered the office?" |
| **FOLLOWUP** | after a discovery | "You mentioned the blue car — whose was it?" |
| **EVIDENCE** | after finding a clue/object | "Why does this ticket place you in Brighton?" |
| **OBJECT** | after an object surfaces | "What is this key for?" |
| **CONTRADICTION** | after a possible inconsistency is flagged | "Sarah says you left at 9:40. You said 10:15." |
| **CONFRONTATION** | after leverage (evidence or contradiction) | "Your fingerprints were on the desk. Explain." |

**Unlocking philosophy (the core progression engine):**

```
Initial questions (ALIBI/TIMELINE/RELATIONSHIP/MOTIVE/OBSERVATION/KNOWLEDGE/HISTORY/OPPORTUNITY)
        │  a statement reveals a NAME / FACT / OBJECT
        ▼
FOLLOWUP / OBJECT questions unlock (specific to that discovery)
        │  player finds a clue or another character's testimony
        ▼
EVIDENCE / CONTRADICTION questions unlock
        │  player presents evidence or surfaces the inconsistency
        ▼
CONFRONTATION questions unlock (leverage earned)
```

This is the "investigation evolves" requirement (PART 3, PART 5B). It is **deterministic**: a
discovery's `unlocks: QuestionId[]` is authored data; the engine reveals the card when the discovery is
recorded in `PlayerState`.

**Card count control:** a case shows ~15–25 *initial* cards across the cast, expanding to 25–45 with
unlocks. The player never sees all at once; the visible set grows as they investigate. This satisfies
"manageable evolving set" (PART 5B).

---

## 3. Conversation Context and Leverage System (PART 1 — APPROVED)

This is the formal model the directive demanded. It replaces the earlier `initial` / `after_*` sketch
with an explicit **leverage** concept.

### 3.1 Contexts (deterministic, seeded)
Each `(question × character)` resolution has variant blocks keyed by a **ContextId**:

```
ContextId =
  | 'initial'
  | 'after_evidence_' + ClueId
  | 'after_contradiction_' + ContradictionId
  | 'after_testimony_' + StatementRef      // heard another character say X
  | 'after_confrontation_' + QuestionId    // already confronted once
  | 'after_trust'                          // optional: earned via sustained cooperation
```

Selection uses the seeded algorithm from `RESPONSE_VARIABILITY_MODEL.md` §4, with `contextId` in the
seed. Same context → same variant (no reroll).

### 3.2 Leverage (what earns a context switch)
A context switch is **not** "ask again for a better answer." It requires the player to have *earned*
new conversational power:

| Leverage type | How earned | Unlocks context | What changes |
|---------------|-----------|-----------------|--------------|
| **Evidence leverage** | Finding/discovering a clue | `after_evidence_<C>` | Character must address the object/fact |
| **Testimony leverage** | Another character's statement recorded | `after_testimony_<S>` | Character reacts to what the other said |
| **Contradiction leverage** | Notebook flags inconsistency | `after_contradiction_<CId>` | Character must respond to the clash |
| **Confrontation leverage** | Playing a confrontation card | `after_confrontation_<Q>` | Character's later answers shift (defensive→revealing) |
| **Trust leverage** | (Optional, rare) sustained cooperative path | `after_trust` | Character volunteers a held-back detail |

### 3.3 Worked example (the directive's Amelia case)
```
Player: "Where were you at 9 PM?"  → context 'initial'
Amelia vA: "I was heading home."   (evasive, withholds gallery presence)

Player discovers: security footage places Amelia near gallery (clue C1)  → earns EVIDENCE leverage
New card unlocks: "You said you were heading home. Footage places you near the gallery at 9:12. Explain."
Player plays it → context 'after_evidence_C1'
Amelia vB: "Fine. I stopped there briefly. But I didn't go inside."  (revised, MORE disclosure)
```
The player did **not** click the same question twice hoping for RNG. They *earned* the better answer by
investigating. This is the crux of PART 1's IMPORTANT CORRECTION.

---

## 4. Response types and probability framework (PART 6)

### 4.1 Categories (internal only — never shown as labels, INV-107)
| Category | Meaning | Example |
|----------|---------|---------|
| **Direct truthful** | Accurate, complete | "I was in the dining car until 9:15." |
| **Truthful but incomplete** | Accurate, omits something | "I was in the dining car." (omits until when) |
| **Evasive** | Avoids the point without lying | "Why does it matter where I was?" |
| **Flat lie** | Knowingly false | "I never went near the gallery." |
| **Uncertain / imperfect memory** | Genuine, justified gap | "I remember the clock striking nine, but not exactly when I left." |
| **Contextual reveal** | Disclosed only after leverage | "Fine. I was at the gallery — but not to steal." |

### 4.2 Recommended probability framework (per response *block*, weighted)
> These are **defaults for the generator**, not hard rules. Each block's weights are tuned per
> question by the author/generator. The directive says "analyze and recommend" — this is the
> recommendation.

| Category | Default weight band | Notes |
|----------|--------------------|-------|
| Direct truthful | 40–55% | The common case; most questions resolve truthfully. |
| Truthful incomplete | 15–25% | Realistic — people omit. |
| Evasive | 10–18% | Flavor + mild obstruction; never blocks (INV-114). |
| Uncertain (justified) | 3–8% | **Only** when the story justifies a memory gap. |
| Contextual reveal | special | Exists only in `after_*` contexts; selected when that context is active. |
| Flat lie | 2–6% | **Low.** A lie is a rare, reasoned event (PART 6 / §5 below). |

**NON-NEGOTIABLE RULE (PART 6):** "I don't remember" is **not** a cheap mystery mechanic. Memory
uncertainty requires a *narrative justification* in `knowledge.mistakenBeliefs` / `knowledgeGaps`. The
player must never feel "RNG decided to withhold." This is enforced by INV-103 (knowledge boundaries)
plus a generation rule: an `UNCERTAIN` variant must cite a justification fact.

### 4.3 Which information categories are allowed to vary (PART 6)
| Information category | May vary across players? | Rule |
|----------------------|--------------------------|------|
| **Critical fact (Tier A)** | **NO** (must always be obtainable) | Covered by INV-114; variants may *withhold* on one route only if a redundant truthful route exists. |
| **Supporting detail (Tier B)** | YES (can be withheld) | A variant may omit a Tier B fact without breaking solvability. |
| **Character emotional reaction / voice** | YES (highly variable) | This is where most "different interrogation" feeling comes from. |
| **Exact wording** | YES (highly variable) | Same fact, different phrasing per variant. |
| **Lie** | YES but constrained | Only for characters with a `knowledge.lies` reason; low weight; redundancy-covered (§5, INV-114). |

---

## 5. Lie Motivation taxonomy (PART 7)

Every `FALSE` / `MISLEADING` variant must cite a **LieMotivation** from this taxonomy. This is engine-
internal; the player sees only the dialogue.

| Code | Motivation | Innocent or guilty? | Example red-herring value |
|------|-----------|---------------------|----------------------------|
| `SELF_PROTECTION` | Hiding own crime | Guilty (often) | — |
| `PROTECT_OTHER` | Shielding someone they love/owe | Either | Strong red herring if they shield the culprit |
| `HIDE_UNRELATED_WRONGDOING` | Covering a *different* misdeed | **Innocent of main crime** | Classic innocent-liar (INV-109) |
| `EMBARRASSMENT` | Ashamed of the truth (affair, debt) | **Innocent** | Makes them look guilty; must not imply guilt |
| `FEAR_OF_CONSEQUENCES` | Afraid of police/blame | Either | — |
| `MANIPULATE_INVESTIGATION` | Redirecting suspicion | Guilty or protective | Manipulative profile |
| `MAINTAIN_ALIBI` | Preserving a false alibi | Guilty | — |
| `MISREMEMBER` | Genuinely wrong (not a lie, but `FALSE` outcome) | Either | Nervous profile; honest mistake |
| `STRATEGIC_OMISSION` | Telling truth but leaving out key part | Either | "Truthful incomplete" variant |

### 5.1 Distinctions the engine must understand (PART 7)
- **Guilty lie** vs **Innocent lie**: both produce `FALSE` internally, but only the guilty lie's
  motivation connects to the crime. The player must deduce which.
- **Protective lie** vs **guilty lie**: a character lying to protect *another* person may or may not be
  protecting the culprit.
- **Mistaken statement** (`MISREMEMBER`) vs **lie** (`FALSE` from intent): both can be wrong, but the
  mistaken one is exculpatory-friendly (the character isn't deceiving).
- **Omission** (`STRATEGIC_OMISSION`) vs **evasion** (`EVASIVE`): omission is within a truthful answer;
  evasion is avoiding the question entirely.
- **Innocent lie must create a secondary mystery** (PART 7): e.g. Marcus lies about his whereabouts
  because he was meeting someone's spouse — a believable red herring, not a random block.

**Generator rule:** every case must contain ≥1 `HIDE_UNRELATED_WRONGDOING` or `EMBARRASSMENT` lie from a
non-culprit (INV-109). The solver verifies no single lie implies guilt.

---

## 6. Confrontation mechanics (PART 5C / PART 1)

A **Confrontation** is a special question card unlocked by leverage. It does not auto-expose truth; it
changes the *subsequent* context for that character.

- Playing a CONFRONTATION card records a `ContradictionId` or `ClueId` as leverage → the character's
  later answers shift to `after_confrontation_*` / `after_evidence_*` variants.
- Possible outcomes (authored, predetermined): confession of a smaller lie, explanation, counter-
  accusation, partial truth, escalation, or a *new* contradiction (the character implicates someone
  else).
- The player decides *when* to confront (timing skill, §3 of `GAMEPLAY_CORE_LOOP.md`).

---

## 7. Decision status

| Item | Status |
|------|--------|
| 8 character interrogation profiles, meaningful not decorative | **APPROVED FROM USER DIRECTIVE** (PART 5A; resolves DEC-026 via DEC-030) |
| 13-class question taxonomy with unlocking philosophy | **RECOMMENDED** — taxonomy APPROVED (PART 5B); counts tuned in `CASE_SCALE_SPEC.md` |
| Conversation Context & Leverage System (no magical re-ask) | **APPROVED FROM USER DIRECTIVE** (PART 1 IMPORTANT CORRECTION) |
| 6 response categories + probability framework | **RECOMMENDED** (PART 6) |
| "I don't remember" banned as cheap mechanic | **APPROVED FROM USER DIRECTIVE** (PART 6 NON-NEGOTIABLE) |
| Lie Motivation taxonomy (9 codes) | **RECOMMENDED** (PART 7) |
| Innocent-liar must create secondary mystery | **APPROVED FROM USER DIRECTIVE** (INV-109) |
