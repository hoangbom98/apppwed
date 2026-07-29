import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, ChevronRight, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

function MenuItem({ icon: Icon, label, sub, onClick }: { icon: React.ElementType; label: string; sub?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 transition-all active:opacity-70"
      style={{ borderBottom: '1px solid var(--cr-border)' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--cr-surface-2)' }}>
        <Icon size={18} color="var(--cr-primary)" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold" style={{ color: 'var(--cr-text)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--cr-muted)' }}>{sub}</p>}
      </div>
      <ChevronRight size={16} color="var(--cr-muted)" />
    </button>
  );
}

export default function Profile() {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/login', { replace: true });
  };

  return (
    <div>
      {/* Hero */}
      <div className="px-4 py-8 text-center" style={{ background: 'var(--cr-card-bg)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}>
          <User size={32} color="#fff" />
        </div>
        <p className="font-black text-white text-xl">{user?.fullName ?? user?.email?.split('@')[0] ?? 'Trader'}</p>
        <p className="text-white/60 text-sm mt-0.5">{user?.email}</p>
        <div className="flex justify-center gap-2 mt-3">
          <span className="text-xs px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            Level {user?.memberLevel ?? 1}
          </span>
          <span className="text-xs px-3 py-1 rounded-full font-semibold"
            style={{
              background: user?.kycStatus === 'verified' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
              color: user?.kycStatus === 'verified' ? '#6ee7b7' : '#fcd34d',
            }}>
            KYC: {user?.kycStatus === 'verified' ? 'Đã xác minh' : 'Chưa xác minh'}
          </span>
        </div>
      </div>

      {/* Menu */}
      <div className="mx-4 mt-4 rounded-xl overflow-hidden" style={{ background: 'var(--cr-surface)', border: '1px solid var(--cr-border)' }}>
        <MenuItem icon={User}      label="Thông tin tài khoản"  sub={user?.email} />
        <MenuItem icon={Shield}    label="Bảo mật"              sub="Đổi mật khẩu, 2FA" />
        <MenuItem
          icon={TrendingUp}
          label="Sang LKVIP Trade"
          sub="Giao dịch nâng cao"
          onClick={() => window.open('https://trade.tc-gaming.live', '_blank')}
        />
      </div>

      {/* App info */}
      <div className="mx-4 mt-3 rounded-xl p-4" style={{ background: 'var(--cr-surface)', border: '1px solid var(--cr-border)' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--cr-muted)' }}>Thông tin ứng dụng</p>
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--cr-muted)' }}>Phiên bản</span>
          <span style={{ color: 'var(--cr-text)' }}>1.0.0</span>
        </div>
        <div className="flex justify-between text-xs mt-1.5">
          <span style={{ color: 'var(--cr-muted)' }}>Dữ liệu thị trường</span>
          <span style={{ color: 'var(--cr-primary)' }}>Binance Feed</span>
        </div>
        <div className="flex justify-between text-xs mt-1.5">
          <span style={{ color: 'var(--cr-muted)' }}>Cập nhật giá</span>
          <span style={{ color: 'var(--cr-text)' }}>30 giây/lần</span>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-4 mb-6">
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--cr-red)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
