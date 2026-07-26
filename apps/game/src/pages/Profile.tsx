import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Settings, Shield, History, Gift,
  Wallet, CreditCard, Award,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import VipCard from '../components/profile/VipCard';
import MenuGrid from '../components/profile/MenuGrid';
import type { MenuItemDef } from '../components/profile/MenuGrid';

const MENU_ITEMS: MenuItemDef[] = [
  { icon: User,        label: 'Thông tin',      key: 'info' },
  { icon: Shield,      label: 'Xác thực',       key: 'security' },
  { icon: History,     label: 'Lịch sử',        key: 'history' },
  { icon: Gift,        label: 'Khuyến mãi',     key: 'promotions' },
  { icon: Wallet,      label: 'Ví của tôi',     key: 'wallet' },
  { icon: CreditCard,  label: 'Nạp tiền',       key: 'deposit' },
  { icon: Award,       label: 'VIP',            key: 'vip' },
  { icon: Settings,    label: 'Cài đặt',        key: 'settings' },
];

const PageProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleMenu = (key: string) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
      return;
    }
    // Route to existing views where possible
    const routeMap: Record<string, string> = {
      deposit:    '/deposit',
      vip:        '/vip',
      promotions: '/promotions',
      security:   '/security',
      wallet:     '/profile',
    };
    navigate(routeMap[key] ?? `/${key}`);
  };

  if (!user) {
    return (
      <div className="game-profile flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <User size={56} style={{ color: 'var(--game-text-secondary)' }} />
        <p className="mt-3 mb-5" style={{ color: 'var(--game-text-secondary)' }}>
          Chưa đăng nhập
        </p>
        <button
          className="game-auth-quick"
          style={{ display: 'inline-flex', gap: 12 }}
          onClick={() => navigate('/login')}
        >
          <span
            style={{
              background: 'var(--game-primary)',
              color: '#fff',
              padding: '8px 24px',
              borderRadius: 20,
              fontWeight: 600,
              fontSize: 14,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Đăng nhập
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="game-profile">
      <VipCard level={3} progress={65} target="77.562.000 đ" />

      {/* User summary */}
      <div className="user-summary">
        <div className="avatar">
          {user.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-full h-full rounded-full" />
          ) : (
            user.name?.charAt(0)?.toUpperCase() || 'U'
          )}
        </div>
        <div className="info">
          <div className="name">{user.name}</div>
          <div className="balance">{user.balance.toLocaleString('vi-VN')} đ</div>
        </div>
        <div className="actions">
          <button className="btn-withdraw" onClick={() => navigate('/withdraw')}>Rút</button>
          <button className="btn-deposit"  onClick={() => navigate('/deposit')}>Nạp</button>
          <button className="btn-interest" onClick={() => navigate('/yuebao')}>Lãi suất</button>
        </div>
      </div>

      <MenuGrid items={MENU_ITEMS} onItemClick={handleMenu} />

      {/* Logout */}
      <button
        onClick={() => { logout(); navigate('/login'); }}
        style={{
          width: '100%',
          marginTop: 16,
          padding: '12px 0',
          background: 'transparent',
          border: '1px solid #ff4d4f',
          color: '#ff4d4f',
          borderRadius: 'var(--game-radius)',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Đăng xuất
      </button>
    </div>
  );
};

export default PageProfile;
