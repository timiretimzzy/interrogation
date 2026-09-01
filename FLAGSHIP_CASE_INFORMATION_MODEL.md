# Flagship Case Information Model — The Last Broadcast

## Scope and locked decisions

This is the authoritative Phase 4.3.1 information architecture. Planning identifiers are
traceability labels, not production IDs. No JSON, dialogue, UI, or engine change is
specified here. The still-live legacy cases are not inspected, modified, or used as a
design reference.

Locked interpretation: the hostile audio heard at 9:12 is a rehearsal segment recorded
the previous day, not the real 8:52 argument. Its similarity to the real conflict is
intentional misdirection, but the two events are distinct.

## 1. Canonical truth lock

### 1.1 Actual crime

| Aspect | Locked truth |
| --- | --- |
| Victim | Mara Venn, investigative radio host. |
| Culprit | Priya Nair, station sound engineer and Mara’s trusted technical confidante. |
| Method | Priya replaces one lemon lozenge in a newly supplied studio tin with an identical lozenge dosed with aconitine from a monkshood prop tincture. Mara consumes it at 9:03 and collapses at 9:11. |
| Immediate motive | Prevent Mara from disclosing Priya’s paid deletion of the archive recording that proves Adrian Kells’s charity fraud. |
| Deeper motive | Priya cannot tolerate the collapse of her professional identity as Mara’s trusted guardian of the record, nor the likely criminal and financial consequences of the deletion. |
| Opportunity | Priya alone routinely stages broadcast playback, replenishes Studio B supplies, knows Mara always selects lemon before an opening, and knows Mara will be absent from the microphone. |
| Preparation | On the prior day, Mara and Priya record an 18-minute continuity segment. At 8:35 Priya queues it for 9:00, routes it through the normal program chain, and makes the Studio B status indicator read LIVE. At 8:47 she swaps the lozenge. |
| Execution | Mara begins the scheduled segment, receives June at 9:03, takes the poisoned lozenge, enters Studio B at 9:06 for a private 9:15 call, and dies before it occurs. |
| Cover-up | Priya lets the prerecorded segment establish a false live timeline, stops playback at 9:14, calls for help, and deletes the local console edit history. |
| Intended deception | Investigators should infer an on-air collapse after Elias’s apparently live threat, or a direct murder arranged by Kells. |
| Unexpected consequences | The playout server retains queue metadata; an independent compliance recorder retains the broadcast waveform and stop time; the refill vendor’s invoice fixes the tin’s arrival; June saw the lemon selected; the archive system retains an authorization audit. |

**Priya intended:** a death that appeared to be a sudden medical event while Mara was
apparently live, leaving Elias’s apparent 9:12 confrontation and Kells’s real pressure as
ready-made explanations.

**What happened:** Mara died before the prerecorded hostile segment aired. Priya's local
deletion made her discovery narrative less credible, and the surviving systems connect
her access, her motive, and her manipulation.

**What Priya expects investigators to conclude:** either Elias poisoned Mara after a live
argument, Kells commissioned an inside murder, or Mara knowingly overdosed amid pressure.
Priya does not expect the broadcast itself to be treated as false temporal evidence.

### 1.2 Earlier cover-up: the Harbour Relief recording

Six months earlier, Kells directed Harbour Relief donations through **North Quay
Consulting**, a shell supplier. During a recorded donor meeting, Kells privately told a
compliance officer that the consultancy existed to “keep the relief money moving where it
is useful.” The officer made a copy and anonymously gave it to Mara’s program.

Kells’s solicitor sent the station a superficially credible privacy complaint. Priya,
acting as archive custodian, was paid by Kells to remove the recording from the station
archive and mark it as a rights-risk duplicate pending review. She accepted because she
believed she was facilitating a lawful takedown; the payment was improper, but she did
not then understand the fraud’s scale. Tomas’s retention override made the deletion
appear administratively legitimate.

Mara later finds a partial waveform reference in her research notes and obtains the
whistleblower’s assurance that the donor recording was authentic. She confronts Kells
with a proposed 9:15 private call: return the money and identify the shell arrangement,
or she will publish. Kells sends Priya “make the file disappear before tonight.” Priya
reads this as proof that Mara has found the deletion and sees no believable way to admit
her role without becoming Kells’s scapegoat. Murder is her unilateral escalation, not
Kells’s instruction.

