import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// The single mount point. `main.tsx` does one job: attach the React tree to the DOM.
// Everything else (providers, routing) lives in <App/> so this file never grows.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
