import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DesktopLayout from '@/components/layout/DesktopLayout';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@ui/hooks/useSocket';
import { useTradeWebSocket } from '@/hooks/useTradeWebSocket';
import { InstallPrompt } from '@ui/pwa/install';
import { UpdateBanner }  from '@ui/pwa/update';

// ── Lazy pages ─────────────────────────────────────────────────────────────────
// Auth & standalone
const LoginPage          = lazy(() => import('@/pages/Login'));
const RegisterPage       = lazy(() => import('@/pages/Register'));
const DownloadPage       = lazy(() => import('@/pages/Download'));
const TwoFactorPage      = lazy(() => import('@/pages/TwoFactor'));

// Main app
const MarketPage          = lazy(() => import('@/pages/Market'));
const TradingTerminalPage = lazy(() => import('@/pages/TradingTerminal'));
const PortfolioPage       = lazy(() => import('@/pages/Portfolio'));
const WalletPage          = lazy(() => import('@/pages/WalletPage'));
const OrderHistoryPage    = lazy(() => import('@/pages/OrderHistory'));
const NotificationsPage   = lazy(() => import('@/pages/Notifications'));
const KYCPage             = lazy(() => import('@/pages/KYC'));
const ProfilePage         = lazy(() => import('@/pages/Profile'));
const SettingsPage        = lazy(() => import('@/pages/Settings'));
const InvestmentPage      = lazy(() => import('@/pages/Investment'));
const ReferralPage        = lazy(() => import('@/pages/Referral'));

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bn-bg-base)' }}>
      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--bn-yellow) transparent transparent transparent' }} />
    </div>
  );
}

// ── ProtectedRoute ─────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const { token, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (token) fetchProfile();
  }, []); // eslint-disable-line

  // Shared socket connection (used by useTradeWebSocket internally)
  useSocket();
  // WebSocket real-time price updates — subscribes to all pairs in store
  useTradeWebSocket();

  return (
    <Suspense fallback={<Spinner />}>
      <InstallPrompt appName="LKVIP Trade" appIcon="/icons/app-icon.svg" />
      <UpdateBanner />
      <Routes>
        {/* Auth & standalone pages — no layout */}
        <Route path="login"    element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="download" element={<DownloadPage />} />
        <Route path="2fa"      element={<TwoFactorPage />} />

        {/* Main app — with desktop layout */}
        <Route element={<DesktopLayout />}>
          {/* Public */}
          <Route index               element={<MarketPage />} />
          <Route path="markets"      element={<MarketPage />} />
          <Route path="terminal"     element={<TradingTerminalPage />} />

          {/* Protected */}
          <Route path="portfolio"    element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="wallet"       element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
          <Route path="orders"       element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
          <Route path="investment"   element={<ProtectedRoute><InvestmentPage /></ProtectedRoute>} />
          <Route path="referral"     element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
          <Route path="kyc"          element={<ProtectedRoute><KYCPage /></ProtectedRoute>} />
          <Route path="profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="settings"     element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
