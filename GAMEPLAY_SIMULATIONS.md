# Gameplay Simulations — The Interrogation

**Status:** PRODUCT MECHANICS LOCK (design only). No implementation.
**Companion to:** `GAMEPLAY_CORE_LOOP.md`, `INTERROGATION_SYSTEM.md`, `INFORMATION_ARCHITECTURE.md`,
`ACTION_ECONOMY_PROPOSAL.md`.
**Authority:** User directive PART 11 (one deep case) + PART 16 (TWO structurally different full
simulations, 3 players each, 9-question audit).

Two **complete** hypothetical cases are simulated below. They are deliberately **structurally
different** (different crime category, truth structure, primary mechanism, emotional tone) so the
design is tested against variety, not one template with renamed nouns.

- **Simulation A — "The Halcyon Heist"** (art theft; inside job; false prime suspect + innocent liar;
  hinge = opportunity paradox + physical evidence).
- **Simulation B — "The Vale Disappearance"** (staged disappearance / fraud; victim-hiding; hinge =
  witness inconsistency + hidden relationship + timeline anomaly).

For each: opening, cast, canonical truth, then Player A (analytical), Player B (normal), Player C
(inefficient, less-helpful but fair variants). Each player shows switching, lead discovery, question
unlocks, an apparent contradiction, an innocent lie, a confrontation, theory formation, accusation,
reveal. A fairness audit (PART 11 / PART 16 nine questions) follows each, and a cross-comparison closes
the doc.

> Variant notation: `Char-Q-vX` = character, question, variant letter. Lower letters (vA/vB) = more
> cooperative; higher (vC/vD) = more evasive/withholding. Selection is seeded per `RESPONSE_
> VARIABILITY_MODEL.md` §4, so Player C's less-helpful run is a *different seed*, not bad luck on the
> same case.

---

# SIMULATION A — THE HALCYON HEIST

## A.0 Opening (2–5 sentences, PART 9)
> At 11:42 PM the lights went out at the Halcyon Gallery for seventeen seconds during the charity
> auction. When they returned, a painting worth $14 million — "The Drowning Saint" — was gone from its
> locked display.
> Six people were inside. None admits to seeing anyone take it. The security system never logged a
> breach.

Hook ✔ · What/where/when ✔ · Immediate tension ("never logged a breach") ✔ · Player objective implied
("find out what happened").

## A.1 Cast (6; Medium tier)
| Id | Role | Profile | Truth role |
|----|------|---------|-----------|
| Vivian | Owner/host | Cooperative | Innocent |
| Marcus | Head of security | Calculating | **CULPRIT** |
| Sofia | Auctioneer | Manipulative | Innocent (redirects to Daniel) |
| Daniel | Collector guest | Defensive | **FALSE PRIME SUSPECT** (innocent) |
| Eleanor | Curator | Nervous | **INNOCENT LIAR** (affair) |
| Tom | Night technician | Cooperative | Key witness |

## A.2 Canonical truth
Marcus (security head) remotely triggered the 17-second blackout from the panel only he could access,
swapped the real painting for a pre-staged replica in the maintenance closet, and later moved it out.
Motive: gambling debts; a buyer ("the Collector") offered $3M. Daniel argued publicly with Vivian about
the painting's valuation and stood near the display — looks guilty, did nothing. Eleanor lied about
being with Vivian all evening (she was with a lover, not Vivian) to protect her reputation — unrelated
to the theft. Tom knows the blackout was a *remote trigger*, not a fuse.

## A.3 Tier A facts (4) and routes (INV-114)
- **A1** Blackout was a remote trigger (only security access). Routes: Tom testimony; building log
  (evidence, independent); Marcus's slip under pressure.
- **A2** Marcus had access + motive. Routes: financial records (evidence); Sofia's comment; Marcus's slip.
- **A3** Painting swapped (replica in closet), not walked out. Routes: Tom saw Marcus near closet;
  replica found (evidence, unlocked).
- **A4** Daniel is innocent (stationary). Routes: Daniel's alibi; CCTV (evidence).

## A.4 Contradictions
- **C1 (HIGH, opportunity):** Marcus "I monitored the control room the whole time" vs Tom "I saw Marcus
  leave the control room at 11:40 toward the east wing."
- **C2 (HIGH, knowledge):** Marcus "It was a power fault" vs Tom "Logs show a remote trigger, not a
  fault."
