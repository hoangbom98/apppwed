/**
 * App.tsx — Game H5 Frontend root component
 * ------------------------------------------
 * Route structure:
 *  /download, /login, /register  → standalone pages (no layout shell)
 *  all others                    → wrapped in AppShell (Header + BottomNav)
 *
 * Auth guard: ProtectedRoute redirects to /login if not authenticated.
 */
import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell }     from './layout';
import { useAuthStore } from './store/authStore';
import { useSocket }    from './hooks/useSocket';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { InstallPrompt } from '@ui/pwa/install';
import { UpdateBanner }  from '@ui/pwa/update';

// ── Lazy-load all pages ────────────────────────────────────────────────────
const DownloadApp     = lazy(() => import('./views/DownloadApp'));
const Home            = lazy(() => import('./views/Home'));
const Login           = lazy(() => import('./views/Login'));
const Register        = lazy(() => import('./views/Register'));
const GameList        = lazy(() => import('./views/GameList'));
const GameDetail      = lazy(() => import('./views/GameDetail'));
const Deposit         = lazy(() => import('./views/Deposit'));
const Withdraw        = lazy(() => import('./views/Withdraw'));
const BankAccounts    = lazy(() => import('./views/BankAccounts'));
const MyVip           = lazy(() => import('./views/MyVip'));
const Agency          = lazy(() => import('./views/Agency'));
const Promotions      = lazy(() => import('./views/Promotions'));
const PromotionDetail = lazy(() => import('./views/PromotionDetail'));
const Profile         = lazy(() => import('./views/Profile'));
const Notifications   = lazy(() => import('./views/Notifications'));
const Dashboard       = lazy(() => import('./views/Dashboard'));
const Lottery         = lazy(() => import('./views/Lottery'));
// ── New engagement pages (7x7-inspired) ───────────────────────────────────
const Checkin         = lazy(() => import('./views/Checkin'));
const DailyMissions   = lazy(() => import('./views/DailyMissions'));
const LuckyWheel      = lazy(() => import('./views/LuckyWheel'));
const AgentTree       = lazy(() => import('./views/AgentTree'));

// ── Loading fallback ───────────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-dark">
      <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Route auth guard ───────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { token, fetchProfile } = useAuthStore();

  // Restore session on reload
  useEffect(() => {
    if (token) fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket for realtime balance & notifications
  useSocket();

  return (
    <ErrorBoundary>
      <InstallPrompt appName="LKVIP Game" appIcon="/icons/icon-192.png" />
      <UpdateBanner />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* ── Standalone pages — no layout shell ──────────────── */}
          <Route path="/tai-app"    element={<DownloadApp />} />
          <Route path="/download"   element={<DownloadApp />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/register"   element={<Register />} />
          {/* Legacy Vietnamese routes */}
          <Route path="/dang-nhap"  element={<Login />} />
          <Route path="/dang-ky"    element={<Register />} />

          {/* ── Pages with AppShell (Header + BottomNav) ─────────── */}
          <Route element={<AppShell />}>
            {/* Public pages */}
            <Route path="/"                  element={<Home />} />
            <Route path="/game"              element={<GameList />} />
            <Route path="/game/:slug"        element={<GameDetail />} />
            <Route path="/games"             element={<GameList />} />
            <Route path="/games/:slug"       element={<GameDetail />} />
            <Route path="/promotions"        element={<Promotions />} />
            <Route path="/promotions/:id"    element={<PromotionDetail />} />
            <Route path="/khuyen-mai"        element={<Promotions />} />
            <Route path="/khuyen-mai/:id"    element={<PromotionDetail />} />
            <Route path="/lottery"           element={<Lottery />} />
            <Route path="/xo-so"             element={<Lottery />} />

            {/* Protected pages */}
            <Route path="/dashboard"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/bang-dieu-khien"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/deposit"           element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
            <Route path="/nap-tien"          element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
            <Route path="/withdraw"          element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
            <Route path="/rut-tien"          element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
            <Route path="/bank-account"      element={<ProtectedRoute><BankAccounts /></ProtectedRoute>} />
            <Route path="/tai-khoan-ngan-hang" element={<ProtectedRoute><BankAccounts /></ProtectedRoute>} />
            <Route path="/vip"               element={<ProtectedRoute><MyVip /></ProtectedRoute>} />
            <Route path="/agent"             element={<ProtectedRoute><Agency /></ProtectedRoute>} />
            <Route path="/dai-ly"            element={<ProtectedRoute><Agency /></ProtectedRoute>} />
            <Route path="/profile"           element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/ho-so"             element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications"     element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/thong-bao"         element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            {/* ── New engagement routes ─────────────────────────────── */}
            <Route path="/checkin"           element={<ProtectedRoute><Checkin /></ProtectedRoute>} />
            <Route path="/diem-danh"         element={<ProtectedRoute><Checkin /></ProtectedRoute>} />
            <Route path="/missions"          element={<ProtectedRoute><DailyMissions /></ProtectedRoute>} />
            <Route path="/nhiem-vu"          element={<ProtectedRoute><DailyMissions /></ProtectedRoute>} />
            <Route path="/wheel"             element={<ProtectedRoute><LuckyWheel /></ProtectedRoute>} />
            <Route path="/vong-quay"         element={<ProtectedRoute><LuckyWheel /></ProtectedRoute>} />
            <Route path="/agent-tree"        element={<ProtectedRoute><AgentTree /></ProtectedRoute>} />
          </Route>

          {/* Fallback → Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
