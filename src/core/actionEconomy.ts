// Action economy. Interrogation actions (ask / follow-up / confront) cost one
// action from the per-case budget. Switching characters, reviewing the notebook,
// reviewing evidence, and editing the silent theory board are FREE (INV-118).

import type { PlayerState } from './types.ts';

export const INTERROGATION_ACTION_COST = 1;

export type ActionCategory =
  | 'interrogation'
  | 'switch'
  | 'notebook'
  | 'evidence'
  | 'theory'
  | 'accusation';

/** Only interrogation actions consume the budget. Everything else is free. */
export function isFreeAction(category: ActionCategory): boolean {
  return category !== 'interrogation';
}

export function canAfford(state: PlayerState, category: ActionCategory): boolean {
  if (isFreeAction(category)) return true;
  return state.actionsRemaining >= INTERROGATION_ACTION_COST;
}

/** Returns the new actionsRemaining after performing a category of action. */
export function applyActionCost(state: PlayerState, category: ActionCategory): number {
  if (isFreeAction(category)) return state.actionsRemaining;
  return Math.max(0, state.actionsRemaining - INTERROGATION_ACTION_COST);
}

export function isOutOfActions(state: PlayerState): boolean {
  return state.actionsRemaining <= 0;
}
