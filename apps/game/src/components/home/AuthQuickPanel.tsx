import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, Crown, Gift, Plus } from 'lucide-react';

interface AuthQuickPanelProps {
  isLoggedIn: boolean;
  user?: { name?: string; username?: string; avatar?: string; balance?: number };
  onLogin?: () => void;
  onRegister?: () => void;
}

const AuthQuickPanel: React.FC<AuthQuickPanelProps> = ({
  isLoggedIn,
  user,
  onLogin,
  onRegister,
}) => {
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return (
      <div className="game-auth-quick">
        <div className="login-buttons">
          <button className="btn-login" onClick={onLogin}>Đăng nhập</button>
          <button className="btn-register" onClick={onRegister}>Đăng ký</button>
        </div>
      </div>
    );
  }

  const quickActions = [
    { icon: Headphones, label: 'CSKH',     key: 'support' },
    { icon: Crown,      label: 'VIP',      key: 'vip' },
    { icon: Gift,       label: 'Giới thiệu', key: 'agent' },
    { icon: Plus,       label: 'Thêm',     key: 'promotions' },
  ];

  return (
    <div className="game-auth-quick">
      <div className="user-info">
        <div className="avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-full h-full rounded-full" />
          ) : (
            (user?.name || user?.username)?.charAt(0)?.toUpperCase() || 'U'
          )}
        </div>
        <div>
          <div className="balance">
            {(Number(user?.balance) || 0).toLocaleString('vi-VN')} <small>đ</small>
          </div>
        </div>
      </div>
      <div className="quick-actions">
        {quickActions.map((action) => (
          <button key={action.key} onClick={() => navigate(`/${action.key}`)}>
            <action.icon size={24} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AuthQuickPanel;
