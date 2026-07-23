// frontend/admin-dashboard/src/modules/shared/pages/RiskAudit.jsx
// Risk monitoring + audit log viewer for admin.
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@admin/api/client';
import { ShieldAlert, Activity } from 'lucide-react';
import { SkeletonTable } from '@admin/modules/shared/components/Skeleton';

const RISK_LEVELS = {
  high:   'bg-red-900 text-red-400',
  medium: 'bg-yellow-900 text-yellow-400',
  low:    'bg-blue-900 text-blue-400',
};

// ── Suspicious users panel ────────────────────────────────────────────────────
function SuspiciousUsers() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-risk-users'],
    queryFn: () => api.get('/admin/risk/users').then(r => r.data?.data ?? []),
    staleTime: 60_000,
  });

  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-800 flex items-center gap-2">
        <ShieldAlert size={15} className="text-red-400" />
        <span className="text-sm font-semibold text-gray-200">Tài khoản nguy cơ cao</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-gray-500 text-xs">
          <tr>
            {['User', 'Dự án', 'Lý do', 'Mức độ', 'Thời gian'].map(h => (
              <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? <SkeletonTable rows={4} cols={5} />
            : rows.length === 0
            ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Không có dữ liệu</td></tr>
            : rows.map((r, i) => (
              <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/40">
                <td className="px-4 py-2.5 text-gray-200">{r.username ?? r.email ?? r.userId}</td>
                <td className="px-4 py-2.5 text-gray-400 capitalize">{r.project ?? '—'}</td>
                <td className="px-4 py-2.5 text-gray-400">{r.reason ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded ${RISK_LEVELS[r.level] ?? 'bg-gray-700 text-gray-400'}`}>
                    {r.level ?? 'low'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">
                  {r.detectedAt ? new Date(r.detectedAt).toLocaleString('vi') : '—'}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

// ── Audit log table ───────────────────────────────────────────────────────────
function AuditLog() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-log', page],
    queryFn: () => api.get('/admin/audit-log', { params: { page, limit: 20 } }).then(r => r.data),
    staleTime: 15_000,
  });

  const rows       = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-3">
      <div className="border border-gray-800 rounded-lg overflow-hidden overflow-x-auto">
        <div className="px-4 py-3 bg-gray-800 flex items-center gap-2">
          <Activity size={15} className="text-blue-400" />
          <span className="text-sm font-semibold text-gray-200">Nhật ký hành động quản trị</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-500 text-xs">
            <tr>
              {['Admin', 'Hành động', 'Đối tượng', 'IP', 'Thời gian'].map(h => (
                <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <SkeletonTable rows={5} cols={5} />
              : rows.length === 0
              ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Không có nhật ký</td></tr>
              : rows.map((r, i) => (
                <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="px-4 py-2.5 text-gray-200">{r.admin?.username ?? r.adminId}</td>
                  <td className="px-4 py-2.5 text-blue-400 font-mono text-xs">{r.action}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs max-w-[200px] truncate">{r.target ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{r.ip ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString('vi') : '—'}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2 text-sm">
        <button className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40 text-gray-300" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button>
        <span className="px-3 py-1 text-gray-400">{page} / {totalPages}</span>
        <button className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40 text-gray-300" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</button>
      </div>
    </div>
  );
}

export default function RiskAudit() {
  const [tab, setTab] = useState('risk');
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Rủi ro & Audit</h1>
      <div className="flex gap-2">
        <button onClick={() => setTab('risk')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'risk' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          🛡️ Nguy cơ rủi ro
        </button>
        <button onClick={() => setTab('audit')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'audit' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          📋 Nhật ký hành động
        </button>
      </div>
      {tab === 'risk'  ? <SuspiciousUsers /> : <AuditLog />}
    </div>
  );
}
