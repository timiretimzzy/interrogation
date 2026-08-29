# Gameplay Simulation — The Interrogation

**Status:** PRODUCT MECHANICS LOCK (design only). No implementation.
**Companion to:** `RESPONSE_VARIABILITY_MODEL.md`, `PRODUCT_MECHANICS_LOCK.md`.

This document contains ONE fully specified case and three complete paper playthroughs, including a
player who receives *less helpful but still fair* response variants. It ends with an explicit fairness
audit answering the nine questions from the directive §11.

---

## PART 1 — THE CASE: "THE LAST TRAIN TO GREYBRIDGE"

**Genre:** Theft / suspicious incident (a valuable manuscript stolen; a passenger framed).
**Setting:** Overnight train, one sleeping car + dining car.
**Tone:** Tense, clever.
**Target length:** 10–16 minutes.

### 1.1 Briefing (shown to player)
> The Greybridge Codex — a manuscript worth a fortune — was being couriered overnight to the
> Greybridge Archive. At 22:45 the conductor found the codex missing and a near-identical facsimile in
> its place. Its appraiser, Edith Vance, was found groggy in her compartment, claiming she'd been
> drugged. Six people were awake on the train. The lights flickered for twenty minutes around 22:10.
> Nobody admits to taking it.

### 1.2 Canonical truth (NEVER shown in-game)
- **Culprit:** **Julian Reeve** (a bookseller passenger).
- **What happened:** Julian drugged Edith's wine with sedatives, swapped the real codex for a facsimile
  during the 22:05–22:25 power flicker, then planted the real codex in **Marcus Cole's** bag to frame
  him.
- **Motive:** Julian is deep in debt and was being **blackmailed by Edith**, who had discovered he'd
  previously sold a forged manuscript. The theft both pays his debt (buyer lined up) and removes the
  blackmailer.
- **Timeline:**
  - 21:40 Edith in dining car.
  - 21:45 Edith leaves dining car (she *believes* it was ~21:50 — honest misremember).
  - 22:00 Julian orders/settles his dining-car tab (he was there).
  - 22:05–22:25 power flicker; Julian makes the swap at Edith's compartment (~22:10).
  - 22:10 **Sasha** (attendant) sees Julian near Edith's compartment.
  - 22:15 **Dr. Okafor** briefly sees Marcus at the bar (true).
  - 22:30 Edith found groggy.
  - 22:45 conductor finds facsimile; codex discovered in Marcus's bag (planted).
