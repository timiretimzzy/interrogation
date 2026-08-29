import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const dirname = fileURLToPath(new URL('.', import.meta.url));

// NOTE: Earlier builds hard-coded `people-pool` / `card-library` manual chunks
// for the rejected people-identifier architecture. Both data files are deleted
// and that model is superseded. Per-case data is loaded dynamically, so no
// manual chunk entries are needed here.
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: {
        name: 'The Interrogation',
        short_name: 'Interrogate',
        description: 'A daily crime-mystery interrogation game',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [],
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
  resolve: {
    alias: {
      '@': resolve(dirname, 'src'),
    },
  },
});
