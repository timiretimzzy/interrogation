# Testing the Game (for testers)

Thank you for playtesting **The Interrogation**. This is a **controlled test
build**, not a finished product. Your honest reactions are the whole point of
this phase.

## Live URL

**https://timiretimzzy.github.io/interrogation/**

No account, no sign-up. Just open it.

## What this is

A short crime-mystery interrogation game. You pick a case, read a briefing, then
interrogate a small cast of characters, switching between them, uncovering
contradictions, forming a theory, and finally making an accusation. The reveal
explains what actually happened.

## How to play

1. Open the URL.
2. Pick any case from the list (they are different mysteries — try a few).
3. Read the **briefing**. It tells you what is publicly known. It does **not**
   tell you who did it.
4. Press **Begin investigation**.
5. Choose a **character** and **ask a question** (each question costs one
   action; switching characters is free).
6. **Switch characters** and ask their questions — what one person says should
   make another person more interesting.
7. Watch for **contradictions** ("these don't seem to fit") and use them to
   **confront** someone.
8. Use **Working theory** (free, private, non-spoiler) to jot down what you
   think is going on. It never tells you if you're right.
9. When ready, **Make an accusation**. You can be wrong — that's fine, the
   reveal will explain it.
10. Read the **reveal**.

## How long

Aim for **5–20 minutes** per case. There is no timer.

## Which cases to try

Any of them — they are deliberately different (different casts, evidence, and
accusation structures). If you only have time for one or two, pick cases that
look unlike each other.

## What we want to know

- Did you understand what happened from the briefing?
- Did you know what to investigate next?
- Did the characters feel distinct?
- Did asking questions feel meaningful (not a list of yes/no attributes)?
- Was the accusation consequential?
- Was the reveal satisfying / did it make sense?
- Where did you get stuck or confused?

## How to report

Scroll to the bottom of the case list and use **"Report a problem / feedback"**
— it opens a pre-filled GitHub issue. Please include the **build id** shown in
the footer (e.g. `Test build · 0.3.0-test+abc1234`) so we can match your report
to the exact deployed version.

You can also just email or message the person who shared this link.

## What NOT to expect yet

- No daily "mystery of the day" yet (you pick from a fixed list).
- No accounts, no saved progress across devices, no leaderboard.
- No backend — your progress is saved only in this browser (LocalStorage).
- The cases are test content, not a production library.

## If something breaks

- A refresh should keep your place in a case. If it doesn't, tell us.
- If the page is blank or an error appears, note the build id and what you did,
  and report it.
- Clearing your browser storage for the site resets the case (expected).
