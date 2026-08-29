# Case Novelty System — The Interrogation

**Status:** PRODUCT MECHANICS LOCK (design only). No implementation.
**Companion to:** `CASE_GENERATION_PIPELINE.md`, `CASE_SCALE_SPEC.md`, `INFORMATION_ARCHITECTURE.md`.
**Authority:** User directive PART 4 (novelty framework + fingerprint), PART 13 (layered memory), PART 9
(opening), PART 3 (retention).

This document defines how the game prevents "the same mystery in different clothes." It is **dev-time
only** (DEC-006/INV-003) and operates on a structured **fingerprint** index, not on full case text.

---

## 1. Why novelty is a first-class requirement

The directive is explicit: varying only the *nouns* (mansion→hotel, spouse→partner) is **not** variety.
Structural sameness — `{relationship_conflict → jealousy → direct murder}` repeated as wife/husband/
business-partner — must be detected and rejected. The player's retention hook is *"I have no idea what
tomorrow's case will be"* (PART 4), not a streak.

---

## 2. Multidimensional case fingerprint

Every published case records a compact fingerprint. These dimensions are chosen because they drive the
**deductive experience**, not the surface story.

| Dimension | Values (examples) | What it controls |
|-----------|-------------------|------------------|
| **crime_category** | murder, heist, missing_person, fraud, sabotage, blackmail, art_theft, corp_espionage, locked_room, disappearance, artifact_theft, staged_accident | the *type* of mystery |
| **crime_structure** | planned, opportunistic, gone_wrong, framing, inside_job, double_cross, mistaken_identity, false_confession, cover_up, accident_as_crime, crime_as_accident | the *shape* of the plot |
| **truth_structure** | single_culprit, conspirators, innocent_accomplice, innocent_liar, false_prime_suspect, victim_hiding, witness_misunderstanding, overlapping_crimes | how guilt is distributed |
| **narrative_environment** | museum, train, hotel, lodge, auction, cruise, theatre, university, corp_hq, film_set, airport, estate, club | the *setting* |
| **primary_mechanism** | timeline_contradiction, object_movement, alibi_collapse, financial_motive, identity_deception, hidden_relationship, physical_evidence, witness_inconsistency, opportunity_paradox, impossible_access | the *central deduction hinge* |
| **emotional_tone** | tense, elegant, darkly_humorous, high_society, noir, adventure, psychological, high_stakes, chaotic | the *feel* |
| **deception_pattern** | single_lie, multiple_lies, innocent_liar_primary, misleading_truth, evasion_primary, no_lie | how deception is distributed |
| **evidence_type** | document, recording, physical_object, observation, digital_log, forensic | what leverage looks like |
| **solution_structure** | confrontation_path, evidence_path, timeline_path, relationship_path, multi_path | the *dominant* solution route |
| **complexity_tier** | easy / medium / hard (PART 10) | density of leads/contradictions |

**Forbidden content dimensions (hard filter, never fingerprinted as allowed):** any case involving
sexual violence, rape, graphic torture, graphic gore, or crimes against children as central
entertainment. The generator is instructed to refuse these; the validator rejects them.

---

## 3. Novelty scoring (structural distance)

Before publishing, the pipeline computes a **structural distance** between the candidate fingerprint and
recent history. Two complementary measures:

### 3.1 Hard bans (recent-window)
Within the **last 10 published cases**, the candidate must NOT share ALL of a banned combination, e.g.:
- `(crime_category, crime_structure, primary_mechanism)` identical, **or**
- `(truth_structure, deception_pattern, solution_structure)` identical.

This catches exact structural clones.

### 3.2 Soft diversity push (rolling window)
Over the **last 30 cases**, compute the frequency of each fingerprint dimension value. The novelty
scorer **prefers underused values** — i.e. if `locked_room` and `jealousy` are overrepresented, the next
generation is steered toward `staged_accident` + `crime_as_accident`. The generator receives a curated
"AVOID / PREFER" summary (PART 13 Layer 1), not the full history.

### 3.3 "Psychological similarity" guard
The directive asks to detect "technically different but psychologically similar." We approximate this by
requiring that for any two cases in the last 10, at least **3 of the 10 fingerprint dimensions differ**.
This prevents `{wife/husband/partner} kills {spouse} for {inheritance/insurance/love}` from passing
merely because the noun changed — those differ only on `narrative_environment` and `crime_category`,
failing the "≥3 dimensions differ" rule.

---

## 4. Layered Historical Case Memory (PART 13)

The full case library is **never** fed to the generator every time (cost/context). Three layers:

| Layer | Content | Size | Used when |
|-------|---------|------|-----------|
| **L1 — Fingerprints** | The §2 structured metadata only | All published cases | Every generation: novelty scoring (§3) |
| **L2 — Short summaries** | 100–300 word prose recap | Last ~30 cases | When similarity is detected at L1; gives the LLM concrete "avoid this" examples |
| **L3 — Full canonical cases** | Complete structured JSON | On-demand / manual review | Deep validation or human review queue |

**Comparison cadence (PART 13):**
- **Last 10 cases:** strict (hard bans + ≥3-dimension-diff rule).
- **Last 30 cases:** moderate (soft diversity push, L2 summaries consulted).
- **Full library:** general trend monitoring (which mechanisms are overused across all time).

---

## 5. Generation integration

The pipeline (see `CASE_GENERATION_PIPELINE.md`) uses the novelty system at two points:
1. **Stage 1 (Novelty analysis):** read L1, pick underused `(crime_category, crime_structure,
   primary_mechanism, truth_structure)` combination → becomes the case blueprint constraint.
2. **Stage 15 (Similarity / repetition check):** after a candidate case is generated, recompute its
   fingerprint and apply §3. Reject + regenerate (bounded retries) if it fails.

---

## 6. Decision status

| Item | Status |
|------|--------|
| Multidimensional fingerprint (10 dimensions) | **APPROVED FROM USER DIRECTIVE** (PART 4) |
| Hard bans on recent structural clones | **RECOMMENDED** (PART 13) |
| Soft diversity push toward underused values | **APPROVED FROM USER DIRECTIVE** (PART 4 / DEC-024) |
| "≥3 dimensions differ" psychological-similarity guard | **RECOMMENDED** (PART 4) |
| Layered memory (L1 fingerprints / L2 summaries / L3 full) | **APPROVED FROM USER DIRECTIVE** (PART 13) |
| Comparison cadence: last 10 strict / last 30 moderate / library general | **APPROVED FROM USER DIRECTIVE** (PART 13) |
| Forbidden-content hard filter | **APPROVED FROM USER DIRECTIVE** (PART 4 / all directives) |
