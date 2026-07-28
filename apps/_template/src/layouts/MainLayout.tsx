// __APPNAME__/src/layouts/MainLayout.tsx
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/** Wrap authenticated routes — redirects to /login if no token. */
export default function MainLayout() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
        <span className="font-bold text-gray-800">__APPNAME__</span>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
