import { Suspense, lazy, Component, type ErrorInfo, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { InstallPrompt, UpdateBanner } from '@ui';

import MainLayout from '@/layouts/MainLayout';

// ── ErrorBoundary — catch JS errors in lazy-loaded pages (Lỗi 12) ─────────
interface EBState { error: Error | null }
class AppErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error): EBState { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this could ship to Sentry via SENTRY_DSN
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
            style={{ padding: '8px 20px', background: 'var(--hub-primary)', color: '#111',
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

const HomePage       = lazy(() => import('@/pages/HomePage'));
const GamesPage      = lazy(() => import('@/pages/GamesPage'));
const NewsPage       = lazy(() => import('@/pages/NewsPage'));
const LoginPage      = lazy(() => import('@/pages/LoginPage'));
const NotFoundPage   = lazy(() => import('@/pages/NotFoundPage'));
const DownloadPage   = lazy(() => import('@/pages/DownloadPage'));
const WebsitesPage   = lazy(() => import('@/pages/WebsitesPage'));
const ToolsPage      = lazy(() => import('@/pages/ToolsPage'));
const ToolDetailPage = lazy(() => import('@/pages/ToolDetailPage'));
const NewsDetailPage = lazy(() => import('@/pages/NewsDetailPage'));
const GameDetailPage = lazy(() => import('@/pages/GameDetailPage'));
const CmsPage        = lazy(() => import('@/pages/CmsPage'));
const SearchPage     = lazy(() => import('@/pages/SearchPage'));
const ContactPage    = lazy(() => import('@/pages/ContactPage'));
const RegisterPage   = lazy(() => import('@/pages/RegisterPage'));
const ProfilePage    = lazy(() => import('@/pages/ProfilePage'));
const AboutPage      = lazy(() => import('@/pages/AboutPage'));
const PolicyPage     = lazy(() => import('@/pages/PolicyPage'));
const FaqPage        = lazy(() => import('@/pages/FaqPage'));
const FavoritesPage  = lazy(() => import('@/pages/FavoritesPage'));
const AcademyPage    = lazy(() => import('@/pages/AcademyPage'));

function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <>
    <InstallPrompt appName="LKVIP Hub" appIcon="/logo-152-152.png" />
    <UpdateBanner />
    <AppErrorBoundary>
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index              element={<HomePage />} />
          <Route path="games"       element={<GamesPage />} />
          <Route path="games/:slug" element={<GameDetailPage />} />
          <Route path="websites"    element={<WebsitesPage />} />
          <Route path="tools"       element={<ToolsPage />} />
          <Route path="tools/:slug" element={<ToolDetailPage />} />
          <Route path="news"        element={<NewsPage />} />
          <Route path="news/:slug"  element={<NewsDetailPage />} />
          <Route path="pages/:slug" element={<CmsPage />} />
          <Route path="search"      element={<SearchPage />} />
          <Route path="contact"     element={<ContactPage />} />
          <Route path="login"       element={<LoginPage />} />
          <Route path="register"    element={<RegisterPage />} />
          <Route path="profile"     element={<ProfilePage />} />
          <Route path="download"    element={<DownloadPage />} />
          <Route path="about"       element={<AboutPage />} />
          <Route path="policy"      element={<PolicyPage />} />
          <Route path="faq"         element={<FaqPage />} />
          <Route path="favorites"   element={<FavoritesPage />} />
          <Route path="academy"     element={<AcademyPage />} />
          <Route path="*"           element={<NotFoundPage />} />
        </Route>

        {/* Admin panel lives in a separate app (frontend/admin-dashboard).
            Any /admin/* requests here redirect to NotFound so users can't
            accidentally reach a non-existent admin panel. */}
        <Route path="admin/*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    </AppErrorBoundary>
    </>
  );
}
