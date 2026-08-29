import { notebook, currentCase } from './store.ts';

export function CaseBoard() {
  const cf = currentCase();
  const nb = notebook.value;
  if (!cf || !nb) return null;

  return (
    <aside class="panel case-board">
      <h2>Case Board</h2>

      <h3>Clues</h3>
      <ul class="clue-list">
        {nb.clues.length === 0 && <li class="muted">None yet.</li>}
        {nb.clues.map((c) => (
          <li key={c.id}>
            <strong>{c.title}</strong> — {c.description}
          </li>
        ))}
      </ul>

      <h3>Evidence</h3>
      <ul class="evidence-list">
        {nb.evidence.length === 0 && <li class="muted">None yet.</li>}
        {nb.evidence.map((e) => (
          <li key={e.id}>
            <strong>{e.name}</strong> — {e.description}
          </li>
        ))}
      </ul>

      <h3>Possible inconsistencies</h3>
      <ul class="contradiction-list">
        {nb.contradictions.length === 0 && <li class="muted">None surfaced yet.</li>}
        {nb.contradictions.map((c) => (
          <li key={c.id} class="contradiction">
            <span class="warn">⚠ Possible inconsistency:</span> {c.description}
            {c.possibleInterpretations && c.possibleInterpretations.length > 0 && (
              <div class="muted">Could be: {c.possibleInterpretations.join('; ')}</div>
            )}
          </li>
        ))}
      </ul>

      <h3>Leads</h3>
      <ul class="lead-list">
        {nb.leads.length === 0 && <li class="muted">No open leads.</li>}
        {nb.leads.map((l) => (
          <li key={l.id} class="muted">{l.text}</li>
        ))}
      </ul>
    </aside>
  );
}
