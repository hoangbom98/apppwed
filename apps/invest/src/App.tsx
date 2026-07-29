import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import InvestLayout from './layouts/InvestLayout';

const Login     = lazy(() => import('./pages/Login'));
const Register  = lazy(() => import('./pages/Register'));
const Home      = lazy(() => import('./pages/Home'));
const Packages  = lazy(() => import('./pages/Packages'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Detail    = lazy(() => import('./pages/PackageDetail'));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--inv-bg)' }}>
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--inv-primary) transparent transparent transparent' }} />
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

        <Route element={<Guard><InvestLayout /></Guard>}>
          <Route index                    element={<Home />} />
          <Route path="packages"          element={<Packages />} />
          <Route path="packages/:id"      element={<Detail />} />
          <Route path="portfolio"         element={<Portfolio />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
