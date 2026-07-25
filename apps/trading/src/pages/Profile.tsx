import { useQuery } from '@tanstack/react-query';
import { getMe, getOrders } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { Shield, ShieldCheck, ShieldAlert, Phone, Mail, LogOut, Settings, Bell, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

// kycStatus values from backend User model: "pending" | "approved" | "rejected"
// "pending" without a Kyc record = not yet submitted
const KYC_CONFIG = {
  none:     { label: 'Chưa nộp',       icon: Shield,      color: 'text-gray-400 bg-gray-800/50 border-gray-700/50' },
  pending:  { label: 'Chờ duyệt',      icon: Shield,      color: 'text-yellow-400 bg-yellow-950/50 border-yellow-900/50' },
  approved: { label: 'Đã xác minh',    icon: ShieldCheck, color: 'text-green-400 bg-green-950/50 border-green-900/50' },
  rejected: { label: 'Bị từ chối',     icon: ShieldAlert, color: 'text-red-400 bg-red-950/50 border-red-900/50' },
} as const;

export default function ProfilePage() {
  const { user, logout } = useAuthStore();

  // authController.me returns: { success: true, data: { id, email, fullName, ..., kycStatus } }
  const { data: meData }     = useQuery({ queryKey: ['me'],  queryFn: getMe, enabled: !!user });
  const { data: ordersAll }  = useQuery({ queryKey: ['orders-stats'],  queryFn: () => getOrders({}),                    enabled: !!user });
  const { data: ordersFill } = useQuery({ queryKey: ['orders-filled'], queryFn: () => getOrders({ status: 'filled' }),  enabled: !!user });

  // Response shape: meData.data = user object (from success() helper)
  const profile   = meData?.data ?? user;
  const kycStatus = (((profile as { kycStatus?: string })?.kycStatus) ?? 'pending') as keyof typeof KYC_CONFIG;

  // orderController returns { success, data: [...], meta: { total } }
  const totalOrders  = ordersAll?.meta?.total  ?? ordersAll?.data?.length  ?? '—';
  const filledOrders = ordersFill?.meta?.total ?? ordersFill?.data?.length ?? '—';
  const winRate = (typeof totalOrders === 'number' && typeof filledOrders === 'number' && totalOrders > 0)
    ? ((filledOrders / totalOrders) * 100).toFixed(1) + '%'
    : '—';
  const KycCfg    = KYC_CONFIG[kycStatus] ?? KYC_CONFIG.none;
  const KycIcon   = KycCfg.icon;

  const MENU_ITEMS = [
    { icon: Bell,     label: 'Cài đặt thông báo',  to: '#' },
    { icon: KeyRound, label: 'Đổi mật khẩu',        to: '#' },
    { icon: Settings, label: 'Cài đặt bảo mật',     to: '#' },
  ];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Chưa đăng nhập</h2>
        <p className="text-gray-400 text-sm mb-6">Đăng nhập để xem thông tin tài khoản</p>
        <Link to="/login" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Profile card */}
      <div className="bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 border border-blue-500/20 rounded-2xl p-6">
        {(() => {
          const p = profile as { fullName?: string; email?: string; phone?: string } | null;
          return (
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
            {(p?.fullName || p?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-white">{p?.fullName || 'Người dùng'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Mail size={12} className="text-gray-500" />
              <p className="text-sm text-gray-400">{p?.email}</p>
            </div>
            {p?.phone && (
              <div className="flex items-center gap-2 mt-0.5">
                <Phone size={12} className="text-gray-500" />
                <p className="text-sm text-gray-400">{p.phone}</p>
              </div>
            )}
          </div>
        </div>
          );
        })()}

        {/* KYC status */}
        <div className={`mt-5 flex items-center gap-3 px-4 py-3 rounded-xl border ${KycCfg.color}`}>
          <KycIcon size={16} />
          <div className="flex-1">
            <p className="text-sm font-semibold">Xác minh danh tính: {KycCfg.label}</p>
            {kycStatus === 'none' && (
              <p className="text-[11px] opacity-75 mt-0.5">Xác minh để nâng hạn mức giao dịch</p>
            )}
          </div>
          {kycStatus === 'none' && (
            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors">
              Xác minh ngay
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng lệnh',   value: totalOrders  },
          { label: 'Lệnh khớp',   value: filledOrders },
          { label: 'Tỉ lệ thắng', value: winRate      },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="font-bold text-white text-lg">{s.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800/50">
        {MENU_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.to}
              className="flex items-center gap-3 px-5 py-4 hover:bg-gray-800/50 transition-colors">
              <div className="p-2 bg-gray-800 rounded-xl">
                <Icon size={16} className="text-gray-400" />
              </div>
              <span className="text-sm text-white font-medium flex-1">{item.label}</span>
              <span className="text-gray-600 text-xs">›</span>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-950/50 hover:bg-red-900/50 border border-red-900/50 text-red-400 hover:text-red-300 rounded-2xl font-semibold text-sm transition-colors"
      >
        <LogOut size={16} />Đăng xuất
      </button>
    </div>
  );
}
