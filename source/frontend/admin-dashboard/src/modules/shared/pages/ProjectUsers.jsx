// frontend/admin-dashboard/src/modules/shared/pages/ProjectUsers.jsx
// Cross-project user management — view users of any sub-project.
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

const PROJECTS = [
  { code: 'all',    label: '🌐 Tất cả',   endpoint: '/admin/users' },
  { code: 'game',   label: '🎮 Game',     endpoint: '/admin/users?project=game' },
  { code: 'dating', label: '💘 Dating',   endpoint: '/admin/users?project=dating' },
  { code: 'trade',  label: '📈 Trade',    endpoint: '/admin/users?project=trade' },
  { code: 'sports', label: '⚽ Sports',   endpoint: '/admin/users?project=sports' },
  { code: 'hub',    label: '🏠 Hub',      endpoint: '/admin/users?project=hub' },
];

export default function ProjectUsers() {
  const [project, setProject] = useState('all');
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const qc = useQueryClient();

  const current  = PROJECTS.find(p => p.code === project);
  const endpoint = project === 'all' ? '/admin/users' : `/admin/users`;
  const params   = { page, limit: 20, search: search || undefined, project: project !== 'all' ? project : undefined };

  const { data, isLoading } = useQuery({
    queryKey: ['adminProjectUsers', project, page, search],
    queryFn: () => api.get(endpoint, { params }).then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const toggleStatus = useMutation({
    mutationFn: (userId) => api.patch(`/admin/users/${userId}/status`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['adminProjectUsers'] }),
  });

  const adjustBalance = useMutation({
    mutationFn: ({ userId, amount }) => api.post(`/admin/users/${userId}/balance`, { amount, reason: 'Admin adjustment' }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['adminProjectUsers'] }); setSelectedUser(null); },
  });

  return (
    <div>
      <h1 className="text-2xl font-black mb-5 text-white">Quản lý thành viên</h1>

      {/* Project tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {PROJECTS.map(p => (
          <button key={p.code}
            onClick={() => { setProject(p.code); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${project === p.code ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >{p.label}</button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text" placeholder="Tìm username / email..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              {['#', 'Username', 'Họ tên', 'Email', 'Số dư', 'Role', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
              : rows.length === 0
              ? <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Không có kết quả</td></tr>
              : rows.map(u => (
                <tr key={u.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.id}</td>
                  <td className="px-4 py-3 text-gray-200">{u.username}</td>
                  <td className="px-4 py-3 text-gray-300">{u.fullName}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {(u.wallets?.find(w => w.currency === 'VND')?.balance ?? u.balance ?? 0).toLocaleString('vi')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${u.role === 'admin' || u.role === 'super_admin' ? 'bg-indigo-900 text-indigo-300' : 'bg-gray-700 text-gray-300'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${u.status === 'active' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                      {u.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.createdAt ?? u.created_at).toLocaleDateString('vi')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedUser(u)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded">Xem</button>
                      <button
                        onClick={() => toggleStatus.mutate(u.id)}
                        className="text-xs bg-yellow-900 hover:bg-yellow-800 text-yellow-300 px-2 py-1 rounded">
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
          <button className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(p => p-1)}>Trước</button>
          <span className="px-2 py-1">{page}</span>
          <button className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40" disabled={page >= Math.ceil(total/20)} onClick={() => setPage(p => p+1)}>Sau</button>
        </div>
      </div>

      {/* Detail modal */}
      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAdjust={(amt) => adjustBalance.mutate({ userId: selectedUser.id, amount: amt })}
          isAdjusting={adjustBalance.isPending}
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onAdjust, isAdjusting }) {
  const [amount, setAmount] = useState('');
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Chi tiết người dùng #{user.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[['ID', user.id], ['Username', user.username], ['Họ tên', user.fullName],
            ['Email', user.email], ['Phone', user.phone ?? '—'], ['Role', user.role],
            ['Trạng thái', user.status], ['KYC', user.kycStatus ?? '—'],
            ['Ngày tạo', new Date(user.createdAt ?? user.created_at).toLocaleString('vi')],
          ].map(([k, v]) => (
            <div key={k}>
              <span className="text-gray-400">{k}: </span>
              <span className="text-gray-200">{v}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-700 pt-4">
          <h4 className="font-semibold text-gray-200 mb-2 text-sm">Điều chỉnh số dư</h4>
          <div className="flex gap-2">
            <input type="number" placeholder="Số tiền (+/-)" value={amount} onChange={e => setAmount(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
            <button disabled={isAdjusting || !amount}
              onClick={() => onAdjust(Number(amount))}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm">
              {isAdjusting ? '...' : 'Áp dụng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
