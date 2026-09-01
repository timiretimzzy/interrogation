// UI store: a thin signals wrapper around the deterministic engine. It holds the
// current PlayerState, persists it, and exposes the only allowed player actions.
// The engine itself is data-agnostic; this module only wires a chosen CaseFile in.

import { signal, computed } from '@preact/signals';
import { cases, getCaseFile } from '../data/cases/index.ts';
import {
  createInitialPlayerState,
  CaseFile,
  PlayerState,
  AccusationDimension,
} from '../core/types.ts';
import {
  computeSessionSeed,
  loadState,
  saveState,
  clearState,
} from '../core/persistence.ts';
import { ask as engineAsk, availableQuestionsForCharacter } from '../core/cardEngine.ts';
import { buildNotebook, NotebookView } from '../core/notebook.ts';
import {
  submitAccusation,
  evaluateAccusation,
  buildAccusationForm,
} from '../core/accusationEngine.ts';
import { buildReveal, RevealView } from '../core/revealEngine.ts';

export const caseList = cases;
export const currentCaseId = signal<string | null>(null);
export const playerState = signal<PlayerState | null>(null);
export const activeCharacter = signal<string | null>(null);
export const accusationDraft = signal<Record<string, string>>({});
export const error = signal<string | null>(null);

// Whether the (answer-spoiling) accusation form is currently expanded. Hidden by
// default so the solution is not exposed in the initial UI payload (answer-security).
export const accusePanelOpen = signal<boolean>(false);

// Game stage: 'select' -> 'briefing' (case setup) -> 'investigation' (actual play).
// A resumed case skips the briefing; a fresh case shows it before interrogation.
export type GameStage = 'select' | 'briefing' | 'investigation';
export const gameStage = signal<GameStage>('select');

// Whether the (non-spoiler) Theory panel is currently expanded.
export const theoryOpen = signal<boolean>(false);

export function currentCase(): CaseFile | null {
  const id = currentCaseId.value;
  return id ? getCaseFile(id) : null;
}

export const notebook = computed<NotebookView | null>(() => {
  const cf = currentCase();
  const s = playerState.value;
  return cf && s ? buildNotebook(cf, s) : null;
});

export const reveal = computed<RevealView | null>(() => {
  const cf = currentCase();
  const s = playerState.value;
  if (!cf || !s || s.status === 'playing') return null;
  const evaluation = evaluateAccusation(cf, s, s.accusation ?? {});
  return buildReveal(cf, s, evaluation);
});

export function startCase(caseId: string, attemptNonce = 0): void {
  const cf = getCaseFile(caseId);
  if (!cf) return;
  const existing = loadState(caseId);
  const state = existing ?? createInitialPlayerState(cf, computeSessionSeed(caseId, attemptNonce));
  currentCaseId.value = caseId;
  playerState.value = state;
  activeCharacter.value = cf.characters[0]?.id ?? null;
  accusationDraft.value = Object.fromEntries(
    buildAccusationForm(cf).map((d) => [d.id, '']),
  );
  accusePanelOpen.value = false;
  theoryOpen.value = false;
  gameStage.value = existing ? 'investigation' : 'briefing';
  error.value = null;
  if (!existing) saveState(state);
}

export function ask(characterId: string, questionId: string): void {
  const cf = currentCase();
  const s = playerState.value;
  if (!cf || !s) return;
  try {
    const result = engineAsk(cf, s, characterId, questionId);
    playerState.value = result.state;
    saveState(result.state);
    error.value = null;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

export function selectCharacter(characterId: string): void {
  // Free action (INV-118): no cost.
  activeCharacter.value = characterId;
}

export function availableQuestions(characterId: string) {
  const cf = currentCase();
  const s = playerState.value;
  if (!cf || !s) return [];
  return availableQuestionsForCharacter(cf, s, characterId);
}

export function submitAccusationNow(): void {
  const cf = currentCase();
  const s = playerState.value;
  if (!cf || !s) return;
  if (s.status !== 'playing') return;
  const next = submitAccusation(cf, s, accusationDraft.value);
  playerState.value = next;
  saveState(next);
}

export function setAccusationValue(dimensionId: string, value: string): void {
  accusationDraft.value = { ...accusationDraft.value, [dimensionId]: value };
}

export function beginInvestigation(): void {
  gameStage.value = 'investigation';
}

export function setTheoryField(dimensionId: string, value: string): void {
  const s = playerState.value;
  if (!s) return;
  const theory = { ...(s.theory ?? {}), [dimensionId]: value };
  const next = { ...s, theory };
  playerState.value = next;
  saveState(next);
}

export function setTheoryNote(value: string): void {
  const s = playerState.value;
  if (!s) return;
  const theory = { ...(s.theory ?? {}), __note__: value };
  const next = { ...s, theory };
  playerState.value = next;
  saveState(next);
}

export function resetCase(caseId: string): void {
  clearState(caseId);
  startCase(caseId);
}

export function backToSelect(): void {
  currentCaseId.value = null;
  playerState.value = null;
  activeCharacter.value = null;
  gameStage.value = 'select';
}

export function accusationDimensions(): AccusationDimension[] {
  const cf = currentCase();
  return cf ? buildAccusationForm(cf) : [];
}

export function canAccuse(): boolean {
  const cf = currentCase();
  const s = playerState.value;
  return !!(cf && s && cf.playerRules.accusationAvailableAtAnyTime);
}