Surviving evidence: payment ledger, message metadata and wording, retention-override
audit, Priya’s authorization, Tomas’s system log, Mara’s waveform note, and the
compliance recorder’s backup of the new broadcast. The public false explanation is a
routine rights-risk deletion under legal review. This earlier incident supplies Priya’s
personal motive, Kells’s plausible homicide motive, the technical archive environment,
and a false theory that payment proves murder-for-hire.

### 1.3 Prerecorded broadcast mechanism

Mara recorded a normal 18-minute continuity segment the previous afternoon with Priya:
an investigative recap, a scripted adversarial exchange with Elias, and the closing
phrase “keep the channel open.” She planned to air it from 9:00 to 9:18 so she could
take a secure 9:15 call outside the microphone without exposing the whistleblower or
Kells to a live audience. Elias knew the segment existed and that its argument was
rehearsed; June knew Mara sometimes used continuity segments but not this schedule;
Priya knew the entire plan and could operate it. Kells knew only that Mara proposed a
private 9:15 call. Tomas and Rowan did not know about the segment.

At 8:35 Priya uses the station’s ordinary playout system to queue the recorded segment
against the 9:00 slot. The automation plays it through the normal transmitter path; an
audience hears station identifiers, Mara’s voice, and the scheduled exchange exactly as
it would a live program. Priya switches Studio B’s local `LIVE` tally from microphone
state to program-output state, a deceptive but physically ordinary console routing
change. It fools a casual observer in the building, not the listeners directly.

Independently discoverable anomalies are: (1) the playout log identifies a queued asset
at 8:35; (2) the compliance backup waveform exactly matches the prior-day rehearsal
master, including an identical breath/paper noise; (3) there are no live talkback or
listener-message inserts in a normally interactive special; and (4) the local edit
history is deleted at 9:14 while the external recorder shows the program was stopped.
Any technically capable staff member could theoretically queue content, but only Priya
had routine console access, supply access, and advance knowledge of Mara’s private plan.

## 2. Master timeline

### Public timeline at arrival

| Time | Believed event | Basis | Initial interpretation |
| --- | --- | --- | --- |
| 8:52–9:12 | Elias argues with Mara during a live show. | Broadcast audio, visible LIVE tally. | Elias had immediate hostile access. |
| about 9:12 | Mara collapses in locked Studio B. | Priya's account, broadcast interruption. | Sudden on-air medical collapse or assault. |
| 9:14 | Priya hears silence, finds Mara, stops program, summons help. | Priya’s claim. | Priya is the discoverer. |
| 9:15 | Kells’s planned call never occurs. | Kells’s partial account. | Kells may have acted before a damaging negotiation. |

### Actual timeline

| Time | Actual event | Present / knows | Evidence | Likely false reading |
| --- | --- | --- | --- | --- |
| Previous day, 16:10 | Continuity segment, including rehearsal argument and cue, is recorded. | Mara, Priya, Elias. | Rehearsal master, session metadata. | A routine unused rehearsal. |
| Six months earlier | Priya authorizes removal of Harbour Relief recording after Kells's payment. | Priya, Kells; Tomas sees authorization. | Audit, ledger, retention log. | Routine legal deletion. |
| 8:20 | Mara confirms private 9:15 call with Kells and protected source procedure. | Mara; Priya infers plan from rundown; Kells knows call. | Calendar/rundown, message to Kells. | Standard producer schedule. |
| 8:35 | Priya queues continuity segment and reroutes tally. | Priya; server records it. | Playout schedule, routing state. | Normal technical preparation. |
| 8:47 | Priya receives the fresh tin, replaces one lemon lozenge, places it in Studio B. | Priya. | Invoice, lot code, residue. | Helpful replenishment. |
| 8:52–8:57 | Elias has a real argument with Mara about postponing publication, then waits in corridor. | Mara, Elias; corridor camera. | Camera, Elias account. | The audio later heard records this event. |
| 9:00 | Automated recorded segment begins. | Priya knows; listeners do not. | Playout log, external waveform. | Mara begins live broadcast. |
| 9:03 | June returns the spare key; Mara takes lemon lozenge. | June, Mara. | June claim, key log, toxicology. | June had murder access. |
| 9:06 | Mara enters Studio B to await private call. | Mara; Priya observes her go in. | Door access, Priya's later partial admission. | Mara remains at microphone. |
| 9:11 | Aconitine causes collapse and death. | No direct witness. | Toxicology, medic timing. | Collapse occurs at the on-air argument. |
| 9:12 | Rehearsal argument airs. | Priya knows; Elias recognizes it. | Waveform match, master. | Elias threatens Mara live. |
| 9:14 | Priya stops playout, deletes local edit history, raises alarm. | Priya; external recorder records stop. | Backup, console audit gap. | Priya stops a live show after discovering Mara. |

