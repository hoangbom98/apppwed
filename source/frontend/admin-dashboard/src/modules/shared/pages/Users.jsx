// frontend/admin-dashboard/src/modules/shared/pages/Users.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

function UserDetailModal({ user, onAdjustBalance, onClose }) {
  const [amount, setAmount] = useState('');

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Chi tiết người dùng</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['ID', user.id],
            ['Username', user.username],
            ['Họ tên', user.fullName],
            ['Email', user.email],
            ['Role', user.role],
            ['Trạng thái', user.status],
            ['Ngày tạo', new Date(user.createdAt || user.created_at).toLocaleString('vi')],
          ].map(([k, v]) => (
            <div key={k}>
              <span className="text-gray-400">{k}: </span>
              <span className="text-gray-200">{v}</span>
            </div>
          ))}
        </div>

        {user.wallets?.length > 0 && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-200 mb-2 text-sm">Số dư ví</h4>
            {user.wallets.map(w => (
              <div key={w.currency} className="flex justify-between py-1 text-sm">
                <span className="text-gray-400">{w.currency}</span>
                <span className="text-gray-200">{Number(w.balance).toLocaleString('vi')}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-gray-700 pt-4">
          <h4 className="font-semibold text-gray-200 mb-2 text-sm">Điều chỉnh số dư</h4>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Số tiền (+/-)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => onAdjustBalance(Number(amount))}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >Cập nhật</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', page, search],
    queryFn:  () =>
      api.get('/admin/users', { params: { page, limit: 20, search: search || undefined } })
         .then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? 0;

  const toggleStatus = useMutation({
    mutationFn: (userId) => api.patch(`/admin/users/${userId}/status`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['adminUsers'] }),
  });

  const adjustBalance = useMutation({
    mutationFn: ({ userId, amount }) =>
      api.post(`/admin/users/${userId}/balance`, { amount, reason: 'Admin adjustment' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminUsers'] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-black mb-4 text-white">Quản lý người dùng</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm username / email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              {['#', 'Username', 'Họ tên', 'Số dư', 'Role', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
              : rows.length === 0
              ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Không có kết quả</td></tr>
              : rows.map(u => (
                  <tr key={u.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                    <td className="px-4 py-3 text-gray-500">{u.id}</td>
                    <td className="px-4 py-3 text-gray-200">{u.username}</td>
                    <td className="px-4 py-3 text-gray-300">{u.fullName}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {u.wallets?.find(w => w.currency === 'VND')?.balance?.toLocaleString('vi') ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-indigo-900 text-indigo-300' : 'bg-gray-700 text-gray-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${u.status === 'active' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(u.created_at || u.createdAt).toLocaleDateString('vi')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded"
                        >Xem</button>
                        <button
                          onClick={() => toggleStatus.mutate(u.id)}
                          className="text-xs bg-yellow-900 hover:bg-yellow-800 text-yellow-300 px-2 py-1 rounded"
                        >
                          {u.status === 'active' ? 'Ban' : 'Unban'}
                        </button>
                      </div>
                    </td>
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
          <button className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button>
          <span className="px-2 py-1">{page}</span>
          <button className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Sau</button>
        </div>
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAdjustBalance={(amount) => {
            adjustBalance.mutate({ userId: selectedUser.id, amount });
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
