import { currentCaseId, currentCase, playerState, caseList, startCase, backToSelect, canAccuse, error } from './store.ts';
import { CharacterPanel } from './CharacterPanel.tsx';
import { CaseBoard } from './CaseBoard.tsx';
import { Transcript } from './Transcript.tsx';
import { Accusation } from './Accusation.tsx';
import { Reveal } from './Reveal.tsx';

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
      </div>
      {error.value && <div class="error">{error.value}</div>}
    </header>
  );
}

export function App() {
  if (!currentCaseId.value) return <CaseSelect />;

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
      {ended ? <Reveal /> : <Accusation />}
    </div>
  );
}