The actual time of death is reconstructed from ingestion observation, toxicological onset,
door/access timing, playout metadata, and the external recording—not a single hidden
timestamp.

## 3. Character knowledge matrix

| Character / narrative function | Knows as fact; observed | Believes / suspects; does not know | Secrets and why | Lies, exposure, willingness |
| --- | --- | --- | --- | --- |
| **Priya Nair — culprit and false technical guide** | Knows all murder actions, archive deletion, payment, schedule, source cue, and real 8:52 argument. | Believes local edit deletion is sufficient; does not know June identifies the lemon or that external backup exposes stop time. | Conceals homicide, paid deletion, queue/tally manipulation, and panic motive to avoid prosecution and disgrace. | Says broadcast was live, refill was routine, and she discovered Mara after silence. Server/backup, invoice, audit, and cue expose each. Evidence makes her more suspicious; revised admissions reveal operational facts, not full guilt. |
| **Elias Ward — obvious innocent suspect** | Knows real argument, prior-day rehearsal, continuity segment, and that he left at 8:57. Observed Mara determined to proceed. | Suspects Kells pressured Mara; thinks protected source may be Kells; does not know poison, deletion, or queue manipulation. | Conceals taking the spare key earlier and personal cruelty in the argument to avoid blame. | Initially places the argument vaguely “near broadcast”; camera/audio exposes distinction. Once framed risk is clear, he identifies rehearsal and corroborates Mara’s plan. |
| **Adrian Kells — culpable non-killer** | Knows fraud, payment to Priya, pressure message, and planned 9:15 call. | Believes Priya deleted the only recording; suspects Mara found proof; does not know murder or poisoned lozenge. | Conceals fraud and coercion to avoid criminal exposure. | Denies meaningful Priya contact; ledger/messages expose it. Exposure increases homicide suspicion but eventually redirects to suppression and personal motive. |
| **June Hale — access red herring / witness** | Observed Mara take a lemon lozenge at 9:03 and knows Mara uses continuity segments. Knows cue phrase is a promise to a protected source. | Believes this segment is live; does not know its schedule, poison, fraud, or Priya's role. | Conceals unauthorized use of spare key for a personal errand, fearing dismissal. | Says she did not enter “the studio” until clarified as Studio B; key log exposes ambiguity. Once her unrelated breach is bounded, she volunteers ingestion and cue observations. |
| **Dr. Rowan Bell — medical constraint** | Knows symptoms/onset fit aconitine and Mara asked a general arrhythmia question days earlier. | Suspects possible self-administration at first; cannot identify delivery or culprit. | Withholds earlier question to avoid implying negligent care. | Initially describes uncertainty; toxicology forces disclosure of compatible onset. Exposure redirects from suicide rather than naming a killer. |
| **Tomas Reed — cover-up fragment holder** | Knows Priya approved retention override and a Kells-related asset existed. | Believes solicitor request may have been legitimate; does not know payment, fraud, or murder. | Conceals lax override practice to protect job. | Calls deletion routine; audit and payment expose lack of diligence. He then identifies authorization timing and technical archive path. |

No character can truthfully supply the complete solution. Priya alone knows murder intent;
every critical conclusion requires at least two perspectives.

## 4. Information atom catalog

**Classifications:** Critical information is necessary to support an accusation dimension.
Route-critical information is one viable route to a critical conclusion. Corroborative
information improves confidence. A red herring is true information with an incomplete
interpretation. A claim records a speaker’s position, not truth.

