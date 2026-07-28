import { Suspense, lazy, Component, type ErrorInfo, type ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';

// ── ErrorBoundary — catch JS errors in lazy-loaded pages ──────────────────────
interface EBState { error: Error | null }
class AppErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error): EBState { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('[AppErrorBoundary]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '60vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24,
        }}>
          <p style={{ color: '#f87171', fontWeight: 700, fontSize: 16 }}>
            Đã xảy ra lỗi. Vui lòng tải lại trang.
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ padding: '8px 20px', background: 'var(--app-primary, #3b82f6)', color: '#fff',
              borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Lazy-load pages ───────────────────────────────────────────────────────────
const HomePage    = lazy(() => import('@/pages/HomePage'));
const LoginPage   = lazy(() => import('@/pages/LoginPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/"      element={<HomePage />} />
          <Route path="login"  element={<LoginPage />} />
          <Route path="*"      element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}
