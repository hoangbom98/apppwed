// frontend/admin-dashboard/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { LkvipAntdProvider } from '@lkvip/ui';
import App from './App';
import './index.css';

// ── PWA: Register Service Worker (production only) ────────────────────────────
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((reg) => {
      reg.addEventListener('updatefound', () => {
        const next = reg.installing;
        if (!next) return;
        next.addEventListener('statechange', () => {
          if (next.state === 'installed' && navigator.serviceWorker.controller) {
            document.dispatchEvent(new CustomEvent('sw:update-available'));
          }
        });
      });
    })
    .catch((err) => console.warn('[SW] Registration failed:', err));
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LkvipAntdProvider project="admin">
      <App />
    </LkvipAntdProvider>
  </React.StrictMode>
);
