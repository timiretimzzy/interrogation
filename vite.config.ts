import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dirname = fileURLToPath(new URL('.', import.meta.url));

// Build identifier for tester bug-reports. Derived from the current git commit
// so a deployed build is traceable to a source revision (INV-001 traceability).
const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
})();
const APP_VERSION = `0.3.0-test+${commit}`;

// NOTE: Earlier builds hard-coded `people-pool` / `card-library` manual chunks
// for the rejected people-identifier architecture. Both data files are deleted
// and that model is superseded. Per-case data is loaded dynamically, so no
// manual chunk entries are needed here.
export default defineConfig({
  // Deployed under the project-pages subpath: https://<user>.github.io/interrogation/
  base: '/interrogation/',
  plugins: [
    preact(),
    VitePWA({
      // autoUpdate so testers always receive the latest deployed build instead of
      // being pinned to a stale cached bundle (a known earlier local failure mode).
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: {
        name: 'The Interrogation',
        short_name: 'Interrogate',
        description: 'A crime-mystery interrogation game (controlled test build).',
        start_url: '/interrogation/',
        scope: '/interrogation/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
  },
  define: {
    // Exposed to the app as import.meta.env.VITE_APP_VERSION (read-only build id).
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION),
  },
  resolve: {
    alias: {
      '@': resolve(dirname, 'src'),
    },
  },
});
