import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import BankLayout from './layouts/BankLayout';

// ── Standalone pages ──────────────────────────────────────────────────────────
const Login    = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// ── Protected pages ───────────────────────────────────────────────────────────
const Home        = lazy(() => import('./pages/Home'));
const Deposit     = lazy(() => import('./pages/Deposit'));
const Withdraw    = lazy(() => import('./pages/Withdraw'));
const History     = lazy(() => import('./pages/History'));
const Accounts    = lazy(() => import('./pages/Accounts'));
const Profile     = lazy(() => import('./pages/Profile'));
const Transfer    = lazy(() => import('./pages/Transfer'));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bank-bg)' }}>
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--bank-primary) transparent transparent transparent' }} />
    </div>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuthStore();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { token, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (token) fetchProfile();
  }, []); // eslint-disable-line

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Standalone */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route element={<Guard><BankLayout /></Guard>}>
          <Route index                element={<Home />} />
          <Route path="deposit"       element={<Deposit />} />
          <Route path="withdraw"      element={<Withdraw />} />
          <Route path="history"       element={<History />} />
          <Route path="accounts"      element={<Accounts />} />
          <Route path="profile"       element={<Profile />} />
          <Route path="transfer"      element={<Transfer />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
