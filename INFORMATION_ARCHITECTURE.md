# Information Architecture — The Interrogation

**Status:** PRODUCT MECHANICS LOCK (design only). No implementation.
**Companion to:** `INTERROGATION_SYSTEM.md`, `GAMEPLAY_CORE_LOOP.md`, `CASE_GENERATION_PIPELINE.md`.
**Authority:** User directive PART 1 (Tier A/B/C fact hierarchy), PART 5C (contradiction types +
confidence), PART 8 (notebook), PART 2/10 (scale).

This document defines *what information exists, how it is ranked, how it is stored in the player's
mind, and how contradictions are represented* — without solving or labeling.

---

## 1. Fact tiers (PART 1 — strengthened redundancy model)

The directive strengthens INV-114 from "every critical fact has two routes" into a **three-tier
hierarchy**. This is the canonical classification used by the generator, the solver, and the
redundancy validator.

### Tier A — Case-critical facts
Facts **required** to correctly identify the culprit AND reconstruct the crime (the `answerDimensions`
truth). Each Tier A fact must satisfy **all** of:
- **≥2 independent discovery routes** (different characters or question chains), and
- **≥1 route resistant to character deception** (a physical clue, recording, or a truthful character),
- **solver validation under worst-case response variants** (INV-114 / `RESPONSE_VARIABILITY_MODEL.md` §7).

*Example:* "Julian was in the control room at 11:30" — discoverable via Sasha's testimony, the access
log (evidence), AND Julian's slip under pressure.

### Tier B — Strong supporting facts
Facts that **substantially increase confidence** but are not individually required (e.g. motive
strengthening, timeline tightening). Should normally have **1–2 routes**. Missing one does not block
solving, but missing several weakens the case.

*Example:* "Julian had gambling debts" — supports motive; available via financial records or a
colleague's comment.

### Tier C — Atmospheric facts
Character history, personality, side details, emotional texture. **Can have a single route, optional
discovery, no solvability dependency.** These exist so conversations feel human, not every line a key.

*Example:* "Amelia collects vintage trains." — flavor only.

**Design rule:** a healthy case is ~60–70% Tier C by *volume of dialogue*, but Tier A facts are the
skeleton. This prevents the "every line is a puzzle key" feeling the directive warns against.

---

## 2. Knowledge graph (runtime, player-built)

The engine maintains a **graph**, not a list, so the "investigation network" metaphor is real:

```
Nodes:        Characters, Facts (Tier A/B/C), Clues, Evidence, Statements, Contradictions, Leads
Edges:        knows / said / contradicts / implies / unlocks / supports / occurred-before
```

- `said` edges connect a character to the statements they produced (per `PlayerState.interrogations`).
- `contradicts` edges are **authored** (never inferred at runtime — INV-104 / PART 5C). The engine only
  *surfaces* a flagged contradiction; it never decides one is real.
- `unlocks` edges drive the question graph (`INTERROGATION_SYSTEM.md` §2).
- `occurred-before` edges build the Timeline (§4).

The graph is the backing store for the Notebook (§5) and the Theory Board
(`GAMEPLAY_CORE_LOOP.md` §6). It is **never used to auto-solve** (DEC-019).

---

## 3. Evidence vs. Clues vs. Leads

| Concept | Source | Player-facing? | Role |
|---------|--------|---------------|------|
| **Clue** | A statement that reveals a fact (auto-recorded) | Yes (in Statements/Timeline) | Builds the graph |
| **Evidence** | A physical/recorded object discovered (ticket, log, photo) | Yes (Evidence section) | Leverage for confrontation |
| **Lead** | An unlocked question or topic | Yes (Leads section) | Points to next action |

Evidence is special: it is the **leverage currency** (`INTERROGATION_SYSTEM.md` §3.2). Presenting
evidence is an interrogation action that can unlock CONFRONTATION cards.

---

## 4. Timeline

A Timeline section collects timestamped events from statements and evidence. It is **player-assembled**
from discovered facts; the engine does not impose a canonical order on the player. The canonical
timeline exists only in `truth` (revealed at the end, INV-112).

Timeline contradictions (PART 5C) arise when two timestamped statements cannot both fit — but the
engine flags only "possible inconsistency," never resolves it.

---

