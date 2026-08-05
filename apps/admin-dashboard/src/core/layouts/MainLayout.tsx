/**
 * MainLayout — Layout sidebar registry-driven cho Admin Dashboard.
 * Menu được build tự động từ module registry; không cần hard-code nav items.
 * Import file này thay vì AdminLayout.jsx để đảm bảo tương thích tất cả route hiện tại.
 */
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@admin/store/adminStore';
import { useSiteConfig } from '@admin/core/hooks/useSiteConfig';
import { getVisibleMenuGroups } from '../../modules/registry';
import { LogOut } from 'lucide-react';

export const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const { appName }      = useSiteConfig();
  const navigate         = useNavigate();

  const groups = getVisibleMenuGroups(user ?? { role: 'super_admin' });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-gray-800">
          <span className="font-black text-blue-400 tracking-tight text-base truncate">{appName}</span>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
          {groups.map(group => (
            <div key={group.key} className="mb-1">
              {group.label && (
                <h2 className="text-gray-500 text-xs font-semibold uppercase mt-4 mb-1 px-4">
                  {group.label}
                </h2>
              )}
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-2 px-4 rounded-md mx-2 text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  {item.icon && <item.icon size={15} className="flex-shrink-0" />}
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-gray-800">
          {user && (
            <div className="px-4 py-2 text-xs text-gray-500 truncate">{user.email || user.username}</div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} className="flex-shrink-0" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto min-w-0 flex flex-col">
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-5 sticky top-0 z-30 flex-shrink-0">
          <span className="font-semibold text-gray-200 text-sm">{appName}</span>
          {user && (
            <span className="text-xs text-gray-400">{user.email || user.username}</span>
          )}
        </header>
        <main className="flex-1 p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