| Planning ID | Category / reliability | Exact meaning and source | Surface → actual meaning | Connections / role |
| --- | --- | --- | --- | --- |
| F-01 | Fact / high | Mara died about eight minutes after June saw her consume a lemon lozenge. June + medic timing. | Sudden collapse → ingestion window. | F-02, E-01; critical HOW. |
| E-01 | Evidence / forensic high | One lemon lozenge contains aconitine residue. Toxicology/tin. | Possible overdose → targeted poison. | F-01, F-03; critical HOW. |
| F-02 | Fact / high | Mara habitually selected lemon; no one saw her choose another item. June. | Preference detail → delivery predictability. | E-01, E-02; route-critical HOW. |
| E-02 | Evidence / documentary high | Fresh tin invoice and lot place replacement at 8:47 under Priya’s supply task. | Routine refill → tampering opportunity. | F-03, F-10; critical WHO/HOW. |
| F-03 | Fact / high | The poison was in a single substituted item, not Mara’s general medication. E-01 + F-01/F-02. | Medical ambiguity → deliberate delivery. | Automatic deduction D-01; critical HOW. |
| C-01 | Claim / false | Priya says Mara was broadcasting live from 9:00 until discovery. | Explains broadcast → false public timeline. | E-03, E-04, X-01. |
| E-03 | Evidence / digital high | Playout server queued a recorded asset at 8:35 for the 9:00 slot. | Technical routine → program was prerecorded. | E-04, F-04; critical WHEN/concealment. |
| E-04 | Evidence / recorded high | Compliance backup waveform matches the prior-day rehearsal master, including unique noise. | Argument proves conflict → recorded material aired. | C-01, F-04; critical WHEN/concealment. |
| F-04 | Fact / high | The 9:12 hostile exchange was rehearsal audio, not contemporaneous speech. E-03 + E-04 or E-04 + Elias. | Elias was heard at 9:12 → audio cannot locate either person then. | D-02, X-01; critical WHEN. |
| E-05 | Evidence / digital high | External recorder stops at 9:14; local console edit record is deleted then. | Technical fault → playback was controlled and discovery account is false. | C-02, X-04; critical WHO/concealment. |
| C-02 | Claim / false | Priya says she heard a live silence before stopping the show. | Discoverer narrative → impossible with prerecorded playback. | E-05, F-04; contradiction leverage. |
| F-05 | Fact / medium-high | No live talkback/listener inserts occurred during a normally interactive special. June/program format. | Format oddity → early prompt to inspect authenticity. | E-03/E-04; route-critical clue. |
| C-03 | Claim / partial | Elias says he argued with Mara but left before broadcast. | Self-serving alibi → materially true. | E-06, F-04. |
| E-06 | Evidence / digital high | Corridor camera shows Elias outside Studio B from 8:57 through 9:14. | Missing direct studio view → excludes ingestion window. | F-01, C-03; closes Elias theory. |
| F-06 | Fact / high | Elias’s real argument occurred before broadcast and differs from rehearsal audio. Elias + E-06/E-04. | Same dispute → two separate events. | C-03, F-04; red-herring closure. |
| C-04 | Claim / partial | June initially denies entering “the studio.” | Access lie → she means she did not enter Studio B. | E-07, F-01. |
| E-07 | Evidence / documentary high | Spare-key log records June’s 9:03 access. | June accessed scene → she returned the key. | C-04, F-01; red herring / route-critical. |
| F-07 | Fact / medium-high | Mara used “keep the channel open” as a protected-source assurance. June or rehearsal slate. | Signoff flavor → prerecorded segment was planned around confidential contact. | F-08, D-03; route-critical central aha. |
| F-08 | Fact / high | Mara planned to be away from a live microphone for a secure 9:15 call. Rundown + E-03, or Elias + F-07. | Host abandonment → deliberate protected procedure. | F-04, F-07, D-03. |
| E-08 | Evidence / documentary high | Ledger shows Kells paid Priya six months before the archive deletion. | Murder payment → improper payment for earlier deletion. | E-09, E-10, T-02. |
| E-09 | Evidence / audit high | Priya authorized removal of Harbour Relief recording under a rights-risk label. | Routine compliance → Priya was compromised. | E-08, F-09; critical WHY. |
| E-10 | Evidence / message high | Kells tells Priya “make the file disappear before tonight.” | Murder directive → demand to suppress archive evidence. | E-08/E-09; closes Kells homicide theory. |
| F-09 | Fact / high | The deleted recording linked Kells to North Quay diversion and Priya to its suppression. Audit + Mara note/whistleblower confirmation. | Administrative deletion → personal exposure for Priya. | E-08, E-09; critical WHY. |
| F-10 | Fact / high | Priya had both advance knowledge of Mara’s absence and practical access to playback and lozenges. E-02 + F-08 + role facts. | Helpful technical role → unique combined opportunity. | D-03, E-05; critical WHO. |
| D-01 | Deduction candidate | Targeted ingestion: Mara consumed a tampered lozenge. | Does not identify the tamperer. | Automatic, HOW. |
| D-02 | Deduction candidate | False live timeline: audio is not proof Mara was alive at 9:12. | Does not identify exploitation or motive. | Automatic, WHEN. |
| D-03 | Deduction candidate | The broadcast created the murderer’s time window by making Mara’s absence look like live presence. | Does not name Priya or complete accusation. | Player-triggered central aha. |
| X-01 | Contradiction | Priya’s live claim conflicts with queue/waveform evidence. | Forces broadcast-authenticity inquiry. | Opens E-05 path. |
| X-02 | Contradiction | Apparent Elias opportunity conflicts with corridor/ingestion timeline. | Closes Elias as homicide suspect. | Redirects to 8:47 tampering. |
| X-03 | Contradiction | Kells denies meaningful Priya contact; ledger/messages/audit contradict. | Separates real coercion from murder. | Opens cover-up motive. |
| X-04 | Contradiction | Priya's discovery account conflicts with independent stop time and deleted local history. | Establishes manipulated discovery sequence. | Pressure on Priya. |

