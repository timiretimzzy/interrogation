// Build audit (NFR-001 / INV-001).
// Runs after `vite build`. Verifies the production bundle exists and reports
// asset sizes against the V1 budget (<=100KB initial JS gzipped, excluding
// puzzle data which is split into lazy chunks). Exits non-zero if the build
// output is missing.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  console.error('✗ dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

if (!existsSync(join(dist, 'index.html'))) {
  console.error('✗ dist/index.html missing.');
  process.exit(1);
}

const assetsDir = join(dist, 'assets');
const jsFiles = existsSync(assetsDir) ? readdirSync(assetsDir).filter((f) => f.endsWith('.js')) : [];

function gzipSize(p) {
  return gzipSync(readFileSync(p)).length;
}

let total = 0;
console.log('JS assets (gzipped):');
for (const f of jsFiles) {
  const p = join(assetsDir, f);
  const z = gzipSize(p);
  total += z;
  const kb = (z / 1024).toFixed(1);
  console.log(`  ${f}: ${kb} KB`);
}

console.log(`\nTotal JS (gzipped): ${(total / 1024).toFixed(1)} KB`);
const INITIAL_BUDGET = 100 * 1024;
if (total > INITIAL_BUDGET) {
  console.warn(`⚠ Initial JS bundle exceeds ${INITIAL_BUDGET / 1024} KB budget (puzzle data should be in lazy chunks).`);
} else {
  console.log('✓ Within initial JS budget.');
}
console.log('\nBuild audit passed.');
