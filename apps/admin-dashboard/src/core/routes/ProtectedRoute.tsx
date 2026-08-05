// Route guard with three layers:
//   1. Authentication — must have a valid token
//   2. Role gate     — requiredRole must match (super_admin bypasses all)
//   3. Module gate   — requiredModule must appear in JWT user.modules[]
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@admin/store/adminStore';

interface AccessDeniedProps {
  module?: string;
}

// Minimal inline 403 view — keeps this file self-contained
function AccessDenied({ module: mod }: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="text-5xl font-black text-red-500/60">403</div>
      <div className="text-lg font-semibold text-gray-300">Không có quyền truy cập</div>
      <div className="text-sm text-gray-500">
        Tài khoản của bạn không được phép quản lý module{mod ? ` "${mod}"` : ''}.
        <br />Vui lòng liên hệ Super Admin để được cấp quyền.
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredModule?: string;
}

export default function ProtectedRoute({ children, requiredRole, requiredModule }: ProtectedRouteProps) {
  const { token, user } = useAuthStore();

  // ── 1. Not authenticated ───────────────────────────────────────────────────
  if (!token) return <Navigate to="/login" replace />;

  // ── 2. Role gate ───────────────────────────────────────────────────────────
  if (requiredRole && user?.role !== 'super_admin' && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // ── 3. Module access gate ──────────────────────────────────────────────────
  // Only enforced when user.modules[] is present in the JWT payload.
  // super_admin always bypasses the module gate.
  if (
    requiredModule &&
    user?.role !== 'super_admin' &&
    Array.isArray(user?.modules) &&
    !user.modules.includes(requiredModule)
  ) {
    return <AccessDenied module={requiredModule} />;
  }

  return <>{children}</>;
}
