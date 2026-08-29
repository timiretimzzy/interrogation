import { notebook } from './store.ts';

export function Transcript() {
  const nb = notebook.value;
  if (!nb) return null;

  return (
    <section class="panel transcript">
      <h2>Transcript</h2>
      <div class="transcript-entries">
        {nb.transcript.length === 0 && <p class="muted">No statements recorded yet.</p>}
        {nb.transcript.map((t, i) => (
          <div class="entry" key={i}>
            <div class="entry-who">{t.characterName} <span class="muted">· {t.questionText}</span></div>
            <div class="entry-what">{t.responseText}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
