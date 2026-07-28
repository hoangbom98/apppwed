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
      style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'var(--app-primary, #3b82f6)', color: '#fff', textAlign: 'center', padding: '8px 16px', zIndex: 9999, cursor: 'pointer', fontSize: 14 }}
      onClick={() => updateServiceWorker(true)}
    >
      🔄 Phiên bản mới! Nhấn để cập nhật.
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:           1,
      staleTime:       30_000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LkvipAntdProvider project={import.meta.env.VITE_PROJECT || '__PROJECT__'}>
        <BrowserRouter>
          <PwaUpdateBanner />
          <App />
          <Toaster position="top-right" />
        </BrowserRouter>
      </LkvipAntdProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
