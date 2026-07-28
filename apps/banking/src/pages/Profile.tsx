import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function Profile() {
  const nav = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất');
    nav('/login', { replace: true });
  };

  const kycColor = user?.kycStatus === 'verified' ? 'var(--bank-success)' : user?.kycStatus === 'rejected' ? 'var(--bank-danger)' : 'var(--bank-warning)';
  const kycLabel = { verified: 'Đã xác minh', pending: 'Chờ xác minh', rejected: 'Bị từ chối' }[user?.kycStatus ?? 'pending'] ?? 'Chưa KYC';

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => nav(-1)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'var(--bank-surface)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold">Hồ sơ</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white" style={{ background: 'var(--bank-primary)' }}>
          {user?.fullName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <p className="mt-3 font-bold text-lg">{user?.fullName ?? 'LKVIP Member'}</p>
        <p className="text-sm" style={{ color: 'var(--bank-muted)' }}>{user?.email}</p>
        <div className="mt-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#e0f2fe', color: 'var(--bank-primary)' }}>
          VIP {user?.memberLevel ?? 1}
        </div>
      </div>

      {/* KYC status */}
      <div className="rounded-xl p-4 mb-3 flex items-center gap-3" style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)' }}>
        <AlertCircle size={18} color={kycColor} />
        <div>
          <p className="text-sm font-semibold">Xác minh danh tính (KYC)</p>
          <p className="text-xs" style={{ color: kycColor }}>{kycLabel}</p>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid var(--bank-border)', background: 'var(--bank-surface)' }}>
        {[
          { label: 'Email', value: user?.email ?? '—' },
          { label: 'Cấp độ', value: `VIP ${user?.memberLevel ?? 1}` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--bank-border)' }}>
            <span className="text-sm" style={{ color: 'var(--bank-muted)' }}>{label}</span>
            <span className="text-sm font-medium">{value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl font-semibold text-sm"
        style={{ background: '#fee2e2', color: 'var(--bank-danger)', border: '1px solid #fecaca' }}
      >
        Đăng xuất
      </button>
    </div>
  );
}
