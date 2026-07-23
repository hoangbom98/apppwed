// frontend/admin-dashboard/src/modules/ops/pages/TasksPage.jsx
// Manage and monitor the auto-assigned task queue
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi } from '../api';
import { CheckCircle, Loader2, Plus, RefreshCw } from 'lucide-react';

const PRIORITY_STYLE = {
  critical: 'bg-red-500/20 text-red-400',
  high:     'bg-orange-500/20 text-orange-400',
  medium:   'bg-yellow-500/20 text-yellow-400',
  low:      'bg-gray-700 text-gray-400',
};

const STATUS_STYLE = {
  pending:     'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-yellow-500/20 text-yellow-400',
  completed:   'bg-green-500/20 text-green-400',
  cancelled:   'bg-gray-700 text-gray-400',
};

const TASK_TYPES = ['support', 'withdraw', 'deposit', 'kyc', 'bug', 'campaign', 'churn', 'report'];

export default function TasksPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: 'support', title: '', description: '' });
  const [toast, setToast] = useState(null);

  const showMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['opsTasks', filter],
    queryFn:  () => opsApi.listTasks({ status: filter || undefined, limit: 50 }).then(r => r.data),
  });

  const completeMut = useMutation({
    mutationFn: (id) => opsApi.completeTask(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['opsTasks'] }); showMsg('Task đã hoàn thành'); },
  });

  const rebalanceMut = useMutation({
    mutationFn: opsApi.rebalanceTasks,
    onSuccess:  (res) => { showMsg(`Đã điều phối ${res.data?.data?.moved ?? 0} task`); refetch(); },
  });

  const createMut = useMutation({
    mutationFn: (body) => opsApi.createTask(body),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['opsTasks'] }); setShowCreate(false); setForm({ type: 'support', title: '', description: '' }); showMsg('Task đã được tạo và giao tự động'); },
    onError:    (e) => showMsg(e?.response?.data?.message || 'Lỗi tạo task', 'error'),
  });

  const tasks = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">📋 Quản lý Task</h1>
        <div className="flex gap-2">
          <button onClick={() => rebalanceMut.mutate()} disabled={rebalanceMut.isPending}
            className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded-lg disabled:opacity-60">
            {rebalanceMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Cân bằng tải
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg">
            <Plus size={13} /> Tạo Task
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {['', 'pending', 'in_progress', 'completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === s ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
            }`}>
            {s === '' ? 'Tất cả' : s === 'pending' ? 'Chờ' : s === 'in_progress' ? 'Đang xử lý' : 'Hoàn thành'}
          </button>
        ))}
      </div>

      {/* Task table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-gray-400" /></div>
      ) : tasks.length === 0 ? (
        <p className="text-center text-gray-500 py-12 text-sm">Không có task nào</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b border-gray-800 bg-gray-900">
              <tr>
                <th className="text-left px-4 py-3">Task</th>
                <th className="text-left px-4 py-3">Loại</th>
                <th className="text-left px-4 py-3">Ưu tiên</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="text-left px-4 py-3">Giao cho</th>
                <th className="text-left px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="px-4 py-3">
                    <p className="text-gray-200 font-medium truncate max-w-xs">{t.title}</p>
                    {t.description && <p className="text-xs text-gray-500 truncate max-w-xs mt-0.5">{t.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{t.type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_STYLE[t.priority] || 'bg-gray-700 text-gray-400'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[t.status] || 'bg-gray-700 text-gray-400'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">#{t.assignedTo || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    {t.status !== 'completed' && (
                      <button onClick={() => completeMut.mutate(t.id)} disabled={completeMut.isPending}
                        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 disabled:opacity-50">
                        <CheckCircle size={13} /> Xong
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Tạo Task mới</h2>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Loại task</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500">
                {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tiêu đề *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                placeholder="Mô tả ngắn..." />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ghi chú</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => createMut.mutate(form)} disabled={!form.title || createMut.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm disabled:opacity-60">
                {createMut.isPending ? 'Đang tạo...' : 'Tạo & Giao tự động'}
              </button>
              <button onClick={() => setShowCreate(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Huỷ</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-sm font-medium shadow-xl ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
