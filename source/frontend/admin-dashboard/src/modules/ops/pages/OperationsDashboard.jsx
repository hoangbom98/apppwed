// frontend/admin-dashboard/src/modules/ops/pages/OperationsDashboard.jsx
// Auto-Ops Platform — Main overview dashboard
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi } from '../api';
import {
  Users, CheckSquare, TrendingUp, AlertTriangle, RefreshCw, Play, Loader2,
} from 'lucide-react';

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'blue', sub }) {
  const colors = {
    blue:   'text-blue-400 bg-blue-500/10',
    green:  'text-green-400 bg-green-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    red:    'text-red-400 bg-red-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${colors[color]}`}>
        <Icon size={18} className={colors[color].split(' ')[0]} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-white mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Segment donut (SVG) ───────────────────────────────────────────────────
const SEG_COLORS = {
  champion: '#f59e0b',
  gold:     '#eab308',
  silver:   '#94a3b8',
  at_risk:  '#ef4444',
  bronze:   '#92400e',
};

function SegmentDonut({ distribution }) {
  const entries = Object.entries(distribution || {});
  const total   = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return <p className="text-xs text-gray-500 text-center py-4">Chưa có dữ liệu</p>;

  let offset = 0;
  const R = 42, CX = 56, CY = 56;
  const slices = entries.map(([seg, count]) => {
    const pct = count / total;
    const angle = pct * 2 * Math.PI;
    const x1 = CX + R * Math.sin(offset);
    const y1 = CY - R * Math.cos(offset);
    offset += angle;
    const x2 = CX + R * Math.sin(offset);
    const y2 = CY - R * Math.cos(offset);
    const large = pct > 0.5 ? 1 : 0;
    return { seg, count, pct, d: `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} Z` };
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 112 112" className="w-28 h-28 flex-shrink-0">
        {slices.map(s => (
          <path key={s.seg} d={s.d} fill={SEG_COLORS[s.seg] || '#6b7280'} opacity="0.9" />
        ))}
        <circle cx={CX} cy={CY} r="22" fill="#111827" />
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize="11" fill="#e5e7eb" fontWeight="600">
          {total.toLocaleString()}
        </text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {entries.map(([seg, count]) => (
          <div key={seg} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: SEG_COLORS[seg] || '#6b7280' }} />
            <span className="capitalize text-gray-300 flex-1 truncate">{seg}</span>
            <span className="text-gray-400 font-mono">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Action button ─────────────────────────────────────────────────────────
function ActionBtn({ label, icon: Icon, mutation, color = 'blue' }) {
  const colors = { blue: 'bg-blue-600 hover:bg-blue-700', green: 'bg-green-600 hover:bg-green-700', purple: 'bg-purple-600 hover:bg-purple-700' };
  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={`flex items-center gap-2 ${colors[color]} text-white text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-60 transition-colors`}
    >
      {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
      {label}
    </button>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────
export default function OperationsDashboard() {
  const qc = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['opsStats'],
    queryFn:  () => opsApi.getStats().then(r => r.data?.data),
  });

  const { data: segDist } = useQuery({
    queryKey: ['opsSegDist'],
    queryFn:  () => opsApi.getSegmentDistribution().then(r => r.data?.data ?? {}),
  });

  const { data: topCLV = [] } = useQuery({
    queryKey: ['opsTopCLV'],
    queryFn:  () => opsApi.getTopCLV(8).then(r => r.data?.data ?? []),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['opsDailyReports'],
    queryFn:  () => opsApi.getDailyReports(7).then(r => r.data?.data ?? []),
  });

  const runReport    = useMutation({ mutationFn: opsApi.triggerDailyReport,   onSuccess: () => qc.invalidateQueries({ queryKey: ['opsDailyReports'] }) });
  const runCampaigns = useMutation({ mutationFn: opsApi.runCampaigns });
  const runMarketing = useMutation({ mutationFn: opsApi.runMarketing });
  const runChurn     = useMutation({ mutationFn: opsApi.triggerChurnScan });
  const runRebalance = useMutation({ mutationFn: opsApi.rebalanceTasks,       onSuccess: () => qc.invalidateQueries({ queryKey: ['opsStats'] }) });

  const fmt = n => Number(n || 0).toLocaleString('vi-VN');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">🏢 Vận hành tự động</h1>
        {isLoading && <Loader2 size={18} className="text-gray-400 animate-spin" />}
      </div>

      {/* ── KPI cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="Task đang chờ"    value={stats?.tasks?.pending}       color="yellow" />
        <StatCard icon={CheckSquare} label="Đang xử lý"       value={stats?.tasks?.inProgress}    color="blue"   />
        <StatCard icon={CheckSquare} label="Hoàn thành hôm nay" value={stats?.tasks?.completedToday} color="green" />
        <StatCard icon={AlertTriangle} label="Churn rủi ro cao" value={stats?.churn?.high}       color="red"    sub={`medium: ${stats?.churn?.medium ?? 0}`} />
      </div>

      {/* ── Mid row: segments + CLV ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Segment distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-sm text-gray-300 mb-4">📊 Phân khúc khách hàng (RFM)</h3>
          <SegmentDonut distribution={segDist} />
        </div>

        {/* Top CLV */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-sm text-gray-300 mb-4">💎 Top CLV</h3>
          {topCLV.length ? (
            <div className="space-y-2">
              {topCLV.map((u, i) => (
                <div key={u.userId} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500 w-5 text-right text-xs">{i + 1}</span>
                  <span className="text-gray-400 flex-1 truncate">User #{u.userId}</span>
                  <span className="text-green-400 font-mono text-xs">{fmt(u.clv)}đ</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    u.segment === 'champion' ? 'bg-yellow-500/20 text-yellow-400' :
                    u.segment === 'gold'     ? 'bg-yellow-600/20 text-yellow-500' :
                    'bg-gray-700 text-gray-400'
                  }`}>{u.segment}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-gray-500 text-center py-4">Chưa có dữ liệu CLV</p>}
        </div>
      </div>

      {/* ── Daily reports sparkline ─────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-gray-300">📈 Báo cáo 7 ngày gần nhất</h3>
          <ActionBtn label="Tạo báo cáo" icon={RefreshCw} mutation={runReport} />
        </div>
        {reports.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 pr-4">Ngày</th>
                  <th className="text-right py-2 pr-4">User mới</th>
                  <th className="text-right py-2 pr-4">Nạp (đ)</th>
                  <th className="text-right py-2 pr-4">Rút (đ)</th>
                  <th className="text-right py-2 pr-4">Net (đ)</th>
                  <th className="text-right py-2 pr-4">Task xong</th>
                  <th className="text-right py-2">Campaign</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.date} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 pr-4 text-gray-300">{r.date}</td>
                    <td className="text-right py-2 pr-4 text-gray-400">{fmt(r.summary?.newUsers)}</td>
                    <td className="text-right py-2 pr-4 text-green-400">{fmt(r.financial?.depositAmount)}</td>
                    <td className="text-right py-2 pr-4 text-red-400">{fmt(r.financial?.withdrawAmount)}</td>
                    <td className={`text-right py-2 pr-4 font-mono ${Number(r.financial?.netRevenue) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {fmt(r.financial?.netRevenue)}
                    </td>
                    <td className="text-right py-2 pr-4 text-gray-400">{fmt(r.operations?.tasksCompleted)}</td>
                    <td className="text-right py-2 text-purple-400">{fmt(r.operations?.campaignsSent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-6">Chưa có báo cáo. Nhấn "Tạo báo cáo" để tạo ngay.</p>
        )}
      </div>

      {/* ── Quick actions ───────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="font-semibold text-sm text-gray-300 mb-4">⚡ Hành động nhanh</h3>
        <div className="flex flex-wrap gap-3">
          <ActionBtn label="Chạy Campaign"        icon={Play}       mutation={runCampaigns} color="purple" />
          <ActionBtn label="Marketing tự động"     icon={TrendingUp} mutation={runMarketing} color="green"  />
          <ActionBtn label="Quét Churn"            icon={AlertTriangle} mutation={runChurn} color="blue"   />
          <ActionBtn label="Cân bằng Task"         icon={RefreshCw}  mutation={runRebalance} />
        </div>
      </div>
    </div>
  );
}
