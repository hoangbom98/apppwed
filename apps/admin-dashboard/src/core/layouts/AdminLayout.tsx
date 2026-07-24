// frontend/admin-dashboard/src/core/layouts/AdminLayout.tsx
// Full sidebar + header layout for the admin panel.
// Menu is driven entirely by the Module Registry — no hard-coded NAV_GROUPS.
// To add a new sub-project: create modules/newproject/index.ts and call registerModule().
// This file must NEVER be imported by any user-facing sub-project.
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@admin/store/adminStore';
import { useSiteConfig }  from '@admin/core/hooks/useSiteConfig';
import { useAdminSocket } from '@admin/core/hooks/useAdminSocket';
import { ToastProvider }  from '@admin/modules/shared/components/Toast';
import Breadcrumb          from '@admin/modules/shared/components/Breadcrumb';

// ── Module registry bootstrap ──────────────────────────────────────────────────
// Each import triggers registerModule() inside the module's index.ts.
// Order controls sidebar rendering order.
import '@admin/modules/game/index';
import '@admin/modules/dating/index';
import '@admin/modules/sports/index';
import '@admin/modules/trade/index';
import '@admin/modules/hub/index';
import '@admin/modules/ops/index';
import '@admin/modules/settings/index';

import { getVisibleMenuGroups, type MenuGroup, type MenuItem } from '@admin/modules/registry';

import {
  LayoutDashboard, UserCircle,
  Users, CreditCard, ArrowDownUp, Bell, Shield, Tag, Radio, FileText, Activity,
  Settings, Palette, SlidersHorizontal, ShieldCheck, Server, HandCoins,
  Settings2, PlugZap, Clock4,
  LogOut, ChevronLeft, ChevronDown, X, AlignLeft,
} from 'lucide-react';

