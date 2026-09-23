import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import './index.css';

// 0. Polyfill/define EmptyRanges in globalThis & window to prevent Safari/WebKit extension ReferenceErrors
if (typeof (globalThis as any).EmptyRanges === 'undefined') {
  (globalThis as any).EmptyRanges = Object.freeze([]);
}
if (typeof window !== 'undefined' && typeof (window as any).EmptyRanges === 'undefined') {
  (window as any).EmptyRanges = Object.freeze([]);
}

// Guard against third-party cross-origin frame access SecurityErrors and extension noise inside sandboxed/iframe preview environments
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event: ErrorEvent) => {
    const msg = event?.message || '';
    if (
      msg.includes('cross-origin frame') ||
      msg.includes('Blocked a frame with origin') ||
      msg.includes('EmptyRanges') ||
      event.error?.name === 'SecurityError'
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    if (
      reasonMsg.includes('cross-origin frame') ||
      reasonMsg.includes('Blocked a frame with origin') ||
      reasonMsg.includes('EmptyRanges') ||
      event.reason?.name === 'SecurityError'
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

