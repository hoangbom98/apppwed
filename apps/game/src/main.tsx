import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

// ── PWA: Register Service Worker ──────────────────────────────────────────────
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((reg) => {
      console.info('[SW] Game portal registered, scope:', reg.scope);
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e2a2a',
              color: '#f1f5f9',
              border: '1px solid #194C38',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#FACF20', secondary: '#0F1A1A' } },
            error:   { iconTheme: { primary: '#EA4E3D', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
