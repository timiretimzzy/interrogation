import { currentCase, activeCharacter, availableQuestions, ask, selectCharacter } from './store.ts';

export function CharacterPanel() {
  const cf = currentCase();
  if (!cf) return null;
  const activeId = activeCharacter.value ?? cf.characters[0]?.id;
  const character = cf.characters.find((c) => c.id === activeId);

  return (
    <section class="panel character-panel">
      <h2>People</h2>
      <div class="character-tabs">
        {cf.characters.map((c) => (
          <button
            key={c.id}
            class={c.id === activeId ? 'tab active' : 'tab'}
            onClick={() => selectCharacter(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {character && (
        <div class="character-detail">
          <div class="character-name">{character.name}</div>
          <div class="character-role">{character.role} · {character.personality}</div>
          <p class="character-desc">{character.visibleDescription}</p>

          <h3>Ask</h3>
          <ul class="question-list">
            {availableQuestions(character.id).map((q) => (
              <li key={q.id}>
                <button class="question-btn" onClick={() => ask(character.id, q.id)}>
                  <span class="q-mech">{q.mechanic}</span> {q.text}
                </button>
              </li>
            ))}
            {availableQuestions(character.id).length === 0 && (
              <li class="muted">No questions available yet.</li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
