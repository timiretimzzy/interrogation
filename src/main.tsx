import { render } from 'preact';
import { App } from './ui/App.tsx';
import './style.css';

const root = document.getElementById('app');
if (root) {
  render(<App />, root);
}
