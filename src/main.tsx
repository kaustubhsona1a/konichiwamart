import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against third-party cross-origin frame access SecurityErrors inside sandboxed/iframe preview environments
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event: ErrorEvent) => {
    const msg = event?.message || '';
    if (
      msg.includes('cross-origin frame') ||
      msg.includes('Blocked a frame with origin') ||
      event.error?.name === 'SecurityError'
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('[Security Shield] Intercepted cross-origin frame security error in sandboxed environment:', msg);
    }
  }, true);

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    if (
      reasonMsg.includes('cross-origin frame') ||
      reasonMsg.includes('Blocked a frame with origin') ||
      event.reason?.name === 'SecurityError'
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('[Security Shield] Intercepted unhandled cross-origin rejection in sandboxed environment:', reasonMsg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