- **Method:** sedatives (Julian took Dr. Okafor's loose prescription bottle) + facsimile swap.

### 1.3 Characters (6)

| Id | Name | Role | Personality | Truthful? | Secret / lie | Relevance |
|----|------|------|------------|-----------|--------------|-----------|
| Edith | Edith Vance | Appraiser (victim-adjacent) | cooperative, groggy | Mostly (misremembers time) | Secret: she was blackmailing Julian over a forgery — **relevant** (his motive) | Central |
| Julian | Julian Reeve | Bookseller (suspect) | charming, manipulative | **Liar** on whereabouts | Lies about being in his compartment asleep; secret: debt + forgery blackmail | **Culprit** |
| Marcus | Marcus Cole | Collector (suspect) | defensive | Truthful except… | **Innocent liar:** lies about an affair (embarrassment) — *unrelated* to crime | Framed |
| Sasha | Sasha Lindqvist | Attendant (witness) | open, precise | Truthful | None | Key witness |
| Okafor | Dr. Okafor | Physician (bystander) | cautious, precise | Truthful | Secret: loose prescription practice (unrelated); his pills were stolen | Truthful-but-suspicious |
| Hale | Conductor Thomas Hale | Employee (investigator) | formal, helpful | Truthful | None | Provides timeline/evidence |

### 1.4 Contradictions (authored; surfaced as "⚠ possible inconsistency")
- **C1:** Julian *"asleep in my compartment all evening"* vs **Sasha** *"saw Mr. Reeve by Mrs. Vance's compartment at 22:10."*
- **C2:** Julian *"I was in the dining car only around nine, then straight to bed"* vs **dining-car receipt** showing he paid at **22:00** (during the flicker).
- **C3:** Marcus *"I was alone in the lounge all evening"* vs **Okafor** *"I saw Marcus at the bar at 22:15."* → points at the **innocent liar** (demonstrates liar ≠ culprit).

### 1.5 Evidence reachable through interrogation
- **E1 Sedative vial** — found by questioning Julian about his "travel medication," or Okafor about his
  missing prescription bottle.
- **E2 Dining-car receipt** (Julian, 22:00) — provided by Sasha or Hale.
- **E3 Facsimile codex in Marcus's bag** — revealed by Hale (the planting).

### 1.6 Two independent solution paths
- **Path A (witness-led):** Sasha (sees Julian) → confront Julian → Okafor (Edith drugged, sedatives) →
  Hale (timeline + receipt + facsimile-in-Marcus-bag) → **accuse Julian / theft-by-drugging-and-
  framing / debt + blackmail.**
- **Path B (evidence-led):** Okafor (Edith drugged; his pills missing) → Julian questioned about
  medication → find vial (E1) → dining receipt (E2, Julian at scene during flicker) → Hale (facsimile
  planted in Marcus's bag, C3 context) → **same accusation.**

Both satisfy redundancy: Julian's presence at 22:10 is available via **Sasha (C1)** *and* **the receipt
(E2)**; the drug is available via **Okafor's exam** *and* **the vial (E1)**.

---

## PART 2 — RESPONSE VARIANTS (illustrative)

Only the pivotal questions are shown; each demonstrates the variability model.

**Q1 → Julian: "Where were you between 10 and 10:30 PM?"** (`category: opening`, scope Julian)
- `initial` variants:
  - **vA** (weight 0.5, DEFLECTING, truthState FALSE): *"Why are you asking me that? I was in my
    compartment, asleep."* discloses: none. unlocks: pressure card.
  - **vB** (weight 0.3, GUARDED, truthState PARTIALLY_TRUE): *"I went to the dining car once, around
    nine, then straight to bed."* discloses: partial (he was in dining car — helps player). unlocks: a
    follow-up "what did you eat?"
  - **vC** (weight 0.2, OPEN, truthState FALSE): *"I barely left my seat all night."* discloses: none.
- `after_contradiction_C1` variant (revised): *"Okay — I stepped out during the flicker. So what?"*
  (REVISED, PARTIALLY_TRUE) → unlocks evidence question about the vial (E1).

**Q2 → Edith: "What time did you leave the dining car?"** (`opening`, scope Edith)
- vA (0.6, OPEN, FALSE-from-mistake): *"Around quarter to ten, I think."* discloses partial (~21:45–21:50).
- vB (0.4, GUARDED, UNKNOWN): *"I'm not certain of the exact time. Late, though."* discloses partial/none.
  *(Edith's timeline is NOT a critical path; either variant is safe.)*

**Q3 → Sasha: "Did you see anything unusual around 10 PM?"** (`opening`, scope Sasha)
- vA (0.7, OPEN, TRUE): *"Yes — I saw Mr. Reeve near Mrs. Vance's compartment at about ten past ten."*
  discloses full; unlocks Julian confrontation (C1); creates C1.
- vB (0.3, GUARDED, PARTIALLY_TRUE): *"I suppose I saw someone by the compartments, but I didn't get a
  good look."* discloses partial (someone was there, unnamed); unlocks a vaguer follow-up.
  *(Even vB yields a lead; redundancy with E2 keeps the case solvable.)*

**Q4 → Marcus: "Were you involved with anyone on this trip?"** (`opening`, scope Marcus) — the affair
red herring
- vA (0.5, DEFLECTING, FALSE — innocent lie): *"No, I kept to myself."* (he had an affair; embarrassed)
- vB (0.5, GUARDED, FALSE — innocent lie): *"I'd rather not discuss my personal life."*
  *(Marcus lies here, but it is unrelated to the theft; C3 later shows he was at the bar, not that he
  stole anything.)*

---

## PART 3 — PLAYER A (highly analytical)

**Variants received:** Sasha vA (sees Julian), Okafor vA (Edith drugged, sedatives missing), Julian vA
then `after_C1` revised (admits he stepped out).
1. Reads briefing → suspects whoever had access during the flicker.
2. **Sasha** → Q3 vA → *"saw Mr. Reeve by Mrs. Vance's compartment at 22:10."* → ⚠ C1 flagged; unlocks
   Julian confrontation.
3. **Julian** → Q1 vA (deflecting) → returns with confrontation card → `after_C1` revised → *"I stepped
   out during the flicker."* → unlocks vial question.
4. **Okafor** → Q (Edith's condition) vA → *"She was sedated, not ill. My prescription bottle is
   missing."* → E1 (vial) context; establishes drug.
5. **Hale** → Q (timeline) → receipt (E2, Julian paid 22:00) + facsimile found in Marcus's bag (E3, the
   planting).
6. **Accusation:** Julian / theft-by-drugging-and-framing / debt + blackmail → **WIN** in ~10 actions.
   **Inference:** C1 + revised admission + drug + planting = Julian. Clean, efficient.

---

## PART 4 — PLAYER B (normal, explores naturally)

**Variants received:** Marcus vA (affair lie), Sasha vA, Okafor vA, Julian vB (partly truthful), then
confrontation.
1. **Marcus** → Q4 vA → *"I kept to myself."* (looks secretive — red herring).
2. **Edith** → Q2 vA → *"Around quarter to ten."*
3. **Julian** → Q1 vB → *"I went to the dining car once, around nine."* (places him there — useful!).
4. **Sasha** → Q3 vA → sees Julian at 22:10 → ⚠ C1 → confrontation unlocked.
5. Returns to **Julian** → confrontation → revised → admits stepping out → vial question.
6. **Okafor** → sedated + missing pills (E1).
7. **Hale** → receipt (E2) + facsimile in Marcus's bag (E3) → realizes Marcus was *framed*, not guilty.
8. **Accusation:** Julian / framing / debt+blackmail → **WIN** in ~14 actions. **Inference:** B chased
   the Marcus red herring but the witness + receipt + planting revealed the truth.

---

## PART 5 — PLAYER C (inefficient; receives LESS-HELPFUL but FAIR variants)

**Variants received:** Julian vA (deflecting, withholds), Edith vA (misremembers), Sasha **vB**
("someone by the compartments, not a good look"), Okafor vA (truthful medical facts), Marcus vA (affair
lie), Hale vA (full timeline + receipt + facsimile).
1. **Julian** → Q1 vA → *"Why are you asking? I was asleep."* (withholds; no lead).
2. **Edith** → Q2 vA → misremembers time (unhelpful for the critical path).
3. **Marcus** → Q4 vA → affair lie (red herring; C wastes a question).
4. **Okafor** → vA → *"She was sedated. My pills are missing."* (truthful; E1 context, but C doesn't yet
   connect pills to Julian).
5. **Sasha** → Q3 **vB** → *"I saw someone by the compartments, not a good look."* (partial — no name,
   but a lead).
6. **Hale** → vA → full timeline + **receipt E2 (Julian paid 22:00, during flicker)** + **facsimile in
   Marcus's bag E3**.
7. C now has: someone by compartments (Sasha, vague) + Julian at dining car at 22:00 (receipt) + drug
   (Okafor) + codex planted in Marcus's bag (Hale). The **receipt (E2)** is the redundant route that
   saves C despite Julian's withheld vA and Sasha's unnamed vB.
8. C returns to **Julian** with the receipt confrontation → `after_C2` revised → admits presence → vial.
9. **Accusation:** Julian / framing / debt+blackmail → **WIN** in ~17 actions (near the soft budget).
   **Fairness demonstrated:** even the *least helpful* variants never blocked progress, because the
   critical facts (Julian's presence, the drug) each had an independent second route (receipt; vial via
   Okafor). A *truly wasteful* player who never asks Hale or Sasha could exhaust the budget and lose —
   that is legitimate budget pressure, not unfairness (INVARIANT F holds).

---

## PART 6 — FAIRNESS & SOLVABILITY AUDIT (directive §11)

**1. Is each path solvable?** Yes. Path A and Path B verified above; both reach the correct accusation
within budget. The solver (architecture proposal §14) would confirm ≥2 paths under worst-case variants.

**2. Does any response variant unfairly block progress?** No. By INVARIANT F (§7), every critical fact
has ≥2 routes; the least-helpful variant (Julian vA, Sasha vB) withholds only *one* route while the
other (receipt E2 / Okafor E1) remains open. Player C proves this.

**3. Is the case interesting after the first 5 minutes?** Yes. The framing of Marcus (E3) and Okafor's
suspicious-but-innocent pills create two misleading paths; the C3 innocent-liar contradiction rewards
careful reading; the reveal (Edith's blackmail motive) is a "wait" moment.

**4. Does questioning feel repetitive?** No. Questions are case-specific (dining car, the flicker, the
vial, the receipt), not generic "where were you?" spam; unlocks evolve the set.

**5. Can a player make meaningful strategic choices?** Yes. Pursue Sasha (witness) vs Okafor (medical)
vs Hale (timeline) leads to different but valid paths; confronting vs not changes Julian's later
answers (context switch).

**6. Is the culprit obvious because they lie?** No. Julian lies, but so does **innocent Marcus** (affair);
**Okafor** is suspicious (had pills) yet truthful. "Liar = culprit" fails (INV-109).

**7. Can innocent characters lie without making the game unfair?** Yes — Marcus's affair lie is unrelated
and redundant-safe; C3 even uses it to teach that lies ≠ guilt.

**8. Does the case depend on outside knowledge?** No. Every fact needed (flicker time, receipt, drug,
planting) is in-game (INV-106).

**9. Does the player feel clever when solving it?** Yes — the solution requires reconciling Sasha's
sighting + the receipt + the planting, not a single labeled answer. The reveal explains Edith's
blackmail, the stolen pills, and why Marcus was framed.

**If any answer were NO,** the fix would be: add a redundant route for the blocked fact, lower a
withholding variant's weight, or re-author the contradiction. None is required for this case.

---

## PART 7 — What this simulation proves

- The **stop-condition test** holds: replace the cast with Curie/Einstein and the contradiction graph,
  the receipt, the vial, and the framing collapse — the game depends on narrative context, not
  attributes.
- **Response variability is real but fair:** Players A/B/C experienced materially different interrogations
  (different variants, different routes) yet all reached the truth because of authored redundancy.
- **Deception is never labelled:** Julian's deflecting vA shows no badge; the player must earn C1 via
  Sasha.
- **Accusation is multidimensional:** culprit + what + motive (+ the framed-evidence nuance), not "pick a
  name."
