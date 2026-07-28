// apps/admin-dashboard/src/core/layouts/AuthLayout.tsx
// Wrapper cho trang login / forgot-password — full-height dark bg.
import type { FC } from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: FC = () => (
  <div className="min-h-screen bg-gray-950">
    <Outlet />
  </div>
);

export default AuthLayout;