## 5. Evidence connection map

```text
E-01 residue + F-01 ingestion timing + F-02 lemon habit
  -> F-03 targeted delivery -> D-01
E-02 refill provenance + F-08 planned absence + Priya role
  -> F-10 Priya's combined opportunity

E-03 queued asset + E-04 waveform/master (+ F-05 format anomaly)
  -> F-04 prerecorded broadcast -> D-02
F-04 + F-07 protected-source cue + F-08 private-call plan + F-10
  -> D-03 broadcast concealed the murder window
E-05 stop-time/edit gap + C-02 discovery claim
  -> X-04 manipulated discovery sequence

E-08 payment + E-09 archive authorization + E-10 message
  -> F-09 Priya's personal exposure
F-09 + F-10 + E-05 + D-03
  -> supported canonical WHO/WHY reconstruction

C-03 Elias account + E-06 corridor + F-01
  -> X-02 / Elias homicide theory closed
```

No node is a magic bullet: residue establishes poison but not delivery; payment establishes
compromise but not murder; prerecorded audio establishes false time but not who exploited
it; opportunity becomes meaningful only at the intersection.

## 6. Competing theories

| Theory | Why plausible / what it explains | Pressure point and dismantling |
| --- | --- | --- |
| **T-01 Elias poisoned Mara after a live argument.** | Broadcast hostility, past relationship, spare-key lie, and apparent presence explain motive and access. | E-06 + F-01 prove no ingestion-window access; F-04 proves the 9:12 audio is not live. Elias's lies remain real but non-homicidal. |
| **T-02 Kells ordered Priya to kill Mara.** | Fraud, threat, payment, private call, and Priya’s access explain Kells’s apparent remote control. | E-08/E-09 show the payment predates murder; E-10’s “file” is constrained by audit context. F-09 supplies Priya’s independent reason to kill. |
| **T-03 Mara self-administered poison or died accidentally.** | Isolated room, selected lozenge, prior medical question, and planned absence explain death without attacker. | E-01, F-01, and E-02 establish a single externally substituted lozenge and fixed chain of custody. |
| **T-04 Priya only falsified timing to frame Elias after an unrelated death.** | Her technical manipulation and discovery lie are strong evidence of staging but do not alone prove poisoning. | E-02 + F-10 show pre-death delivery opportunity; F-09 makes prevention of exposure a motive for murder, not merely post-death framing. |
| **Canonical: Priya murdered Mara while exploiting a planned prerecorded segment.** | Explains all evidence, including why unrelated-looking lies point in different directions. | Requires WHO, WHY, HOW, and concealment proof; never supplied by one response. |

## 7. Contradiction architecture

| ID | Claim A vs B | Notice prerequisites | Confrontation leverage and result |
| --- | --- | --- | --- |
| X-01 Live broadcast | C-01 Priya says live; E-03 queued asset and E-04 waveform say prerecorded. | One source establishing queue/rehearsal plus Priya claim. | Priya revises from “live” to “prepared technical segment”; opens local-vs-external playback records. |
| X-02 Elias window | Surface 9:12 argument implicates Elias; E-06 and F-01 exclude him at ingestion/death. | Audio/argument and corridor plus ingestion timing. | Elias clarifies rehearsal and the real argument; closes murder-access lead and opens timing distinction. |
| X-03 Kells/Priya contact | Kells denies meaningful contact; E-08 and E-10 prove payment/pressure, E-09 supplies object. | Ledger plus message or audit. | Kells admits pressure to suppress the recording, not murder; opens prior-cover-up reconstruction. |
| X-04 Discovery sequence | C-02 live silence story conflicts with E-05 external stop and local audit deletion. | D-02 or F-04 plus E-05 and Priya claim. | Priya loses technical credibility, gives a partial admission of manually stopping playback; opens direct preparation pressure. |
| X-05 June access (resolving contradiction) | C-04 denial conflicts with E-07 key log. | June claim + key log. | June clarifies Studio B distinction and gives F-01/F-07; suspicion shifts from access to witnessed ingestion. |

