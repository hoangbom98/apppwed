import React from 'react';
import { NavLink } from 'react-router-dom';
import { TrendingUp, LineChart, Wallet, UserCheck, TrendingDown } from 'lucide-react';

const ITEMS = [
  { to: '/',           icon: TrendingUp,   label: 'Thị trường', end: true  },
  { to: '/terminal',   icon: LineChart,    label: 'Giao dịch',  end: false },
  { to: '/investment', icon: TrendingDown, label: 'Đầu tư',     end: false },
  { to: '/wallet',     icon: Wallet,       label: 'Ví',         end: false },
  { to: '/profile',    icon: UserCheck,    label: 'Tôi',        end: false },
];

export default function MobileBottomNav() {
  return (
    <nav
      className="flex justify-around items-center py-2"
      style={{ background: 'var(--bn-bg-base)', borderTop: '1px solid var(--bn-border)' }}
    >
      {ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] w-16 transition-all duration-150 ${
              isActive ? 'font-semibold' : ''
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'var(--bn-yellow)' : 'var(--bn-text-secondary)',
          })}
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
