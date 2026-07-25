import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useRegisterSW } from 'virtual:pwa-register/react';
import App from './App';
import './index.css';

// ── PWA Update banner ─────────────────────────────────────────────────────────
function PwaUpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#ec4899', color: '#fff', textAlign: 'center', padding: '8px 16px', zIndex: 9999, cursor: 'pointer', fontSize: 14 }}
      onClick={() => updateServiceWorker(true)}
    >
      🔄 Phiên bản mới! Nhấn để cập nhật.
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PwaUpdateBanner />
        <App />
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
