// Deterministic, dependency-free string -> 32-bit unsigned integer hash.
// Used to derive the per-question seed for response selection so that the
// same (sessionSeed, case, question, character, context) always yields the
// same variant. No Math.random / Date / fetch / LLM anywhere in this module
// (INV-113 / INV-120: refresh- and device-stable, offline, no runtime RNG).

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1a(str: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/**
 * Combine several string/number components into one stable 32-bit seed.
 * Order matters; identical inputs always produce the identical output.
 */
export function hashSeed(...parts: (string | number)[]): number {
  const joined = parts.map((p) => String(p)).join('|');
  return fnv1a(joined);
}

/**
 * Stable, well-distributed 32-bit hash (cyrb53-style). Kept separate so callers
 * needing a second, independent stream (e.g. deviceId) get decorrelated results.
 */
export function hashStable(input: string): number {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  return h1 >>> 0;
}
