import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './ui/App.tsx';
import './style.css';

// Register the PWA service worker (autoUpdate: testers always get the latest
// deployed build; stale cached bundles are invalidated on next load).
registerSW({ immediate: true });

const root = document.getElementById('app');
if (root) {
  render(<App />, root);
}
