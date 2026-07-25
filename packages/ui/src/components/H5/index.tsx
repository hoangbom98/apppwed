// @ts-nocheck
// packages/shared-ui/src/components/H5/index.tsx
// H5 (mobile-first) shared UI components
import React, { useState, useEffect } from 'react';
import { Badge } from 'antd';

// ── H5Header ─────────────────────────────────────────────────────────────────
interface H5HeaderProps {
  title?: string;
  logo?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}
export const H5Header: React.FC<H5HeaderProps> = ({ title, logo, onBack, rightSlot }) => (
  <header style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', height: 48, background: '#1a1a2e', position: 'sticky', top: 0, zIndex: 100,
  }}>
    {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20 }}>←</button>}
    {logo ? <img src={logo} alt="logo" height={32} /> : <span style={{ color: '#fff', fontWeight: 700 }}>{title}</span>}
    {rightSlot ?? <span />}
  </header>
);

// ── H5BottomNav ──────────────────────────────────────────────────────────────
interface NavItem { label: string; icon: React.ReactNode; path: string; badge?: number; }
interface H5BottomNavProps {
  items: NavItem[];
  active?: string;
  onNavigate?: (path: string) => void;
}
export const H5BottomNav: React.FC<H5BottomNavProps> = ({ items, active, onNavigate }) => (
  <nav style={{
    position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
    background: '#1a1a2e', display: 'flex', borderTop: '1px solid #2d2d4e', zIndex: 100,
  }}>
    {items.map((item) => (
      <button
        key={item.path}
        onClick={() => onNavigate?.(item.path)}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', background: 'none', border: 'none',
          color: active === item.path ? '#0d9488' : '#8892b0', cursor: 'pointer', gap: 2,
        }}
      >
        <Badge count={item.badge} size="small">
          {item.icon}
        </Badge>
        <span style={{ fontSize: 10 }}>{item.label}</span>
      </button>
    ))}
  </nav>
);

// ── H5Layout ─────────────────────────────────────────────────────────────────
interface H5LayoutProps {
  header?:          React.ReactNode;
  footer?:          React.ReactNode;
  children:         React.ReactNode;
  className?:       string;
  mainClassName?:   string;
  // Shorthand props used by dating/game layouts
  bottomNavItems?:  any[];
  headerProps?:     Record<string, any>;
}
export const H5Layout: React.FC<H5LayoutProps> = ({
  header, footer, children, className, mainClassName,
  bottomNavItems: _bnav, headerProps: _hp,  // consumed by sub-layout, not used here
}) => (
  <div className={className} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    {header}
    <main className={mainClassName} style={{ flex: 1, paddingBottom: footer ? 60 : 0 }}>
      {children}
    </main>
    {footer}
  </div>
);

// ── useUnreadCount ────────────────────────────────────────────────────────────
export function useUnreadCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0); // Placeholder — each app connects to its own notification source
  }, []);
  return count;
}