Each confrontation either opens a new source, makes an old denial obsolete, or explicitly
closes a false theory. X-05 is intentionally a resolving false contradiction: it teaches
the player that an exposed lie can yield a useful truthful clarification without proving
murder.

## 8. Discovery routes and criticality

| Required conclusion | Primary route | Independent route | Classification |
| --- | --- | --- | --- |
| Targeted poison delivery | E-01 → F-01 → D-01 | E-01 → F-02 → D-01 | Critical; both routes require residue, with independently sourced timing or habit. |
| Broadcast was prerecorded | E-03 + E-04 → F-04/D-02 | E-04 + Elias rehearsal account → F-04/D-02 | Critical; technical and human corroboration. |
| Mara’s absence was planned | Rundown/private-call record + E-03 → F-08 | Elias’s continuity knowledge + F-07 → F-08 | Route-critical for central aha. |
| Priya had delivery opportunity | E-02 + Priya supply role | June new-tin observation + vendor lot record | Critical WHO/HOW corroboration. |
| Priya had personal motive | E-08 + E-09 → F-09 | Tomas authorization account + E-10 + Mara waveform note → F-09 | Critical WHY; finance and archive perspectives. |
| Priya falsified discovery | E-05 + C-02 → X-04 | E-05 + D-02 → X-04 | Critical WHO/concealment. |
| Kells did not direct murder | E-10 + E-09 + Kells confrontation | E-08 + audit chronology + private-call record | Corroborative closure of T-02. |
| Elias did not poison Mara | E-06 + F-01 | E-06 + F-04 | Corroborative closure of T-01. |

Critical routes will be authored as deterministic disclosures; variants may only alter
posture or provide optional corroboration. The model contains no lucky-response
dependency.

## 9. Information layers and pacing

| Layer | Safe disclosures | Preparatory requirement / premature risk |
| --- | --- | --- |
| A: Surface mystery | C-01, apparent argument, C-03, C-04, locked studio, broad medical uncertainty. | Establishes reasonable Elias, Kells, June, and medical theories. |
| B: Timeline instability | F-05, E-06, F-01, E-01, discrepancies around 9:12. | Do not reveal E-03/E-04 conclusion before a player has reason to question the live premise. |
| C: Personal secrets | E-07/X-05, spare-key history, E-08, Kells denial, Rowan’s withheld medical question. | Exposed lies must create uncertainty, not prematurely identify the killer. |
| D: Mechanism | E-03, E-04, F-04/D-02, E-02. | E-02 follows poison context; prerecorded conclusion follows audio doubt plus corroboration. |
| E: Motive reconstruction | E-09, E-10, F-09, F-08. | Archive authorization waits for finance/archive preparation; source cue waits for broadcast doubt. |
| F: Reinterpretation | E-05/X-04, F-10, D-03. | D-03 requires false-live understanding, planned absence, and access; it must not be automatic. |
| G: Synthesis | Priya revised account, accusation proof review. | Player theory remains player-owned; no discovery announces culprit. |

The later implementation should encode these as OR-of-AND disclosure prerequisites:
technical route **or** human route to broadcast doubt; invoice after poison context **or**
June’s witnessed habit; archive motive after finance evidence **or** Tomas-plus-message
route. No partial alternatives may combine.

## 10. Deduction model

| Deduction | Surface / prerequisites | Confirmed implication and deliberate limit |
| --- | --- | --- |
| D-01 Targeted ingestion | Automatic; E-01 + (F-01 or F-02). | Mara consumed a tampered lozenge. It does not assign tampering, motive, or broadcast manipulation. |
| D-02 False live timeline | Automatic; E-03 + E-04, or E-04 + Elias rehearsal fact. | Audio at 9:12 cannot prove Mara was alive or Elias was present then. It does not say why recording was used. |
| D-03 **The absent voice** | Player-triggered; D-02 + F-07 + F-08 + F-10. | The broadcast was a concealment mechanism: it made Mara’s planned absence appear to be live presence during the murder window. Each prerequisite is independently meaningful; their connection changes the status of early audio from timeline evidence to cover. It neither names Priya nor supplies WHY/HOW. |

