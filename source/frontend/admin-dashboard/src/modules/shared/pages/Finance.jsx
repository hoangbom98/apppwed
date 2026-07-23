// frontend/admin-dashboard/src/modules/shared/pages/Finance.jsx
// Manages deposits & withdrawals across all projects with approve/reject actions.
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

const STATUS_BADGE = {
  pending:   'bg-yellow-900 text-yellow-400',
  approved:  'bg-green-900 text-green-400',
  completed: 'bg-green-900 text-green-400',
  rejected:  'bg-red-900 text-red-400',
};

const STATUS_LABEL = {
  pending: 'Chờ duyệt', approved: 'Đã duyệt',
  completed: 'Hoàn thành', rejected: 'Từ chối',
};

function FinanceTab({ type }) {
  const [page, setPage]       = useState(1);
  const [filter, setFilter]   = useState('pending');
  const [note, setNote]       = useState('');
  const [confirming, setConfirming] = useState(null); // { id, action }
  const qc = useQueryClient();

  const endpoint = type === 'deposit' ? '/admin/finance/deposits' : '/admin/finance/withdrawals';
  const approveEndpoint = (id) =>
    type === 'deposit'
      ? `/admin/finance/deposits/${id}/approve`
      : `/admin/finance/withdrawals/${id}/approve`;
  const rejectEndpoint = (id) =>
    type === 'deposit'
      ? `/admin/finance/deposits/${id}/reject`
      : `/admin/finance/withdrawals/${id}/reject`;

  const { data, isLoading } = useQuery({
    queryKey: [type === 'deposit' ? 'adminDeposits' : 'adminWithdrawals', page, filter],
    queryFn: () => api.get(endpoint, { params: { page, limit: 20, status: filter || undefined } }).then(r => r.data),
  });

  const approveMut = useMutation({
    mutationFn: ({ id }) => api.patch(approveEndpoint(id), { note }),
    onSuccess: () => { qc.invalidateQueries(); setConfirming(null); setNote(''); },
  });

  const rejectMut = useMutation({
    mutationFn: ({ id }) => api.patch(rejectEndpoint(id), { note }),
    onSuccess: () => { qc.invalidateQueries(); setConfirming(null); setNote(''); },
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const isPending = approveMut.isPending || rejectMut.isPending;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[['pending','Chờ duyệt'], ['approved','Đã duyệt'], ['rejected','Từ chối'], ['','Tất cả']].map(([v, l]) => (
          <button key={v}
            onClick={() => { setFilter(v); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === v ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >{l}</button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              {['ID', 'User', 'Số tiền', 'Phương thức', 'Trạng thái', 'Thời gian', 'Thao tác'].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
              : rows.length === 0
              ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Không có dữ liệu</td></tr>
              : rows.map(r => (
                <tr key={r.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.id}</td>
                  <td className="px-4 py-3 text-gray-200">{r.user?.username ?? r.user?.email ?? r.userId}</td>
                  <td className="px-4 py-3 text-white font-semibold">{Number(r.amount).toLocaleString('vi')} ₫</td>
                  <td className="px-4 py-3 text-gray-400">{r.paymentMethod ?? r.method ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_BADGE[r.status] ?? 'bg-gray-700 text-gray-300'}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.createdAt ?? r.created_at).toLocaleString('vi')}</td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setConfirming({ id: r.id, action: 'approve' })}
                          className="text-xs bg-green-900 hover:bg-green-800 text-green-400 px-2 py-1 rounded"
                        >Duyệt</button>
                        <button
                          onClick={() => setConfirming({ id: r.id, action: 'reject' })}
                          className="text-xs bg-red-900 hover:bg-red-800 text-red-400 px-2 py-1 rounded"
                        >Từ chối</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-sm text-gray-400">
        <span>Tổng: {total}</span>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(p => p-1)}>Trước</button>
          <span className="px-2 py-1">{page}</span>
          <button className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40" disabled={page >= Math.ceil(total/20)} onClick={() => setPage(p => p+1)}>Sau</button>
        </div>
      </div>

      {/* Confirm modal */}
      {confirming && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">
              {confirming.action === 'approve' ? '✅ Duyệt' : '❌ Từ chối'} giao dịch #{confirming.id}
            </h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ghi chú (tuỳ chọn)</label>
              <input
                type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Lý do..."
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                disabled={isPending}
                onClick={() => confirming.action === 'approve'
                  ? approveMut.mutate({ id: confirming.id })
                  : rejectMut.mutate({ id: confirming.id })
                }
                className={`flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 ${confirming.action === 'approve' ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-red-700 hover:bg-red-600 text-white'}`}
              >{isPending ? 'Đang xử lý...' : 'Xác nhận'}</button>
              <button onClick={() => { setConfirming(null); setNote(''); }} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-sm">Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Finance() {
  const [tab, setTab] = useState('deposit');
  return (
    <div>
      <h1 className="text-2xl font-black mb-5 text-white">Tài chính — Nạp / Rút</h1>
      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('deposit')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'deposit' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          💰 Nạp tiền
        </button>
        <button onClick={() => setTab('withdraw')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'withdraw' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          💸 Rút tiền
        </button>
      </div>
      <FinanceTab type={tab} />
    </div>
  );
}