## 5. Investigation Notebook (PART 8 — record, don't solve)

Six sections, all **auto-populated from discovered data**, none **evaluative**:

| Section | Contents | Good example | Bad example (forbidden) |
|---------|----------|--------------|-------------------------|
| **PEOPLE** | Names, roles, discovered relationships | "Marcus — nephew; owed Victor money" | "Marcus is the liar" |
| **STATEMENTS** | What each person claimed (verbatim-ish) | "Amelia: 'I left before 9.'" | "Amelia lied about her alibi" |
| **TIMELINE** | Events + timestamps | "Security disabled 10:02–10:08" | "Therefore Amelia did it" |
| **EVIDENCE** | Objects / discovered clues | "Train ticket: Brighton, 21:40" | "This proves guilt" |
| **CONTRADICTIONS** | Possible inconsistencies | "⚠ Amelia 'left before 9' vs Victor 'saw her at 9'" | "Amelia is lying" |
| **LEADS** | Unlocked questions/topics | "Ask Daniel about the argument" | — |

**Hard rule (INV-107 / PART 8):** the Notebook records; it does **not** declare guilt, label deception,
or auto-rank suspects. The player must reach those conclusions. Contradictions are rendered as
"⚠ possible inconsistency," preserving ambiguity (PART 5C, PART 15 requirement).

---

## 6. Contradiction system (PART 5C)

### 6.1 Contradiction types (authored, not runtime-inferred)
| Type | Definition | Example |
|------|------------|---------|
| **Direct** | Two characters make incompatible claims | A: "I was home." B: "I saw A at the station." |
| **Timeline** | Events cannot fit chronologically | A left at 9; B says A arrived at 10 having left at 8. |
| **Knowledge** | Someone knows something they shouldn't | Suspect knows the victim's last words (only the killer would) |
| **Object** | An object can't be where claimed | The "stolen" item was in the evidence locker the whole time |
| **Opportunity** | Alibi conflicts with physical access | Claims to be locked out, but accessed the room via service door |
| **Behavioral** | A character contradicts their *own* earlier statement | "I never entered" → later "I stepped in briefly" |
| **Partial** | Two accounts differ but **both could be true** | A "left around 9," B "saw A near 9:10" — compatible if A dawdled |

The **Partial** type is critical: not every flagged inconsistency proves a lie. Some require
interpretation. This is what keeps "liar = culprit" from being a valid shortcut (INV-109).

### 6.2 Contradiction confidence model
The engine assigns an **internal, non-player-facing** confidence to each flagged contradiction:
- **HIGH** — logically incompatible (Direct/Timeline/Object/Opportunity with no reconciliation).
- **MEDIUM** — one account unlikely but possible (Knowledge, Behavioral).
- **LOW / PARTIAL** — compatible on closer reading (Partial type).

This confidence is **never shown to the player**. It is used only by:
1. The generator, to ensure ≥1 HIGH contradiction exists per case (so there is a real "wait" moment),
2. The solver, to confirm the contradiction is *surfaced* and *exploitable* within budget.

The player sees only "⚠ possible inconsistency" regardless of confidence — they must judge.

### 6.3 Surfacing rule
A contradiction is surfaced **only when both statements are recorded** in `PlayerState` and the pair
matches an authored `ContradictionLink`. The engine does not invent contradictions (INV-104). This
prevents false "X is lying" moments.

---

## 7. Decision status

| Item | Status |
|------|--------|
| Three-tier fact hierarchy (A critical / B supporting / C atmospheric) | **APPROVED FROM USER DIRECTIVE** (PART 1) — strengthens INV-114 |
| Knowledge graph as runtime backing store (not solver) | **RECOMMENDED** (architecture) |
| Evidence = leverage currency | **APPROVED FROM USER DIRECTIVE** (PART 1 Evidence questions) |
| Notebook: 6 sections, record not solve | **APPROVED FROM USER DIRECTIVE** (PART 8) |
| 7 contradiction types incl. Partial | **RECOMMENDED** (PART 5C) |
| Internal-only contradiction confidence (never shown) | **APPROVED FROM USER DIRECTIVE** (PART 5C / INV-107) |
| Contradictions surfaced only from authored links | **APPROVED FROM USER DIRECTIVE** (INV-104) |
