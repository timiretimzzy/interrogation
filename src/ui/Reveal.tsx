import { reveal, resetCase, currentCaseId, backToSelect } from './store.ts';

export function Reveal() {
  const r = reveal.value;
  if (!r) return null;

  return (
    <section class="panel reveal">
      <h2>{r.headline}</h2>
      <ol class="narrative">
        {r.narrative.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ol>

      <h3>What you found</h3>
      <ul>
        {r.foundClues.map((c) => <li key={c}>Clue: {c}</li>)}
        {r.foundEvidence.map((e) => <li key={e}>Evidence: {e}</li>)}
        {r.foundContradictions.map((c, i) => <li key={i}>Inconsistency: {c}</li>)}
      </ul>

      <h3>Truth breakdown</h3>
      <ul>
        {r.truthBreakdown.map((f, i) => (
          <li key={i}>
            <strong>[{f.importance}]</strong> {f.fact}
            {f.discoveredThrough ? ` (via ${f.discoveredThrough.join(', ')})` : ''}
          </li>
        ))}
      </ul>

      <h3>Score</h3>
      <p>Accuracy: {r.evaluation.score}% · {r.evaluation.won ? 'Correct' : 'Incorrect'}</p>

      <div class="reveal-actions">
        {currentCaseId.value && (
          <button onClick={() => resetCase(currentCaseId.value!)}>Play again</button>
        )}
        <button onClick={() => backToSelect()}>Case list</button>
      </div>
    </section>
  );
}
