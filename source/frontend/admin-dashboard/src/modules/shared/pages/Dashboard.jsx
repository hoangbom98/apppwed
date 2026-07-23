// frontend/admin-dashboard/src/modules/shared/pages/Dashboard.jsx
// GET /admin/dashboard → { users, finance, activity, recentTransactions, revenueChart }
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, CreditCard, TrendingUp, DollarSign, AlertCircle, Activity } from 'lucide-react';
import api from '@admin/api/client';
import { useSiteConfig } from '@admin/core/hooks/useSiteConfig';
import { SkeletonCard } from '@admin/modules/shared/components/Skeleton';

// ── SVG Revenue bar chart ─────────────────────────────────────────────────────
function RevenueChart({ points = [] }) {
  if (!points.length) return null;
  const W = 560, H = 120, PAD = 10;
  const max  = Math.max(...points.map(p => p.value), 1);
  const step = (W - PAD * 2) / (points.length - 1 || 1);

  const barW = Math.max(4, step * 0.55);
  const toY  = v => H - PAD - ((v / max) * (H - PAD * 2));

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <p className="text-xs text-gray-400 font-semibold mb-3">Doanh thu 7 ngày (₫)</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
        {/* Y-axis grid lines */}
        {[0, 0.5, 1].map(f => {
          const y = H - PAD - f * (H - PAD * 2);
          return (
            <line key={f} x1={PAD} y1={y} x2={W - PAD} y2={y}
              stroke="#374151" strokeWidth="1" strokeDasharray="4,4" />
          );
        })}
        {/* Bars */}
        {points.map((p, i) => {
          const x = PAD + i * step;
          const y = toY(p.value);
          const bh = H - PAD - y;
          return (
            <g key={i}>
              <rect
                x={x - barW / 2} y={y}
                width={barW} height={bh}
                rx={3} fill="#3b82f6" opacity="0.8"
              />
              <text x={x} y={H} fontSize="9" fill="#6b7280" textAnchor="middle">
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── By-project horizontal bar chart ──────────────────────────────────────────
function ProjectBars({ byProject }) {
  if (!byProject) return null;
  const entries = Object.entries(byProject);
  const maxVal  = Math.max(...entries.map(([, v]) => v), 1);
  const COLORS  = { game: '#3b82f6', dating: '#ec4899', sports: '#10b981', trade: '#f59e0b', hub: '#8b5cf6' };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <p className="text-xs text-gray-400 font-semibold mb-3">Users theo dự án</p>
      <div className="space-y-2.5">
        {entries.map(([proj, count]) => (
          <div key={proj} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-14 capitalize flex-shrink-0">{proj}</span>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${(count / maxVal) * 100}%`,
                  backgroundColor: COLORS[proj] ?? '#6b7280',
                }}
              />
            </div>
            <span className="text-xs text-gray-300 w-12 text-right flex-shrink-0">
              {Number(count).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { appName } = useSiteConfig();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data?.data || r.data),
    staleTime: 30_000,
  });

  const stats = [
    { label: 'Tổng users',       value: data?.users?.total ?? 0,              icon: Users,       color: 'bg-blue-600',   sub: data?.users?.newToday ? `+${data.users.newToday} hôm nay` : null },
    { label: 'Nạp tiền hôm nay', value: data?.finance?.todayDeposits ?? 0,    icon: DollarSign,  color: 'bg-green-600',  format: true },
    { label: 'Chờ duyệt nạp',    value: data?.finance?.pendingDeposits ?? 0,  icon: CreditCard,  color: 'bg-yellow-600' },
    { label: 'Chờ duyệt rút',    value: data?.finance?.pendingWithdrawals ?? 0,icon: TrendingUp, color: 'bg-orange-600' },
    { label: 'Cược đang hoạt động', value: data?.activity?.activeBets ?? 0,   icon: Activity,    color: 'bg-purple-600' },
    { label: 'Livestream đang chạy',value: data?.activity?.liveStreamers ?? 0,icon: AlertCircle, color: 'bg-pink-600' },
  ];

  // Build revenue points from API or use demo data when loading
  const revenuePoints = data?.revenueChart?.length
    ? data.revenueChart.map(d => ({ label: d.date?.slice(5) ?? d.day, value: Number(d.amount ?? d.value ?? 0) }))
    : [];

  return (
    <div>
      <h1 className="text-2xl font-black mb-6 text-white">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map(s => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className={`w-9 h-9 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-xl font-black text-white">
                {s.format ? Number(s.value).toLocaleString('vi') : Number(s.value).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-tight">{s.label}</p>
              {s.sub && <p className="text-xs text-green-400 mt-0.5">{s.sub}</p>}
            </div>
          ))
        }
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {revenuePoints.length > 0 && <RevenueChart points={revenuePoints} />}
        {data?.users?.byProject && <ProjectBars byProject={data.users.byProject} />}
      </div>

      {/* Recent transactions */}
      {data?.recentTransactions?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Giao dịch gần đây</h2>
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400">
                <tr>
                  {['User', 'Loại', 'Số tiền', 'Trạng thái', 'Thời gian'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map(tx => (
                  <tr key={tx.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                    <td className="px-4 py-2.5 text-gray-300">{tx.user?.username ?? tx.user?.email ?? tx.userId}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded ${tx.type === 'deposit' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                        {tx.type === 'deposit' ? 'Nạp' : 'Rút'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-white font-semibold">{Number(tx.amount).toLocaleString('vi')}₫</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        tx.status === 'completed' ? 'bg-green-900 text-green-400'
                        : tx.status === 'pending' ? 'bg-yellow-900 text-yellow-400'
                        : 'bg-gray-700 text-gray-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">
                      {new Date(tx.createdAt).toLocaleString('vi')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !data && (
        <p className="text-gray-400 text-sm mt-4">
          Chào mừng đến <strong className="text-blue-400">{appName}</strong>. Chọn mục từ sidebar để quản lý.
        </p>
      )}
    </div>
  );
}
