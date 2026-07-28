// frontend/admin-dashboard/src/core/layouts/MainLayout.tsx
// Legacy layout stub — superseded by AdminLayout.jsx.
// Kept for backwards compatibility with any direct import; delegates to the
// new registry-driven sidebar without using the removed `menu` property.
import { NavLink, Outlet } from 'react-router-dom';
import { getVisibleMenuGroups } from '../../modules/registry';

export const MainLayout = () => {
  // No user context here — show all groups (super_admin view)
  const groups = getVisibleMenuGroups({ role: 'super_admin' });

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-6">Admin Panel</h1>
        <nav className="space-y-2">
          {groups.map(group => (
            <div key={group.key}>
              {group.label && (
                <h2 className="text-gray-400 text-xs font-semibold uppercase mt-3 mb-1 px-2">
                  {group.label}
                </h2>
              )}
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `block py-2 px-4 rounded text-sm ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-gray-100">
        <header className="bg-white p-4 shadow">Header</header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
