import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  TrendingUp, LineChart, BarChart2, Wallet, UserCheck,
  ArrowUpRight, Users, Landmark, Cpu, Gift, MoreHorizontal, X,
} from 'lucide-react';

// Primary 5 — always visible in the bottom bar
const PRIMARY = [
  { to: '/',          icon: TrendingUp, label: 'Thị trường', end: true  },
  { to: '/terminal',  icon: LineChart,  label: 'Giao dịch',  end: false },
  { to: '/portfolio', icon: BarChart2,  label: 'Danh mục',   end: false },
  { to: '/wallet',    icon: Wallet,     label: 'Ví',         end: false },
  { to: '/profile',   icon: UserCheck,  label: 'Tôi',        end: false },
];

// Secondary — shown in the "More" slide-up drawer
const MORE = [
  { to: '/deposit',    icon: ArrowUpRight, label: 'Nạp tiền'   },
  { to: '/investment', icon: BarChart2,    label: 'Đầu tư'     },
  { to: '/yuebao',     icon: Landmark,     label: 'Tiết kiệm'  },
  { to: '/mining',     icon: Cpu,          label: 'Máy đào'    },
  { to: '/prize',      icon: Gift,         label: 'Quay thưởng' },
  { to: '/referral',   icon: Users,        label: 'Mời bạn'    },
];

export default function MobileBottomNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* More drawer — slides up above the nav bar */}
      <div
        className="fixed bottom-[57px] left-0 right-0 z-50 transition-transform duration-200"
        style={{
          background: 'var(--bn-bg-surface)',
          borderTop: '1px solid var(--bn-border)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--bn-text-muted)' }}>
            Thêm
          </span>
          <button onClick={() => setOpen(false)} style={{ color: 'var(--bn-text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 px-3 pb-4">
          {MORE.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 rounded-xl text-[11px] font-medium transition-colors ${
                  isActive ? 'font-semibold' : ''
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--bn-yellow-muted)' : 'var(--bn-bg-elevated)',
                color:      isActive ? 'var(--bn-yellow)'       : 'var(--bn-text-secondary)',
              })}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <nav
        className="flex justify-around items-center py-2 safe-area-bottom"
        style={{ background: 'var(--bn-bg-base)', borderTop: '1px solid var(--bn-border)' }}
      >
        {PRIMARY.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] w-16 transition-all duration-150 ${isActive ? 'font-semibold' : ''}`
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--bn-yellow)' : 'var(--bn-text-secondary)',
            })}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* More button */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex flex-col items-center gap-0.5 text-[10px] w-16 transition-all duration-150"
          style={{ color: open ? 'var(--bn-yellow)' : 'var(--bn-text-secondary)' }}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>Thêm</span>
        </button>
      </nav>
    </>
  );
}
