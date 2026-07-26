import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { LkvipAntdProvider } from '@ui';
import App from './App';
import './index.css';

// ── PWA Update banner ─────────────────────────────────────────────────────────
function PwaUpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#8b5cf6', color: '#fff', textAlign: 'center', padding: '8px 16px', zIndex: 9999, cursor: 'pointer', fontSize: 14 }}
      onClick={() => updateServiceWorker(true)}
    >
      🔄 Phiên bản mới! Nhấn để cập nhật.
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LkvipAntdProvider project="game">
        <BrowserRouter>
          <PwaUpdateBanner />
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
      </LkvipAntdProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
