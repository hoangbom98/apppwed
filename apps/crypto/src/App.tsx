import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import CryptoLayout from './layouts/CryptoLayout';

const Login     = lazy(() => import('./pages/Login'));
const Register  = lazy(() => import('./pages/Register'));
const Market    = lazy(() => import('./pages/Market'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Chart     = lazy(() => import('./pages/Chart'));
const PairDetail = lazy(() => import('./pages/PairDetail'));
const Profile   = lazy(() => import('./pages/Profile'));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cr-bg)' }}>
      <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--cr-primary) transparent transparent transparent' }} />
    </div>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuthStore();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { token, fetchProfile } = useAuthStore();
  useEffect(() => { if (token) fetchProfile(); }, []); // eslint-disable-line

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<Guard><CryptoLayout /></Guard>}>
          <Route index                  element={<Market />} />
          <Route path="watchlist"       element={<Watchlist />} />
          <Route path="chart"           element={<Chart />} />
          <Route path="chart/:symbol"   element={<PairDetail />} />
          <Route path="profile"         element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
