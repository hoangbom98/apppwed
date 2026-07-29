import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AcademyLayout from './layouts/AcademyLayout';

const LoginPage       = lazy(() => import('./pages/LoginPage'));
const CoursesPage     = lazy(() => import('./pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const MyCoursesPage   = lazy(() => import('./pages/MyCoursesPage'));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ac-bg)' }}>
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--ac-primary) transparent transparent transparent' }} />
    </div>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuthStore();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { token, fetchProfile } = useAuthStore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (token) fetchProfile(); }, []);

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<Guard><AcademyLayout /></Guard>}>
          <Route index             element={<CoursesPage />} />
          <Route path="courses"    element={<CoursesPage />} />
          <Route path="courses/:slug" element={<CourseDetailPage />} />
          <Route path="my"         element={<MyCoursesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
