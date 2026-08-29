import {
  accusationDimensions,
  accusationDraft,
  setAccusationValue,
  submitAccusationNow,
  accusePanelOpen,
} from './store.ts';

export function Accusation() {
  const dims = accusationDimensions();
  if (!accusePanelOpen.value) {
    return (
      <section class="panel accusation-collapsed">
        <h2>Accusation</h2>
        <p class="muted">When you are ready to name who did it and why, make your accusation.</p>
        <button class="accuse-open-btn" onClick={() => (accusePanelOpen.value = true)}>
          Make an accusation
        </button>
      </section>
    );
  }

  return (
    <section class="panel accusation">
      <h2>Accusation</h2>
      <p class="muted">Accusing ends the case. Answer every required question.</p>
      {dims.map((d) => (
        <div class="acc-dimension" key={d.id}>
          <label class="acc-prompt">{d.prompt}</label>
          <div class="acc-options">
            {d.options.map((o) => {
              const value = typeof o === 'string' ? o : o.value;
              const label = typeof o === 'string' ? o : o.label ?? o.value;
              return (
                <label key={value} class="acc-option">
                  <input
                    type="radio"
                    name={d.id}
                    value={value}
                    checked={accusationDraft.value[d.id] === value}
                    onChange={() => setAccusationValue(d.id, value)}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <button class="accuse-btn" onClick={() => submitAccusationNow()}>
        Accuse
      </button>
      <button class="link" onClick={() => (accusePanelOpen.value = false)}>
        Cancel
      </button>
    </section>
  );
}