- **C3 (PARTIAL, red herring):** Eleanor "With Vivian all evening" vs guest "Saw Eleanor leave the VIP
  lounge alone ~11." (compatible if she left later — innocent lie, not the crime.)

## A.5 Lie motivations
Marcus: `MAINTAIN_ALIBI` / `SELF_PROTECTION` (guilty). Eleanor: `EMBARRASSMENT` (innocent).

---

## A.6 Player A — analytical (~10 actions, Excellent)
1. **Read briefing** → suspects whoever controlled the blackout.
2. **Interrogate Tom** (technician): *"What caused the blackout?"* → **Tom-Blackout-vA** (truthful):
   "The logs show a remote trigger from the security panel, not a fuse." → clue *remote trigger* →
   unlocks **Marcus confrontation re: access**.
3. **Interrogate Marcus**: *"Were you in the control room?"* → **Marcus-Control-vA** (lie): "I monitored
   the whole time." → conflicts with Tom → Notebook flags **⚠ C2**.
4. **Earns confrontation** (leverage from C2).
5. **Confront Marcus** ("You said power fault; Tom says remote trigger") → context `after_contradiction_
   C2` → **Marcus-Control-vB** (revised, partial): "Fine, a glitch in the panel. But I didn't steal
   anything." → unlocks **evidence question re: replica**.
6. **Interrogate Sofia**: *"Who benefits?"* → **Sofia-Benefit-vA** (manipulative): "Daniel argued with
   Vivian about the painting." → red-herring pointer to Daniel.
7. **Interrogate Daniel**: *"Were you near the display?"* → **Daniel-Display-vA** (truthful): "Yes,
   admiring it. I never touched it." → alibi.
