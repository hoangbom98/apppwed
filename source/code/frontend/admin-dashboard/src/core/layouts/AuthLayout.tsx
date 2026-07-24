// frontend/admin-dashboard/src/core/layouts/AuthLayout.tsx
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
};
export default AuthLayout;