D-03 is player-owned because a player can possess all four facts yet still treat
prerecording as merely an alibi anomaly. Claiming it asserts the additional conceptual
model that the broadcast created—not just obscured—the opportunity.

## 11. Misdirection and false-lead model

| Lead type | Rational initial interpretation | Useful retained result / closure |
| --- | --- | --- |
| Temporary suspect: Elias | The audible argument and key lie indicate murder access. | X-02 proves his exclusion and yields rehearsal/continuity knowledge needed for D-02/F-08. |
| Temporary suspect: Kells | Fraud, threat, payment, and expected call indicate ordered murder. | X-03 establishes actual coercion and directs player to Priya’s independent exposure. |
| Access red herring: June | Key log plus evasiveness place her at scene. | X-05 yields ingestion timing and protected-source cue. |
| Technical misunderstanding | LIVE tally and broadcast audio establish Mara was alive. | D-02/D-03 teach status lamps and audio must be tied to the playout chain, not presence. |
| Motive misunderstanding: Priya payment | Payment is payment for murder. | Audit/message chronology identifies a prior deletion, supplying personal rather than hired motive. |
| Medical misunderstanding | Mara’s question and isolation imply suicide. | D-01 and invoice provenance establish external substitution. |

## 12. Accusation proof matrix

| Dimension | Canonical answer | Plausible wrong answers | Proof requirement | Diagnostic principle |
| --- | --- | --- | --- | --- |
| WHO | Priya Nair | Elias; Adrian Kells; Mara | D-01, E-02/F-10, E-05/X-04. | Point to unexplained delivery opportunity and manipulated discovery timeline, never the correct name. |
| WHY | Prevent exposure of her paid Harbour Relief archive deletion and connection to Kells’s fraud. | Jealousy; obedience to Kells; Mara’s martyrdom. | E-08, E-09, E-10, F-09. | Point to an unexplained personal stake in the deleted recording. |
| HOW | Replaced one lemon lozenge with aconitine before 9:00. | Poisoned drink; assault; self-administered overdose. | E-01, F-01, E-02, F-02 or D-01. | Point to targeted ingestion and chain of custody not accounted for. |
| WHAT WAS CONCEALED / WHEN | A prerecorded continuity segment made Mara appear live after she had died. | Live argument; call during broadcast; no manipulation. | D-02, D-03, E-05/X-04. | Point to conflict between independent playout records and apparent broadcast timing. |

These four dimensions are necessary and sufficient: a separate `WHEN` answer would test
an obscure minute rather than explanatory understanding. Proof-gated diagnostics may
speak only to dimensions whose listed information is possessed.

## 13. Information graph audit

| Required conclusion | Proof/backward trace | Audit result |
| --- | --- | --- |
| Priya caused death | D-01 + E-02/F-10 + E-05/X-04; routes through object, witness, technical evidence. | Multiple routes; no single character or artifact decides it. |
| Priya’s motive | E-08 + E-09 + E-10 → F-09; alternate Tomas/archive path. | Earlier cover-up is structurally necessary, not a second detached mystery. |
| Poisoned lozenge method | E-01 + F-01 + E-02, corroborated by F-02. | Physical evidence and observed timing prevent a magic inference. |
| Broadcast concealment | E-03 + E-04 → D-02; F-07 + F-08 + F-10 → D-03; E-05 confirms exploitation. | Central aha genuinely reinterprets early audio. |

Reverse purpose audit: E-06 closes Elias and distinguishes the two arguments; E-07
produces June’s witness facts; F-05 opens authenticity inquiry; Rowan’s medical uncertainty
supports and then closes accident theory; every finance/archive item establishes either
Kells’s credible pressure or Priya’s motive. No major atom lacks an eventual
investigative purpose.

### Quality-gate result

Canonical timeline is internally consistent. All important characters have explicit
knowledge, ignorance, secrets, lies, exposure, and willingness boundaries. Each critical
accusation dimension has multiple information paths or independent corroboration; all
false theories explain real evidence and receive a closure. The sole player-triggered
deduction is earned and bounded. No production implementation has been created.
