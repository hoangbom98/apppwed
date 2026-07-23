// frontend/admin-dashboard/src/modules/ops/pages/SegmentsPage.jsx
// Customer segmentation (RFM + CLV) — view + trigger analysis
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi } from '../api';
import { RefreshCw, Loader2, Search } from 'lucide-react';

const SEG_LABEL = {
  champion: { label: 'Champion 🏆', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  gold:     { label: 'Gold 🥇',     color: 'text-yellow-500 bg-yellow-600/10 border-yellow-600/30' },
  silver:   { label: 'Silver ⭐',   color: 'text-slate-300  bg-slate-400/10  border-slate-400/30'  },
  at_risk:  { label: 'At Risk ⚠️',  color: 'text-red-400    bg-red-500/10    border-red-500/30'    },
  bronze:   { label: 'Bronze 🥉',   color: 'text-orange-700 bg-orange-900/20 border-orange-800/30' },
};

const fmt  = n => Number(n || 0).toLocaleString('vi-VN');
const fmtM = n => `${fmt(n)}đ`;

export default function SegmentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [segFilter, setSegFilter] = useState('');
  const [analyzeUid, setAnalyzeUid] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState(null);

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ['opsSegments'],
    queryFn:  () => opsApi.getSegments({ limit: 200 }).then(r => r.data?.data ?? []),
  });

  const { data: churnAlerts = [] } = useQuery({
    queryKey: ['opsChurnAlerts'],
    queryFn:  () => opsApi.getChurnAlerts({ limit: 50 }).then(r => r.data?.data ?? []),
  });

  const churnScanMut = useMutation({
    mutationFn: opsApi.triggerChurnScan,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['opsChurnAlerts'] }),
  });

  const analyzeMut = useMutation({
    mutationFn: (uid) => opsApi.analyzeUser(uid),
    onSuccess:  (res) => {
      setAnalyzeResult(res.data?.data);
      qc.invalidateQueries({ queryKey: ['opsSegments'] });
    },
  });

  const filtered = segments.filter(s => {
    if (segFilter && s.segment !== segFilter) return false;
    if (search && !String(s.userId).includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">🎯 Phân khúc khách hàng</h1>
        <button onClick={() => churnScanMut.mutate()} disabled={churnScanMut.isPending}
          className="flex items-center gap-1.5 text-xs bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded-lg disabled:opacity-60">
          {churnScanMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Quét Churn
        </button>
      </div>

      {/* Segment filter pills */}
      <div className="flex gap-2 flex-wrap">
        {['', 'champion', 'gold', 'silver', 'at_risk', 'bronze'].map(s => (
          <button key={s} onClick={() => setSegFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              segFilter === s
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-700 text-gray-400 hover:text-gray-200'
            }`}>
            {s === '' ? 'Tất cả' : SEG_LABEL[s]?.label || s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Segment table */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
            <Search size={14} className="text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm userId..."
              className="flex-1 bg-transparent text-sm text-gray-300 outline-none placeholder-gray-600" />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-900 text-gray-500 border-b border-gray-800">
                  <tr>
                    <th className="text-left px-4 py-2">User</th>
                    <th className="text-left px-4 py-2">Phân khúc</th>
                    <th className="text-right px-4 py-2">R</th>
                    <th className="text-right px-4 py-2">F</th>
                    <th className="text-right px-4 py-2">M</th>
                    <th className="text-right px-4 py-2">CLV</th>
                    <th className="text-right px-4 py-2">Ngân sách/tháng</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map(s => (
                    <tr key={s.userId} className="border-t border-gray-800/60 hover:bg-gray-800/30">
                      <td className="px-4 py-2 text-gray-300">#{s.userId}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${SEG_LABEL[s.segment]?.color || 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                          {s.segment}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-400">{s.rScore}</td>
                      <td className="px-4 py-2 text-right text-gray-400">{s.fScore}</td>
                      <td className="px-4 py-2 text-right text-gray-400">{s.mScore}</td>
                      <td className="px-4 py-2 text-right text-green-400">{fmtM(s.clv)}</td>
                      <td className="px-4 py-2 text-right text-gray-400">{fmtM(s.avgMonthly)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-500">Không có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right panel: manual analyze + churn alerts */}
        <div className="space-y-5">
          {/* Manual analyze */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">🔍 Phân tích 1 User</h3>
            <input value={analyzeUid} onChange={e => setAnalyzeUid(e.target.value)} placeholder="Nhập userId..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500 mb-3" />
            <button onClick={() => analyzeMut.mutate(analyzeUid)} disabled={!analyzeUid || analyzeMut.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg disabled:opacity-60">
              {analyzeMut.isPending ? 'Đang phân tích...' : 'Phân tích RFM'}
            </button>
            {analyzeResult && (
              <div className="mt-3 p-3 bg-gray-800 rounded-lg text-xs space-y-1">
                <p className="text-gray-300">Segment: <strong className="text-white">{analyzeResult.segment}</strong></p>
                <p className="text-gray-400">Recency: {Number(analyzeResult.recency || 0).toFixed(1)} ngày</p>
                <p className="text-gray-400">Frequency: {analyzeResult.frequency} giao dịch</p>
                <p className="text-gray-400">Monetary: {fmtM(analyzeResult.monetary)}</p>
                <p className="text-gray-400">RFM: {analyzeResult.rScore}/{analyzeResult.fScore}/{analyzeResult.mScore}</p>
              </div>
            )}
          </div>

          {/* Churn alerts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">⚠️ Churn Alerts</h3>
            {churnAlerts.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-3">Không có cảnh báo</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {churnAlerts.map(a => (
                  <div key={a.id} className="flex items-start gap-2 p-2 bg-gray-800/50 rounded-lg">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${a.riskLevel === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <div className="min-w-0 text-xs">
                      <p className="text-gray-300">User #{a.userId}</p>
                      <p className="text-gray-500">{a.reason} · {a.daysInactive}d inactive</p>
                    </div>
                    <span className={`text-xs flex-shrink-0 px-1.5 py-0.5 rounded ${a.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {a.riskLevel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
