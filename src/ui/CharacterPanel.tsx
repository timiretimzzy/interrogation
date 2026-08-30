import {
  currentCase,
  activeCharacter,
  availableQuestions,
  ask,
  selectCharacter,
  playerState,
} from './store.ts';

function prettifyRole(role: string): string {
  return String(role).replace(/_/g, ' ');
}

export function CharacterPanel() {
  const cf = currentCase();
  const s = playerState.value;
  if (!cf) return null;
  const activeId = activeCharacter.value ?? cf.characters[0]?.id;
  const character = cf.characters.find((c) => c.id === activeId);

  const askedOfActive = new Set<string>(
    character ? (s?.interrogations[character.id] ?? []).map((r) => r.questionId) : [],
  );
  const available = availableQuestions(character?.id ?? '').filter((q) => !askedOfActive.has(q.id));
  const askedRecords = character
    ? (s?.interrogations[character.id] ?? [])
        .map((rec) => ({ rec, q: cf.questions.find((x) => x.id === rec.questionId) }))
        .filter((x) => x.q)
    : [];

  return (
    <section class="panel character-panel">
      <h2>People</h2>
      <div class="character-tabs">
        {cf.characters.map((c) => {
          const interviewed = (s?.interrogations[c.id]?.length ?? 0) > 0;
          return (
            <button
              key={c.id}
              class={c.id === activeId ? 'tab active' : 'tab'}
              onClick={() => selectCharacter(c.id)}
            >
              {c.name}
              {interviewed && <span class="tab-dot" title="Interrogated">●</span>}
            </button>
          );
        })}
      </div>

      {character && (
        <div class="character-detail">
          <div class="character-name">{character.name}</div>
          <div class="character-role">{prettifyRole(character.role)} · {character.personality}</div>
          <p class="character-desc">{character.visibleDescription}</p>

          <h3>Ask</h3>
          <ul class="question-list">
            {available.map((q) => (
              <li key={q.id}>
                <button class="question-btn" onClick={() => ask(character.id, q.id)}>
                  {q.text}
                </button>
              </li>
            ))}
            {available.length === 0 && askedRecords.length === 0 && (
              <li class="muted">No questions available yet.</li>
            )}
          </ul>

          {askedRecords.length > 0 && (
            <>
              <h3>Asked</h3>
              <ul class="question-list asked-list">
                {askedRecords.map(({ rec, q }) => (
                  <li key={rec.questionId} class="asked-item">
                    <div class="tx-q">
                      <span class="tx-tag">You</span>
                      <span class="tx-qtext">{q!.text}</span>
                    </div>
                    <div class="tx-a">
                      <span class="tx-char">{character.name}</span>
                      <span class="tx-atext">{rec.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
