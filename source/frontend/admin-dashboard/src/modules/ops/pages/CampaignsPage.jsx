// frontend/admin-dashboard/src/modules/ops/pages/CampaignsPage.jsx
// Marketing campaigns log + manual trigger panel
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi } from '../api';
import { Play, Loader2, Megaphone } from 'lucide-react';

const STATUS_COLOR = {
  sent:    'bg-green-500/20 text-green-400',
  failed:  'bg-red-500/20 text-red-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
};

const SEG_COLOR = {
  champion: 'text-yellow-400',
  gold:     'text-yellow-600',
  silver:   'text-slate-300',
  at_risk:  'text-red-400',
  bronze:   'text-orange-700',
};

export default function CampaignsPage() {
  const qc = useQueryClient();
  const [days, setDays] = useState(7);
  const [toast, setToast] = useState(null);

  const showMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: stats = [] } = useQuery({
    queryKey: ['opsCampaignStats', days],
    queryFn:  () => opsApi.getCampaignStats(days).then(r => r.data?.data ?? []),
  });

  const { data: log = [], isLoading: logLoading } = useQuery({
    queryKey: ['opsCampaignLog', days],
    queryFn:  () => opsApi.getCampaignLog(days).then(r => r.data?.data ?? []),
  });

  const runAll = useMutation({
    mutationFn: opsApi.runCampaigns,
    onSuccess:  (res) => {
      showMsg(`✅ Đã gửi ${res.data?.data?.sent ?? 0} campaign`);
      qc.invalidateQueries({ queryKey: ['opsCampaignStats'] });
      qc.invalidateQueries({ queryKey: ['opsCampaignLog'] });
    },
    onError: () => showMsg('Lỗi khi chạy campaign', 'error'),
  });

  const runMarketing = useMutation({
    mutationFn: opsApi.runMarketing,
    onSuccess:  (res) => {
      const d = res.data?.data || {};
      showMsg(`🎉 Birthday: ${d.birthday} · NewUser: ${d.newUser} · VIP: ${d.vip}`);
      qc.invalidateQueries({ queryKey: ['opsCampaignLog'] });
    },
    onError: () => showMsg('Lỗi marketing automation', 'error'),
  });

  const runTickets = useMutation({
    mutationFn: opsApi.runTicketAutoProcess,
    onSuccess:  (res) => showMsg(`🤖 Tự động xử lý ${res.data?.data?.processed ?? 0} ticket`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">📢 Marketing & Campaigns</h1>
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                days === d ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:text-gray-200'
              }`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── Action panel ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Chạy tất cả Campaign theo Segment', sub: 'Champion / Gold / At-risk / Bronze', mut: runAll,      color: 'purple', icon: Play },
          { label: 'Marketing tự động',                  sub: 'Sinh nhật · User mới · VIP tháng',  mut: runMarketing, color: 'green',  icon: Megaphone },
          { label: 'Auto-reply Ticket',                  sub: 'Phân loại + trả lời tự động',        mut: runTickets,   color: 'blue',   icon: Play },
        ].map(a => {
          const colors = {
            purple: 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10',
            green:  'border-green-500/30  bg-green-500/5  hover:bg-green-500/10',
            blue:   'border-blue-500/30   bg-blue-500/5   hover:bg-blue-500/10',
          };
          return (
            <button key={a.label} onClick={() => a.mut.mutate()} disabled={a.mut.isPending}
              className={`p-4 border rounded-xl text-left transition-colors disabled:opacity-60 ${colors[a.color]}`}>
              <div className="flex items-center gap-2 mb-1">
                {a.mut.isPending ? <Loader2 size={14} className="animate-spin text-gray-400" /> : <a.icon size={14} className="text-gray-400" />}
                <span className="text-sm font-semibold text-gray-200">{a.label}</span>
              </div>
              <p className="text-xs text-gray-500">{a.sub}</p>
            </button>
          );
        })}
      </div>

      {/* ── Stats summary ────────────────────────────────────────── */}
      {stats.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">📊 Thống kê {days} ngày</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.slice(0, 8).map(s => (
              <div key={s.campaign} className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 truncate">{s.campaign}</p>
                <p className="text-xl font-bold text-white mt-1">{s.count?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Campaign log ─────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300">📋 Lịch sử Campaign ({days} ngày)</h3>
        </div>
        {logLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-gray-400" /></div>
        ) : log.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">Chưa có campaign nào được gửi</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Campaign</th>
                  <th className="text-left px-4 py-3">Segment</th>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="text-left px-4 py-3">Trạng thái</th>
                  <th className="text-left px-4 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {log.slice(0, 100).map(r => (
                  <tr key={r.id} className="border-t border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-2.5 text-gray-400">#{r.userId}</td>
                    <td className="px-4 py-2.5 text-gray-300 font-medium max-w-xs truncate">{r.campaignName}</td>
                    <td className="px-4 py-2.5">
                      <span className={`${SEG_COLOR[r.segment] || 'text-gray-400'} capitalize`}>{r.segment || '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{r.action}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[r.status] || 'bg-gray-700 text-gray-400'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {new Date(r.createdAt).toLocaleString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-sm font-medium shadow-xl ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
