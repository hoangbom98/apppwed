import { NavLink, Link } from 'react-router-dom';
import {
  TrendingUp, ScrollText, Wallet, UserCheck, BarChart2,
  LineChart, ShieldCheck, Settings, LogIn, Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppConfig } from '@ui/hooks/useAppConfig';

const MENU_ITEMS = [
  { to: '/',           icon: TrendingUp,  label: 'Thị trường',   end: true  },
  { to: '/terminal',   icon: LineChart,   label: 'Giao dịch',    end: false },
  { to: '/portfolio',  icon: BarChart2,   label: 'Danh mục',     end: false },
  { to: '/orders',     icon: ScrollText,  label: 'Lịch sử lệnh', end: false },
  { to: '/wallet',     icon: Wallet,      label: 'Ví',           end: false },
];

const BOTTOM_ITEMS = [
  { to: '/kyc',        icon: ShieldCheck, label: 'Xác minh KYC', end: false },
  { to: '/profile',    icon: UserCheck,   label: 'Tài khoản',    end: false },
  { to: '/settings',   icon: Settings,    label: 'Cài đặt',      end: false },
];

export default function DesktopSidebar() {
  const { user, token } = useAuthStore();
  const { data: brand } = useAppConfig('brand');
  const siteName = brand?.site_name ?? 'TradePro';
  const logoUrl  = brand?.logo_url  ?? '';

  const activeClass  = 'bg-[var(--bn-yellow-muted)] text-[var(--bn-yellow)] border-l-2 border-[var(--bn-yellow)] -ml-px';
  const defaultClass = 'text-[var(--bn-text-secondary)] hover:bg-[var(--bn-bg-hover)] hover:text-[var(--bn-text-primary)]';

  return (
    <div className="flex flex-col h-full py-4" style={{ background: 'var(--bn-bg-surface)', borderRight: '1px solid var(--bn-border)' }}>
      {/* Brand */}
      <div className="px-5 mb-6 flex items-center gap-2.5">
        {logoUrl
          ? <img src={logoUrl} alt={siteName} className="w-8 h-8 object-contain rounded-lg"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          : <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bn-yellow)', color: '#0b0e11' }}>
              <Zap size={16} className="font-black" />
            </div>
        }
        <span className="font-extrabold text-lg tracking-tight" style={{ color: 'var(--bn-yellow)' }}>{siteName}</span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--bn-text-muted)' }}>
          Giao dịch
        </p>
        {MENU_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? activeClass : defaultClass}`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}

        <p className="px-3 mt-4 mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--bn-text-muted)' }}>
          Tài khoản
        </p>
        {BOTTOM_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? activeClass : defaultClass}`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User block */}
      <div className="px-3 mt-4">
        {token && user ? (
          <div className="p-3.5 rounded-xl" style={{ background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[#0b0e11] text-xs flex-shrink-0"
                style={{ background: 'var(--bn-yellow)' }}>
                {((user as any).fullName || (user as any).email || 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--bn-text-primary)' }}>
                  {(user as any).fullName || (user as any).email}
                </p>
                <p className="text-[10px]" style={{ color: (user as any).kycStatus === 'verified' ? 'var(--bn-green)' : 'var(--bn-text-muted)' }}>
                  {(user as any).kycStatus === 'verified' ? '✓ KYC' : '⚠ Chưa KYC'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Link to="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={{ background: 'var(--bn-yellow)', color: '#0b0e11' }}
          >
            <LogIn size={14} /> Đăng nhập
          </Link>
        )}
      </div>
    </div>
  );
}