8. **Find access log** (evidence, unlocked by Tom's clue) → **present to Marcus** → context
   `after_evidence` → **Marcus-Log-vC** (slip): mentions *"the Collector."*
9. **Interrogate Tom** re closet: *"Did you see Marcus near the maintenance closet?"* → **Tom-Closet-vB**:
   "Yes, 11:41, carrying a flat tube." → replica discovered (evidence).
10. **Theory:** Marcus staged the blackout, swapped the painting, sold to the Collector. **Accuse:**
    Marcus / inside-job swap / gambling debts + Collector. → **WIN (Excellent).**

## A.7 Player B — normal (~14 actions, Solved)
1. **Interrogate Daniel** first (false prime suspect): *"Why argue with Vivian?"* → **Daniel-Argue-vA**:
   "Valuation dispute, nothing more."
2. **Interrogate Eleanor**: *"Were you with Vivian?"* → **Eleanor-Vivian-vA** (innocent lie): "All
   evening." → looks suspicious (red herring C3).
3. **Interrogate Sofia**: *"What happened during the blackout?"* → **Sofia-Blackout-vA**: "Dark, then
   the painting was gone."
4. **Interrogate Marcus**: *"What happened?"* → **Marcus-Control-vA** (lie): "Power fault; stolen by
   someone outside."
5. **Interrogate Tom**: *"Blackout cause?"* → **Tom-Blackout-vA**: remote trigger → unlocks Marcus
   confrontation.
6. **Return to Marcus**, confront re remote trigger → revised partial.
7. **Discover access log** → present to Marcus → slip re Collector.
8. **Interrogate Sofia** re Marcus: *"Financial pressure?"* → **Sofia-Marcus-vB** (Tier B): "He's been
   jumpy, mentioned debts."
9. **Re-examine Eleanor** → realizes her lie is an affair (unrelated), not the theft.
10. **Interrogate Tom** re closet → replica.
11. **CCTV** confirms Daniel stationary.
12. **Theory:** Marcus, not Daniel. **Accuse Marcus.** → **WIN (Solved).** Slower; different route
    (started at the red herring, corrected via evidence).

## A.8 Player C — inefficient, less-helpful variants (~17 actions, Solved)
Player C's seed yields more evasive/withholding variants; fairness holds via Tier A redundancy.
1. **Interrogate Marcus** first: *"In control room?"* → **Marcus-Control-vC** (deflecting): "Why ask me?
   I run security — of course I was monitoring." (obscures; no explicit lie, but withholds *remote*.)
2. **Interrogate Eleanor**: *"With Vivian?"* → **Eleanor-Vivian-vB** (evasive): "I had my own evening to
   attend to." (withholds affair; fair — doesn't block.)
3. **Interrogate Daniel**: *"Near display?"* → **Daniel-Display-vB** (guarded): "I was around; people
   saw me. Ask them." (truthful but unhelpful tone.)
4. **Interrogate Sofia**: *"Who benefited?"* → **Sofia-Benefit-vB** (vague): "The art world is full of
   motives." (no specific pointer.)
5. **Interrogate Tom**: *"Blackout?"* → **Tom-Blackout-vC** (UNCERTAIN, justified): "I remember the panel
   light blinking oddly — I couldn't say exactly what triggered it." → *does not* give the clear
   "remote trigger" statement. **But** the **building/access log (evidence) is independently available**
   (Tier A redundant route for A1).
6. **Examine maintenance closet** (evidence, available regardless) → finds **replica**.
7. **Present replica to Marcus** → context `after_evidence` → **Marcus-Replica-vB** (lie): "That's a
   decorative copy, not the original." (player now knows better.)
8. **Re-interrogate Tom** re Marcus's location → **Tom-Control-vA** (truthful, this variant): "I saw
   Marcus leave the control room at 11:40." → contradiction **C1** flagged.
9. **Confront Marcus** re location → revised.
10. **Re-examine Eleanor** → her evasion now reads as the affair (innocent).
11. **Accuse Marcus** (solvable via replica + C1 + independent log). → **WIN (Solved).** Slower; the
    *least-helpful* variant set still left independent evidence routes open.

## A.9 Fairness audit (PART 11 nine questions)
1. **Each path solvable?** Yes — A (witness-led), B (red-herring-then-evidence), C (evidence-led via
   redundant routes). ≥2 independent paths confirmed (INV-007).
2. **Did variation materially change experience?** Yes — C's evasive variants made the case feel more
   obstructed, but the *structure* of discovery was the same; C simply worked harder.
3. **Did variation unfairly block?** No — every Tier A fact had a redundant route; C's withheld
   "remote trigger" statement was covered by the independent log/evidence (INV-114).
4. **"Aha" moment?** Yes — the replica + Marcus's "decorative copy" lie, or C1 location clash.
5. **Meaningful choices?** Yes — whom to meet first; whether to chase Daniel (red herring) or Tom
   (witness); when to confront Marcus.
6. **Tension before accuse?** Yes — C3 (Eleanor) and Sofia's redirect create doubt about Daniel.
7. **Under 20 min?** Yes — 10/14/17 actions within the 16-budget Medium tier (System D).
8. **Culprit obvious from lying?** No — Daniel (innocent) is the obvious suspect; Marcus lies but is
   initially low-suspicion; Eleanor (innocent) also lies (INV-109).
9. **Feels clever?** Yes — solution requires reconciling remote-trigger + replica + access, not a label.

---

# SIMULATION B — THE VALE DISAPPEARANCE

## B.0 Opening
> At 2:14 AM, during the final night of filming "The Lighthouse Keeper" on a remote coastal set, lead
> actor Adrian Vale vanished. His trailer was locked from the inside. His phone, wallet, and car were
> still there.
> The last person to see him was the director, at 1:50 AM. The tide was coming in; by morning his
> footprints led only to the cliff edge.

Hook ✔ · Tension ("locked from inside" + "footprints only to cliff") ✔ · Objective: was it murder,
suicide, or something else?

## B.1 Cast (6; Medium tier)
| Id | Role | Profile | Truth role |
|----|------|---------|-----------|
| Maya | Director | Manipulative | Innocent (last seen; **innocent liar** re affair) |
| Adrian | Lead actor | — | **RESPONSIBLE PARTY** (staged his own disappearance) |
| Cole | Stunt coordinator | Defensive | Innocent (argued with Adrian — false prime suspect) |
| Priya | Production accountant | Calculating | Key witness (Adrian's financial ruin) |
| Theo | Location/boat handler | Cooperative | Key witness (saw the boat) |
| Nina | Co-star | Emotional | Reveals Maya's lie (red herring) |

## B.2 Canonical truth
Adrian **staged his own disappearance** (a fraud/escape): he locked the trailer from inside via a
string trick, placed his footprints turning back from the cliff, and left by a small boat at 2:30 AM.
Motive: imminent ruin — a collapsing production company he'd personally guaranteed, plus a scandal. His
accomplice was **Theo** (the boat handler), paid off. Maya (director) lied about being "alone editing"
— she was with Nina (co-star, affair) — an innocent lie that makes her look guilty of *covering
something*. Cole argued with Adrian (looks like foul play; he did nothing).

## B.3 Tier A facts (4)
- **A1** Adrian left by sea (not dead at cliff). Routes: Theo testimony; tide/timeline anomaly
  (footprints stop at cliff but no body/struggle); the boat's fuel log (evidence).
- **A2** Trailer locked via trick, not proof he was inside. Routes: grip/prop-master observation;
  forensic note (evidence, unlocked).
- **A3** Adrian had motive + hidden accomplice. Routes: Priya testimony (financial); Theo's slip.
- **A4** Maya's "alone" lie is unrelated (affair), not the disappearance. Routes: Nina testimony.

## B.4 Contradictions
- **C1 (HIGH, knowledge/timeline):** Maya "Adrian was distraught, spoke of ending it all" (suicide
  narrative) vs Theo "A calm person boarded a boat at 2:30, not struggling" → suicide vs staged-escape.
- **C2 (HIGH, behavioral):** Adrian's last text to Priya "I'm done, meet me at the dock" vs his public
  "I'd never leave the film."
- **C3 (PARTIAL, red herring):** Maya "alone editing" vs Nina "saw Maya with someone" → innocent liar
  (affair).

## B.5 Lie motivations
Maya: `EMBARRASSMENT` (innocent). Adrian: `SELF_PROTECTION` / `MAINTAIN_ALIBI` (guilty of staging/fraud).
Cole's argument is honest, not a lie.

---

## B.6 Player A — analytical (~11 actions, Excellent)
1. **Read briefing** → "suicide or murder?"
2. **Interrogate Theo** (boat handler): *"What did you see at 2:30?"* → **Theo-Boat-vA** (truthful): "A
   small boat picked someone up, calm, not struggling." → shatters suicide narrative → unlocks
   **Maya confrontation re: suicide claim**.
3. **Interrogate Priya**: *"Adrian's finances?"* → **Priya-Finance-vA**: "The production company was
   collapsing; he'd personally guaranteed it." → motive.
4. **Confront Maya** ("You said he was ending it; Theo saw a calm boat exit") → context `after_
   contradiction_C1` → **Maya-Suicide-vB** (revised): "He was upset, yes — but I didn't see him leave."
   → undermines suicide.
5. **Interrogate Theo** re accomplice: *"Who arranged the boat?"* → **Theo-Boat-vB**: "Paid by someone
   inside — Adrian himself, I think." → A3.
6. **Interrogate Cole** (false suspect): *"Argument with Adrian?"* → **Cole-Argue-vA** (truthful): "Yes,
   about a stunt — nothing violent." → clears Cole.
7. **Find forensic note** (evidence, unlocked by trailer observation) → trailer locked via trick.
8. **Theory:** Adrian staged it, left by boat with Theo's help, to escape ruin. **Accuse:** Adrian /
   staged his own disappearance / financial ruin + escape. → **WIN (Excellent).**

## B.7 Player B — normal (~15 actions, Solved)
1. **Interrogate Maya** (last seen): *"Last time you saw Adrian?"* → **Maya-Last-vA** (manipulative):
   "Distraught. Spoke of ending it all." → suicide narrative.
2. **Interrogate Nina**: *"Maya alone?"* → **Nina-Maya-vA**: "No, I saw her with someone." → ⚠ C3
   (Maya's lie).
3. **Realize Maya's lie is an affair** (innocent red herring), not the disappearance.
4. **Interrogate Cole**: *"Argument?"* → **Cole-Argue-vA** → clears Cole (false suspect).
5. **Interrogate Theo**: *"2:30?"* → **Theo-Boat-vA**: calm boat exit → shatters suicide.
6. **Confront Maya** re suicide vs boat → revised.
7. **Interrogate Priya**: *"Finances?"* → **Priya-Finance-vA** → motive.
8. **Interrogate Theo** re accomplice → **Theo-Boat-vB** → Adrian arranged it.
9. **Forensic note** → trailer trick.
10. **Theory:** staged. **Accuse Adrian.** → **WIN (Solved).** Different entry (Maya's lie first).

## B.8 Player C — inefficient, less-helpful variants (~18 actions, Solved)
1. **Interrogate Maya** first: *"Last saw Adrian?"* → **Maya-Last-vC** (deflecting): "Ask the others;
   I'm not his keeper." (withholds suicide narrative — fair, doesn't block.)
2. **Interrogate Cole**: *"Argument?"* → **Cole-Argue-vB** (guarded): "We had words. People argue."
   (truthful, unhelpful tone.)
3. **Interrogate Theo**: *"2:30?"* → **Theo-Boat-vC** (UNCERTAIN, justified): "I remember lights on the
   water — I couldn't swear it was a boat." → *does not* give the clear "calm person boarded" statement.
   **But** the **tide/timeline anomaly** (footprints stop at cliff, no struggle, no body) is an
   **independent Tier A route for A1**.
4. **Interrogate Priya**: *"Finances?"* → **Priya-Finance-vB** (calculating, vague): "Productions are
   complicated." (withholds collapse detail; A3 also reachable via Theo's later slip.)
5. **Examine trailer** (evidence, available regardless) → forensic note: locked via trick (A2,
   independent).
6. **Re-interrogate Theo** re accomplice → **Theo-Boat-vA** (this variant): "Paid by someone inside."
7. **Confront Maya** with the boat/timeline evidence → revised.
8. **Re-examine Nina** → Maya's affair (innocent).
9. **Accuse Adrian** (solvable via footprint anomaly + trailer trick + Theo's accomplice). → **WIN
   (Solved).** The *least-helpful* variants still left the independent physical-evidence routes open.

## B.9 Fairness audit (PART 11 nine questions)
1. **Solvable?** Yes — A (witness-led), B (Maya-lie-led), C (evidence/timeline-led). ≥2 paths.
2. **Variation changed experience?** Yes — C's uncertain variants made the "suicide vs staged" reveal
   slower, but physical evidence carried the case.
3. **Variation blocked?** No — Tier A facts A1/A2 had independent physical-evidence routes (INV-114).
4. **"Aha" moment?** Yes — the calm boat exit (or footprint anomaly) reframes the whole case from
   "who killed him" to "he left deliberately."
5. **Meaningful choices?** Yes — trust Maya's suicide narrative or challenge it; pursue Cole (red
   herring) or Theo (witness).
6. **Tension before accuse?** Yes — C3 (Maya's affair) and Cole's argument create "who covered what."
7. **Under 20 min?** Yes — 11/15/18 within Medium 16-budget (C slightly over but recovers via free
   investigation; accusation free).
8. **Culprit obvious from lying?** No — Maya (innocent) lies most visibly; Adrian (responsible) lies by
   omission/staging, not a blatant confession (INV-109).
9. **Feels clever?** Yes — the hinge is "what *happened*" (staged, not murdered), a different deduction
   than Simulation A's "who took it."

---

# CROSS-COMPARISON (PART 16 requirement 8: cases feel different)

| Axis | Simulation A (Halcyon Heist) | Simulation B (Vale Disappearance) |
|------|-------------------------------|------------------------------------|
| crime_category | art_theft | disappearance / fraud |
| crime_structure | inside_job | staged_event / victim_hiding |
| truth_structure | false_prime_suspect + innocent_liar | victim-is-responsible + innocent liar |
| primary_mechanism | opportunity_paradox + physical_evidence (replica) | witness_inconsistency + hidden_relationship + timeline_anomaly |
| emotional_tone | elegant / noir heist | psychological / tense coastal |
| central question | "who physically took it?" | "what *happened* to the person?" |
| dominant solution route | evidence-led (replica/log) | timeline/physics-led (boat/footprints) |
| accusation shape | culprit + method(swap) + motive | responsible party (the victim) + what(staged) + motive(ruin) |

The fingerprint dimensions differ on **≥6 of 10** axes (CASE_NOVELTY_SYSTEM §3.3) — they are not the
same game in different clothes. Both satisfy all nine fairness questions, confirming the mechanics are
robust across structures.

---

# WHAT THIS SIMULATION PROVES

- The **same engine** (QuestionResolution + variant blocks + leverage contexts + contradiction links +
  Tier A redundancy) supports two genuinely different mysteries.
- **Response variability** changes *feel* (Player C's obstructed run) without changing *fairness* (Tier
  A redundancy guarantees a solvable path regardless of seed).
- **Innocent liars** (Eleanor, Maya) create real red herrings without implying guilt (INV-109).
- **Confrontation** is earned via contradiction/evidence leverage, never a reroll (INTERROGATION_SYSTEM
  §3).
- **Accusation** is a theory (culprit/what/motive), graded, not a name-pick.

No source code was written; this is a paper validation of the design in `GAMEPLAY_CORE_LOOP.md`,
`INTERROGATION_SYSTEM.md`, and `INFORMATION_ARCHITECTURE.md`.
