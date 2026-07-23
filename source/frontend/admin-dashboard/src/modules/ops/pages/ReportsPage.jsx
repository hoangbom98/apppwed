// frontend/admin-dashboard/src/modules/ops/pages/ReportsPage.jsx
// View historical daily reports + trigger new ones + cash flow forecast
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi } from '../api';
import { RefreshCw, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

const fmt  = n => Number(n || 0).toLocaleString('vi-VN');
const fmtM = n => `${fmt(n)}đ`;

// ── Mini forecast bar chart (SVG) ─────────────────────────────────────────
function ForecastChart({ data }) {
  if (!data?.length) return null;
  const W = 560, H = 100, PAD = 12;
  const max   = Math.max(...data.map(d => d.predicted), 1);
  const step  = (W - PAD * 2) / (data.length - 1 || 1);
  const barW  = Math.max(3, step * 0.6);
  const toY   = v => H - PAD - ((v / max) * (H - PAD * 2));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
      {[0, 0.5, 1].map(f => {
        const y = H - PAD - f * (H - PAD * 2);
        return <line key={f} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#1f2937" strokeWidth="1" />;
      })}
      {data.map((d, i) => {
        const x  = PAD + i * step;
        const y  = toY(d.predicted);
        const bh = H - PAD - y;
        return (
          <g key={i}>
            <rect x={x - barW / 2} y={y} width={barW} height={bh} rx={2} fill="#3b82f6" opacity="0.7" />
            {i % 5 === 0 && (
              <text x={x} y={H} fontSize="8" fill="#4b5563" textAnchor="middle">
                {d.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function ReportsPage() {
  const qc = useQueryClient();

  const { data: reports = [], isLoading: reportLoading } = useQuery({
    queryKey: ['opsDailyReports7'],
    queryFn:  () => opsApi.getDailyReports(14).then(r => r.data?.data ?? []),
  });

  const { data: forecast = [] } = useQuery({
    queryKey: ['opsCashForecast'],
    queryFn:  () => opsApi.getCashFlowForecast(30).then(r => r.data?.data ?? []),
  });

  const { data: reserve } = useQuery({
    queryKey: ['opsCashReserve'],
    queryFn:  () => opsApi.getCashReserve().then(r => r.data?.data),
  });

  const genReport = useMutation({
    mutationFn: opsApi.triggerDailyReport,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['opsDailyReports7'] }),
  });

  const reserveDays = Number(reserve?.reserveDays || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">📈 Báo cáo & Dự báo</h1>
        <button onClick={() => genReport.mutate()} disabled={genReport.isPending}
          className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg disabled:opacity-60">
          {genReport.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Tạo báo cáo hôm nay
        </button>
      </div>

      {/* ── Cash reserve status ─────────────────────────────────── */}
      {reserve && (
        <div className={`rounded-xl p-4 border ${reserveDays < 7 ? 'bg-red-900/20 border-red-500/30' : 'bg-gray-900 border-gray-800'}`}>
          <div className="flex items-center gap-3">
            {reserveDays < 7 ? <TrendingDown size={20} className="text-red-400" /> : <TrendingUp size={20} className="text-green-400" />}
            <div>
              <p className="text-sm font-semibold text-white">Quỹ dự trữ: {fmtM(reserve.totalBalance)}</p>
              <p className="text-xs text-gray-400">
                Chi phí/ngày: {fmtM(reserve.dailyCost)} · Còn lại: <span className={reserveDays < 7 ? 'text-red-400 font-bold' : 'text-green-400'}>{reserveDays} ngày</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 30-day forecast ─────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="font-semibold text-sm text-gray-300 mb-4">📉 Dự báo nạp tiền 30 ngày</h3>
        <ForecastChart data={forecast} />
        <p className="text-xs text-gray-500 mt-2">Dự báo dựa trên trung bình 90 ngày + xu hướng tăng trưởng</p>
      </div>

      {/* ── Daily report table ──────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-sm text-gray-300">📋 Báo cáo ngày gần nhất</h3>
        </div>
        {reportLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-gray-400" /></div>
        ) : reports.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">Chưa có báo cáo</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="text-left px-4 py-3">Ngày</th>
                  <th className="text-right px-4 py-3">User tổng</th>
                  <th className="text-right px-4 py-3">User mới</th>
                  <th className="text-right px-4 py-3">Nạp (đ)</th>
                  <th className="text-right px-4 py-3">GD nạp</th>
                  <th className="text-right px-4 py-3">Rút (đ)</th>
                  <th className="text-right px-4 py-3">GD rút</th>
                  <th className="text-right px-4 py-3">Net (đ)</th>
                  <th className="text-right px-4 py-3">Ticket/Xong</th>
                  <th className="text-right px-4 py-3">Task xong</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.date} className="border-t border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-mono text-gray-300">{r.date}</td>
                    <td className="text-right px-4 py-3 text-gray-400">{fmt(r.summary?.totalUsers)}</td>
                    <td className="text-right px-4 py-3 text-blue-400">{fmt(r.summary?.newUsers)}</td>
                    <td className="text-right px-4 py-3 text-green-400">{fmtM(r.financial?.depositAmount)}</td>
                    <td className="text-right px-4 py-3 text-gray-500">{fmt(r.financial?.depositCount)}</td>
                    <td className="text-right px-4 py-3 text-red-400">{fmtM(r.financial?.withdrawAmount)}</td>
                    <td className="text-right px-4 py-3 text-gray-500">{fmt(r.financial?.withdrawCount)}</td>
                    <td className={`text-right px-4 py-3 font-mono ${Number(r.financial?.netRevenue) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {fmtM(r.financial?.netRevenue)}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-400">
                      {fmt(r.operations?.ticketsCreated)} / {fmt(r.operations?.ticketsResolved)}
                    </td>
                    <td className="text-right px-4 py-3 text-purple-400">{fmt(r.operations?.tasksCompleted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