// ── Static groups (always visible to all authenticated admins) ─────────────────
const CORE_GROUPS: MenuGroup[] = [
  {
    key:   'overview',
    label: null,
    items: [
      { to: '/',     icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/mine', icon: UserCircle,      label: 'Trang cá nhân' },
    ],
  },
  {
    key:   'cross',
    label: 'Quản trị chung',
    items: [
      { to: '/members',       icon: Users,       label: 'Thành viên' },
      { to: '/finance',       icon: CreditCard,  label: 'Nạp / Rút tiền' },
      { to: '/transactions',  icon: ArrowDownUp, label: 'Giao dịch' },
      { to: '/rebates',       icon: HandCoins,   label: 'Hoàn trả (Rebate)' },
      { to: '/agents',        icon: HandCoins,   label: 'Đại lý' },
      { to: '/promotions',    icon: Tag,         label: 'Khuyến mãi' },
      { to: '/announcements', icon: Bell,        label: 'Thông báo' },
      { to: '/im',            icon: Bell,        label: 'IM & Support' },
      { to: '/risk',          icon: Shield,      label: 'Rủi ro & Audit' },
      { to: '/logs',          icon: FileText,    label: 'Audit Logs' },
      { to: '/monitor',       icon: Radio,       label: 'Giám sát Realtime' },
      { to: '/realtime',      icon: Activity,    label: 'Live Feed' },
    ],
  },
];

const SYSTEM_GROUP: MenuGroup = {
  key:   'system',
  label: 'Hệ thống',
  items: [
    { to: '/payment-gateways',         icon: CreditCard,        label: 'Cổng thanh toán' },
    { to: '/config/general',           icon: Palette,           label: 'Giao diện' },
    { to: '/config',                   icon: SlidersHorizontal, label: 'Cấu hình' },
    { to: '/settings',                 icon: Settings,          label: 'Cài đặt' },
    { to: '/settings/general',         icon: Settings2,         label: 'Cài đặt chung' },
    { to: '/settings/connections',     icon: PlugZap,           label: 'Kết nối' },
    { to: '/settings/notification-tpl',icon: Bell,              label: 'Template thông báo' },
    { to: '/settings/cron-jobs',       icon: Clock4,            label: 'Cron Jobs' },
    { to: '/settings/security',        icon: Shield,            label: 'Bảo mật' },
    { to: '/settings/admins',          icon: ShieldCheck,       label: 'Tài khoản Admin' },
    { to: '/settings/roles',           icon: ShieldCheck,       label: 'Roles & Quyền' },
    { to: '/settings/system',          icon: Server,            label: 'Hệ thống' },
  ],
};

// ── Sidebar nav group ──────────────────────────────────────────────────────────
interface NavGroupProps {
  group: MenuGroup;
  collapsed: boolean;
  defaultOpen?: boolean;
}

function NavGroup({ group, collapsed, defaultOpen = false }: NavGroupProps) {
  const { pathname } = useLocation();
  const hasActive = group.items.some((item: MenuItem) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to)
  );
  const [open, setOpen] = useState(defaultOpen || hasActive);

  // No header → always render items
  if (!group.label) {
    return (
      <div>
        {group.items.map(item => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-1">
      {/* Group header */}
      {!collapsed && (
        <button
          onClick={() => setOpen(v => !v)}
          className={`w-full flex items-center justify-between px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            hasActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span>{group.label}</span>
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
      {collapsed && <div className="h-px bg-gray-800 mx-2 my-1" />}

      {/* Items */}
      {(open || collapsed) && (
        <div>
          {group.items.map(item => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  );
}

interface NavItemProps {
  item: MenuItem;
  collapsed: boolean;
}

function NavItem({ item, collapsed }: NavItemProps) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500'
            : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
        }`
      }
    >
      <item.icon size={16} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

// ── Main layout ────────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout }  = useAuthStore();
  const { appName }       = useSiteConfig();
  const navigate          = useNavigate();

  // Activate real-time admin socket (auto-disconnects on logout)
  useAdminSocket();

  // Build the full group list: core static + registry-driven + system static
  const registryGroups = getVisibleMenuGroups(user);
  const allGroups      = [...CORE_GROUPS, ...registryGroups, SYSTEM_GROUP];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (mobile = false) => (
    <aside
      className={`${
        mobile ? 'w-64' : collapsed ? 'w-16' : 'w-60'
      } bg-gray-900 border-r border-gray-800 flex flex-col ${mobile ? '' : 'flex-shrink-0 transition-all duration-200'}`}
    >
      {/* Logo / collapse toggle */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-800 flex-shrink-0">
        {(!collapsed || mobile) && (
          <span className="font-black text-blue-400 tracking-tight text-base truncate">{appName}</span>
        )}
        {mobile
          ? (
            <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white ml-auto">
              <X size={18} />
            </button>
          )
          : (
            <button
              onClick={() => setCollapsed(v => !v)}
              className="text-gray-400 hover:text-white ml-auto flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <ChevronLeft size={17} className={collapsed ? 'rotate-180' : ''} />
            </button>
          )
        }
      </div>

      {/* Navigation — driven by registry */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {allGroups.map((group, i) => (
          <NavGroup
            key={group.key}
            group={group}
            collapsed={!mobile && collapsed}
            defaultOpen={i === 0}
          />
        ))}
      </nav>

      {/* Footer: user + logout */}
      <div className="border-t border-gray-800 flex-shrink-0">
        {(!collapsed || mobile) && user && (
          <div className="px-4 py-2 text-xs text-gray-500 truncate">{user.email || user.username}</div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed && !mobile ? 'Đăng xuất' : undefined}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} className="flex-shrink-0" />
          {(!collapsed || mobile) && 'Đăng xuất'}
        </button>
      </div>
    </aside>
  );

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-gray-950 text-white">

        {/* ── Desktop sidebar ──────────────────────────────────────────── */}
        <div className="hidden md:flex">
          {sidebarContent(false)}
        </div>

        {/* ── Mobile sidebar overlay ────────────────────────────────────── */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative z-50 flex">
              {sidebarContent(true)}
            </div>
          </div>
        )}

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto min-w-0 flex flex-col">
          {/* Header */}
          <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-5 sticky top-0 z-30 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                className="md:hidden text-gray-400 hover:text-white"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <AlignLeft size={20} />
              </button>
              <span className="font-semibold text-gray-200 text-sm hidden sm:block">{appName}</span>
            </div>
            {user && (
              <span className="text-xs text-gray-400">{user.email || user.username}</span>
            )}
          </header>

          {/* Page content */}
          <main className="flex-1 p-5">
            <Breadcrumb />
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
