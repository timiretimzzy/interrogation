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
  availableQuestions,
  selectCharacter,
  activeCharacter,
  ask,
} from './store.ts';
import { Accusation } from './Accusation.tsx';
import { Reveal } from './Reveal.tsx';
import { Transcript } from './Transcript.tsx';

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? 'dev';

function prettifyRole(role: string): string {
  return String(role).replace(/_/g, ' ');
}

function characterSigil(name: string, index: number): string {
  const tokens = name.split(/\s+/).filter(Boolean);
  const first = tokens[0]?.[0] ?? '?';
  const second = tokens[1]?.[0] ?? tokens[0]?.[1] ?? '';
  const suffix = String.fromCharCode(65 + (index % 26));
  return `${first}${second}${suffix}`.toUpperCase();
}

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
      <p class="tagline">Open an active investigation. Follow leads. Test theories. Name the culprit.</p>
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
            <span class="briefing-label">Why it matters</span>
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
      <div class="brand-lockup">
        <div class="game-mark">INTERROGATION</div>
        <div class="game-title">{cf.title}</div>
      </div>
      <div class="case-status">
        <span>{cf.genre}</span>
        <span>·</span>
        <span class="status-pill">{s.status === 'playing' ? 'Investigation open' : s.status}</span>
        {canAccuse() && <span class="status-pill status-urgent">Accusation ready</span>}
      </div>
      <div class="header-actions">
        <button class="link" onClick={() => (theoryOpen.value = !theoryOpen.value)}>Notebook</button>
        <button class="link" onClick={() => backToSelect()}>Cases</button>
      </div>
      {error.value && <div class="error">{error.value}</div>}
    </header>
  );
}

function Theory() {
  const cf = currentCase();
  const s = playerState.value;
  if (!cf || !s) return null;
  const dims = accusationDimensions();
  const theory = (s.theory ?? {}) as Record<string, string>;
  return (
    <section class="panel theory">
      <div class="panel-kicker">Notebook</div>
      <h2>Working theory</h2>
      <p class="muted">A private space to test your thinking. It never changes the case state.</p>
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
          onInput={(e) => setTheoryNote((e.target as HTMLTextAreaElement).value)}
        />
      </div>
      <button class="link" onClick={() => (theoryOpen.value = false)}>Close</button>
    </section>
  );
}

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

function DeskPeople() {
  const cf = currentCase();
  const s = playerState.value;
  if (!cf || !s) return null;
  const activeId = activeCharacter.value ?? cf.characters[0]?.id;
  return (
    <section class="panel desk-panel roster-panel">
      <div class="panel-kicker">Cases / leads</div>
      <h2>People</h2>
      <div class="character-roster">
        {cf.characters.map((c, index) => {
          const available = availableQuestions(c.id);
          const asked = s.interrogations[c.id]?.length ?? 0;
          const selected = c.id === activeId;
          return (
            <button
              key={c.id}
              class={selected ? 'roster-card active' : 'roster-card'}
              onClick={() => selectCharacter(c.id)}
            >
              <span class="roster-sigil">{characterSigil(c.name, index)}</span>
              <span class="roster-copy">
                <strong>{c.name}</strong>
                <span>{prettifyRole(c.role)} · {c.personality}</span>
                <span>{available.length} leads · {asked} asked</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function IntelligencePanel() {
  const cf = currentCase();
  const s = playerState.value;
  if (!cf || !s) return null;
  const selected = cf.characters.find((c) => c.id === (activeCharacter.value ?? cf.characters[0]?.id));
  const available = selected ? availableQuestions(selected.id) : [];
  const asked = selected ? (s.interrogations[selected.id] ?? []) : [];
  const recentClues = [...(s.discoveredClues ?? [])].slice(-3);
  const recentFacts = [...(s.discoveredFactIds ?? [])].slice(-4);

  return (
    <section class="panel desk-panel intelligence-panel">
      <div class="panel-kicker">Investigation intelligence</div>
      <h2>Case file</h2>
      <ul class="intel-list">
        <li><strong>{recentClues.length}</strong> clues surfaced</li>
        <li><strong>{s.activeContradictions.length}</strong> contradictions live</li>
        <li><strong>{s.actionsRemaining}</strong> questions remaining</li>
      </ul>
      <div class="intel-block">
        <h3>Recent discoveries</h3>
        {recentClues.length === 0 ? <p class="muted">Nothing new yet.</p> : <ul>{recentClues.map((id) => <li key={id}>{id}</li>)}</ul>}
      </div>
      <div class="intel-block">
        <h3>Current lead</h3>
        {selected ? <p>{selected.name} — {selected.visibleDescription}</p> : <p class="muted">Choose a person to interrogate.</p>}
      </div>
      <div class="intel-block">
        <h3>Question state</h3>
        {available.length === 0 ? <p class="muted">No further questions for this lead.</p> : <ul>{available.slice(0, 5).map((q) => <li key={q.id}>{q.text}</li>)}</ul>}
        {asked.length > 0 && <p class="muted">{asked.length} exchange{asked.length === 1 ? '' : 's'} logged.</p>}
      </div>
      <div class="intel-block">
        <h3>Active deductions</h3>
        {recentFacts.length === 0 ? <p class="muted">Nothing to pin down yet.</p> : <ul>{recentFacts.map((id) => <li key={id}>{id}</li>)}</ul>}
      </div>
    </section>
  );
}

function InterrogationStage() {
  const cf = currentCase();
  const s = playerState.value;
  if (!cf || !s) return null;
  const activeId = activeCharacter.value ?? cf.characters[0]?.id;
  const character = cf.characters.find((c) => c.id === activeId);
  const available = character ? availableQuestions(character.id) : [];
  const askedRecords = character ? (s.interrogations[character.id] ?? []) : [];

  return (
    <section class="panel desk-panel interrogation-panel">
      <div class="panel-kicker">Active interrogation</div>
      {character && (
        <>
          <div class="interrogation-identity">
            <div class="character-emblem">{characterSigil(character.name, cf.characters.findIndex((c) => c.id === character.id))}</div>
            <div>
              <div class="character-name">{character.name}</div>
              <div class="character-role">{prettifyRole(character.role)} · {character.personality}</div>
              <p class="character-desc">{character.visibleDescription}</p>
            </div>
          </div>
          <div class="question-stack">
            {available.map((q) => (
              <button class="question-card" key={q.id} onClick={() => ask(character.id, q.id)}>
                <span class="q-mech">{q.mechanic}</span>
                <strong>{q.text}</strong>
                {q.purpose && <span class="muted">{q.purpose}</span>}
              </button>
            ))}
            {available.length === 0 && <p class="muted">No more questions available for this lead.</p>}
          </div>
          <div class="response-thread">
            {askedRecords.map((rec, i) => {
              const q = cf.questions.find((x) => x.id === rec.questionId);
              return (
                <article class="response-card" key={`${rec.questionId}-${i}`}>
                  <div class="response-question">{q?.text ?? rec.questionId}</div>
                  <div class="response-name">{character.name}</div>
                  <p>{rec.text}</p>
                </article>
              );
            })}
          </div>
        </>
      )}
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
      <main class="desk-layout">
        <DeskPeople />
        <InterrogationStage />
        <IntelligencePanel />
      </main>
      <Transcript />
      {ended ? <Reveal /> : <ActionsPanel />}
      <SiteFooter />
    </div>
  );
}
