// frontend/admin-dashboard/src/modules/shared/pages/Transactions.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@admin/api/client';

const STATUS_BADGE = {
  completed: 'bg-green-900 text-green-400',
  pending:   'bg-yellow-900 text-yellow-400',
  failed:    'bg-red-900 text-red-400',
};

export default function Transactions() {
  const [page, setPage]     = useState(1);
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminTransactions', page, filter],
    queryFn:  () =>
      api.get('/admin/transactions', { params: { page, limit: 20, status: filter || undefined } })
         .then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns = [
    { key: 'id',        label: 'ID',         render: r => r.id },
    { key: 'type',      label: 'Loại',       render: r => (
      <span className={`px-2 py-0.5 rounded text-xs ${r.type === 'deposit' ? 'bg-green-900 text-green-400' : 'bg-blue-900 text-blue-400'}`}>
        {r.type === 'deposit' ? 'Nạp' : 'Rút'}
      </span>
    )},
    { key: 'amount',    label: 'Số tiền',    render: r => Number(r.amount).toLocaleString('vi') },
    { key: 'status',    label: 'Trạng thái', render: r => (
      <span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGE[r.status] || 'bg-gray-700 text-gray-300'}`}>
        {{ completed: 'Hoàn thành', pending: 'Chờ duyệt', failed: 'Thất bại' }[r.status] || r.status}
      </span>
    )},
    { key: 'user',      label: 'Người dùng', render: r => r.user?.username ?? '—' },
    { key: 'createdAt', label: 'Thời gian',  render: r => new Date(r.createdAt).toLocaleString('vi') },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black mb-4 text-white">Giao dịch</h1>

      {/* Filter */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {[['', 'Tất cả'], ['pending', 'Chờ duyệt'], ['completed', 'Hoàn thành'], ['failed', 'Thất bại']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => { setFilter(v); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === v ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400">
            <tr>{columns.map(c => <th key={c.key} className="px-4 py-3">{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
              : rows.length === 0
              ? <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">Không có dữ liệu</td></tr>
              : rows.map(row => (
                  <tr key={row.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                    {columns.map(c => <td key={c.key} className="px-4 py-3">{c.render(row)}</td>)}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
        <span>Tổng: {total}</span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >Trước</button>
          <span className="px-2 py-1">{page}</span>
          <button
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40"
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage(p => p + 1)}
          >Sau</button>
        </div>
      </div>
    </div>
  );
}
