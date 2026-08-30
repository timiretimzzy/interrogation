import { notebook } from './store.ts';

export function Transcript() {
  const nb = notebook.value;
  if (!nb) return null;
  const entries = nb.transcript;

  return (
    <section class="panel transcript">
      <h2>Transcript</h2>
      <div class="transcript-entries">
        {entries.length === 0 && <p class="muted">No statements recorded yet.</p>}
        {entries.map((t, i) => (
          <div class="tx-entry" key={i}>
            <div class="tx-q">
              <span class="tx-tag">You asked</span>
              <span class="tx-qtext">{t.questionText}</span>
            </div>
            <div class="tx-a">
              <span class="tx-char">{t.characterName}</span>
              <span class="tx-atext">{t.responseText}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
