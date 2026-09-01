import {
  currentCaseId,
  currentCase,
  playerState,
  caseList,
  startCase,
  backToSelect,
  canAccuse,
  error,
  gameStage,
  beginInvestigation,
  theoryOpen,
  accusePanelOpen,
  accusationDimensions,
  setTheoryField,
  setTheoryNote,
} from './store.ts';
import { CharacterPanel } from './CharacterPanel.tsx';
import { CaseBoard } from './CaseBoard.tsx';
import { Transcript } from './Transcript.tsx';
import { Accusation } from './Accusation.tsx';
import { Reveal } from './Reveal.tsx';

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? 'dev';

// Subtle tester footer: a build identifier (so testers can report "bug on build
// X") plus a no-backend feedback path via GitHub Issues. Kept off the core
// gameplay surface so it does not read as a finished product.
function SiteFooter() {
  const issuesUrl =
    'https://github.com/timiretimzzy/interrogation/issues/new?title=' +
    encodeURIComponent('Test feedback') +
    '&body=' +
    encodeURIComponent(
      'Build: ' +
        APP_VERSION +
        '\n\nWhat confused you?\n\nWhat felt good?\n\nWhere did you get stuck?\n',
    );
  return (
    <footer class="site-footer">
      <span class="test-badge">Test build</span>
      <span class="build-id">{APP_VERSION}</span>
      <a class="feedback-link" href={issuesUrl} target="_blank" rel="noopener noreferrer">
        Report a problem / feedback
      </a>
    </footer>
  );
}

function CaseSelect() {
  return (
    <div class="case-select">
      <h1>The Interrogation</h1>
      <p class="tagline">Interrogate a network of suspects and witnesses. Uncover contradictions. Accuse.</p>
      <ul class="case-list">
        {caseList.map((c) => (
          <li key={c.caseId}>
            <button onClick={() => startCase(c.caseId)}>
              <span class="case-title">{c.title}</span>
              <span class="case-meta">{c.genre} · {c.difficulty}</span>
            </button>
          </li>
        ))}
      </ul>
      <SiteFooter />
    </div>
  );
}

// The case briefing: establishes the known situation (hook / context / why it is
// strange / objective) BEFORE interrogation. It never reveals the culprit, hidden
// truth, or a solution path — only what is publicly known at the start.
function Briefing() {
  const cf = currentCase();
  if (!cf) return null;
  const b = cf.briefing;
  return (
    <div class="briefing">
      <div class="briefing-card">
        <div class="briefing-meta">{cf.genre} · {cf.difficulty}</div>
        <h1 class="briefing-title">{cf.title}</h1>
        {b.hook && <p class="briefing-hook">{b.hook}</p>}
        {b.context && (
          <p class="briefing-block">
            <span class="briefing-label">What we know</span>
            {b.context}
          </p>
        )}
        {b.tension && (
          <p class="briefing-block">
            <span class="briefing-label">Why it's strange</span>
            {b.tension}
          </p>
        )}
        {b.objective && (
          <p class="briefing-block">
            <span class="briefing-label">Your task</span>
            {b.objective}
          </p>
        )}
        <div class="briefing-actions">
          <button class="briefing-begin" onClick={() => beginInvestigation()}>
            Begin investigation →
          </button>
          <button class="link briefing-back" onClick={() => backToSelect()}>
            ← Cases
          </button>
        </div>
      </div>
    </div>
  );
}

function GameHeader() {
  const cf = currentCase();
  const s = playerState.value;
  if (!cf || !s) return null;
  return (
    <header class="game-header">
      <button class="link" onClick={() => backToSelect()}>← Cases</button>
      <div class="game-title">{cf.title}</div>
      <div class="game-meta">
        Actions left: <strong>{s.actionsRemaining}</strong>
        {canAccuse() && <span> · Accusation available</span>}
        <span class="test-badge test-badge-inline">Test build</span>
      </div>
      {s.status === 'playing' && (
        <button
          class="link"
          onClick={() => {
            accusePanelOpen.value = false;
            theoryOpen.value = !theoryOpen.value;
          }}
        >
          Theory
        </button>
      )}
      {error.value && <div class="error">{error.value}</div>}
    </header>
  );
}

// A private, non-spoiler thinking space. It adapts to whatever accusation
// dimensions the case defines (so it works for 2-, 3-, or N-dimension cases)
// plus a freeform notes field. It never validates, scores, or reveals anything.
function Theory() {
  const cf = currentCase();
  const s = playerState.value;
  if (!cf || !s) return null;
  const dims = accusationDimensions();
  const theory = (s.theory ?? {}) as Record<string, string>;
  return (
    <section class="panel theory">
      <h2>Working theory</h2>
      <p class="muted">
        A private space for your thinking. Nothing here changes the investigation or
        reveals whether you're right.
      </p>
      {dims.map((d) => (
        <div class="theory-field" key={d.id}>
          <label class="theory-prompt">{d.prompt}</label>
          <input
            class="theory-input"
            type="text"
            value={theory[d.id] ?? ''}
            placeholder="Who or what you suspect…"
            onInput={(e) => setTheoryField(d.id, (e.target as HTMLInputElement).value)}
          />
        </div>
      ))}
      <div class="theory-field">
        <label class="theory-prompt">Notes</label>
        <textarea
          class="theory-note"
          rows={4}
          value={theory['__note__'] ?? ''}
          placeholder="What you think is going on…"
          onInput={(e) => setTheoryNote((e.target as HTMLInputElement).value)}
        />
      </div>
      <button class="link" onClick={() => (theoryOpen.value = false)}>
        Close
      </button>
    </section>
  );
}

// Bottom action area during play: the player chooses between building a theory
// and making the consequential accusation. The two are deliberately separate.
function ActionsPanel() {
  if (accusePanelOpen.value) return <Accusation />;
  if (theoryOpen.value) return <Theory />;
  return (
    <section class="panel actions-collapsed">
      <button
        class="accuse-open-btn"
        onClick={() => {
          theoryOpen.value = false;
          accusePanelOpen.value = true;
        }}
      >
        Make an accusation
      </button>
      <button
        class="theory-open-btn"
        onClick={() => {
          accusePanelOpen.value = false;
          theoryOpen.value = true;
        }}
      >
        Working theory
      </button>
    </section>
  );
}

export function App() {
  if (!currentCaseId.value) return <CaseSelect />;
  if (gameStage.value === 'briefing') return <Briefing />;

  const s = playerState.value;
  const ended = s && s.status !== 'playing';

  return (
    <div class="game">
      <GameHeader />
      <div class="game-grid">
        <CharacterPanel />
        <CaseBoard />
      </div>
      <Transcript />
      {ended ? <Reveal /> : <ActionsPanel />}
    </div>
  );
}
