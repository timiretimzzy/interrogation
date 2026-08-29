// Persistence. Single LocalStorage key per case, versioned. The sessionSeed is
// stored inside PlayerState so a refresh never re-rolls the response variants
// (INV-120). A stable per-install deviceId (generated once, with install-time
// randomness only - never gameplay RNG) feeds the seed derivation.

import { hashSeed, hashStable } from './hash.ts';
import type { PlayerState } from './types.ts';

const STORAGE_PREFIX = 'the-interrogation:';
const VERSION = 'v1';
const DEVICE_KEY = `${STORAGE_PREFIX}device:${VERSION}`;
const stateKey = (caseId: string) => `${STORAGE_PREFIX}state:${VERSION}:${caseId}`;

function getStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const probe = '__ti_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return localStorage;
    }
  } catch {
    /* fall through to memory */
  }
  return null;
}

const memory = new Map<string, string>();
const memoryStore = {
  getItem: (k: string) => (memory.has(k) ? memory.get(k)! : null),
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
} as unknown as Storage;

function store(): Storage {
  return getStorage() ?? memoryStore;
}

/** Stable per-install identifier. Generated once; install-time randomness only. */
export function getDeviceId(): string {
  const s = store();
  const existing = s.getItem(DEVICE_KEY);
  if (existing) return existing;
  let raw: string;
  try {
    const buf = new Uint8Array(16);
    (globalThis.crypto ?? (globalThis as any).msCrypto)?.getRandomValues?.(buf);
    raw = Array.from(buf)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    raw = `fallback-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
  s.setItem(DEVICE_KEY, raw);
  return raw;
}

/** Deterministic seed: same device + case + nonce -> same seed (INV-120). */
export function computeSessionSeed(caseId: string, attemptNonce: number): number {
  return hashSeed(hashStable(getDeviceId()), caseId, attemptNonce);
}

function isValidState(p: unknown): p is PlayerState {
  if (!p || typeof p !== 'object') return false;
  const s = p as Record<string, unknown>;
  return (
    typeof s.caseId === 'string' &&
    typeof s.sessionSeed === 'number' &&
    typeof s.actionsRemaining === 'number' &&
    (s.status === 'playing' || s.status === 'won' || s.status === 'lost') &&
    typeof s.interrogations === 'object' &&
    Array.isArray(s.discoveredClues) &&
    Array.isArray(s.discoveredEvidence) &&
    Array.isArray(s.unlockedQuestions) &&
    Array.isArray(s.activeContradictions)
  );
}

export function loadState(caseId: string): PlayerState | null {
  const raw = store().getItem(stateKey(caseId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isValidState(parsed) && parsed.caseId === caseId) return parsed;
  } catch {
    /* corrupt; ignore */
  }
  return null;
}

export function saveState(state: PlayerState): void {
  try {
    store().setItem(stateKey(state.caseId), JSON.stringify(state));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function clearState(caseId: string): void {
  try {
    store().removeItem(stateKey(caseId));
  } catch {
    /* ignore */
  }
}
