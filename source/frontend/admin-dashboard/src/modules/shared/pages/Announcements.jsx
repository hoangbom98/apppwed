// frontend/admin-dashboard/src/modules/shared/pages/Announcements.jsx
// Cross-project announcement management.
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';
import { useToast } from '@admin/modules/shared/components/Toast';

const TARGET_OPTS = [
  { label: 'Tất cả',  value: 'all' },
  { label: 'Game',    value: 'game' },
  { label: 'Dating',  value: 'dating' },
  { label: 'Sports',  value: 'sports' },
  { label: 'Trade',   value: 'trade' },
  { label: 'Hub',     value: 'hub' },
];

const STATUS_OPTS = [
  { label: 'Active',   value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const STATUS_BADGE = {
  active:   'bg-green-900 text-green-400',
  inactive: 'bg-gray-700 text-gray-400',
};

export default function Announcements() {
  const qc    = useQueryClient();
  const toast = useToast();
  const [editing,   setEditing]   = React.useState(null);
  const [form,      setForm]      = React.useState({});
  const [page,      setPage]      = React.useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-announcements', page],
    queryFn: () => api.get('/admin/announcements', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const rows       = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const saveMut = useMutation({
    mutationFn: () => editing?.id
      ? api.put(`/admin/announcements/${editing.id}`, form)
      : api.post('/admin/announcements', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      setEditing(null);
      toast(editing?.id ? 'Đã cập nhật thông báo' : 'Đã tạo thông báo mới');
    },
    onError: (err) => toast(err?.response?.data?.message || 'Lỗi khi lưu', 'error'),
  });

  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/admin/announcements/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast('Đã xoá thông báo', 'warning');
    },
    onError: () => toast('Lỗi khi xoá', 'error'),
  });

  const openNew  = () => { setForm({ target: 'all', status: 'active' }); setEditing({}); };
  const openEdit = (row) => { setForm({ ...row }); setEditing(row); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Thông báo hệ thống</h1>
        <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
          + Tạo thông báo
        </button>
      </div>

      <div className="border border-gray-800 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              {['ID', 'Tiêu đề', 'Đối tượng', 'Trạng thái', 'Thời gian', ''].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
              : rows.length === 0
              ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chưa có thông báo nào</td></tr>
              : rows.map(row => (
                <tr key={row.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-gray-500 text-xs">{row.id}</td>
                  <td className="px-4 py-3 text-gray-200 max-w-xs truncate">{row.title}</td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{row.target ?? 'all'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_BADGE[row.status] ?? 'bg-gray-700 text-gray-400'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString('vi') : '—'}
                  </td>
                  <td className="px-4 py-3 flex gap-1">
                    <button onClick={() => openEdit(row)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded">Sửa</button>
                    <button
                      onClick={() => { if (window.confirm('Xác nhận xoá?')) delMut.mutate(row.id); }}
                      className="text-xs bg-red-900 hover:bg-red-800 text-red-300 px-2 py-1 rounded"
                    >Xoá</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2 text-sm">
        <button className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40 text-gray-300" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button>
        <span className="px-3 py-1 text-gray-400">{page} / {totalPages}</span>
        <button className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40 text-gray-300" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</button>
      </div>

      {/* Modal */}
      {editing !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{editing.id ? 'Sửa thông báo' : 'Tạo thông báo mới'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>

            {[
              { key: 'title',   label: 'Tiêu đề',  required: true },
              { key: 'content', label: 'Nội dung', type: 'textarea' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm text-gray-400 mb-1">{f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}</label>
                {f.type === 'textarea'
                  ? <textarea rows={4} value={form[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none" />
                  : <input type="text" value={form[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                }
              </div>
            ))}

            {/* Target */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Đối tượng</label>
              <select value={form.target ?? 'all'} onChange={e => setForm({ ...form, target: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none">
                {TARGET_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Trạng thái</label>
              <select value={form.status ?? 'active'} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none">
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm disabled:opacity-60">
                {saveMut.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button onClick={() => setEditing(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-sm">Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
