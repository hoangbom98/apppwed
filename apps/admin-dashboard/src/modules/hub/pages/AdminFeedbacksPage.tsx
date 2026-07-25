// @ts-nocheck
// frontend/admin-dashboard/src/modules/hub/pages/AdminFeedbacksPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import client from '@admin/api/client';

const STATUS_BADGE = {
  read:    'bg-green-900/40 text-green-400 border border-green-800/40',
  new:     'bg-yellow-900/40 text-yellow-400 border border-yellow-800/40',
  replied: 'bg-blue-900/40 text-blue-400 border border-blue-800/40',
};

export default function AdminFeedbacksPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['hub-admin-feedbacks', page],
    queryFn: () =>
      client.get('/hub/admin/feedbacks', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;

  const deleteMut = useMutation({
    mutationFn: (id) => client.delete(`/hub/admin/feedbacks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hub-admin-feedbacks'] }),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Phản hồi người dùng</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Danh sách feedback / liên hệ từ người dùng Hub
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-800/50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-gray-800">
                <th className="px-6 py-4">Người gửi</th>
                <th className="px-6 py-4">Tiêu đề</th>
                <th className="px-6 py-4">Nội dung</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày gửi</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" style={{ width: `${60 + j * 10}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <MessageSquare size={32} className="text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500">Không có phản hồi nào</p>
                    </td>
                  </tr>
                )
                : rows.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-gray-200 font-medium">{f.name ?? f.email ?? '—'}</p>
                      {f.email && f.name && (
                        <p className="text-xs text-gray-500 mt-0.5">{f.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300 max-w-[160px] truncate">
                      {f.subject ?? f.title ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-400 max-w-[220px] truncate text-xs">
                      {f.message ?? f.content ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_BADGE[f.status] ?? STATUS_BADGE.new}`}>
                        {f.status ?? 'new'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(f.createdAt ?? f.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm('Xoá phản hồi này?')) deleteMut.mutate(f.id);
                        }}
                        className="p-1.5 bg-gray-800 hover:bg-red-900/40 text-gray-500 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Xoá"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <span>
            Hiển thị <span className="text-gray-300 font-bold">{rows.length}</span> / {total}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              className="p-1.5 hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-3 py-1.5 bg-gray-800 rounded-lg font-bold text-gray-300 text-xs">
              {page} / {totalPages}
            </div>
            <button
              className="p-1.5 hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
