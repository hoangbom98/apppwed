import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, X, Search as SearchIcon } from 'lucide-react';
import client from '@admin/api/client';

const FORM_FIELDS = [
  { key: 'path',        label: 'Path / URL (vd: /games)',      required: true },
  { key: 'title',       label: 'Meta Title',                    required: true },
  { key: 'description', label: 'Meta Description',              required: true },
  { key: 'keywords',    label: 'Keywords (phân cách bằng dấu phẩy)' },
  { key: 'ogImage',     label: 'OG Image URL' },
];

export default function AdminSeoPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['hub-seo-meta'],
    queryFn: () => client.get('/hub/seo/meta').then(r => r.data?.data ?? r.data),
  });

  const rows = Array.isArray(data) ? data : data?.items ?? [];

  const saveMut = useMutation({
    mutationFn: (body) => {
      const url    = body.id ? `/hub/admin/seo/${body.id}` : '/hub/admin/seo';
      const method = body.id ? 'put' : 'post';
      return client[method](url, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hub-seo-meta'] });
      setEditing(null);
    },
  });

  const openNew  = () => { setEditing({}); setForm({}); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s }); };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">SEO Metadata</h1>
          <p className="text-sm text-gray-400 mt-0.5">Cấu hình thẻ meta cho từng trang Hub</p>
        </div>
        <button
          onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> Thêm metadata
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-800/50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-gray-800">
                <th className="px-6 py-4">Path / URL</th>
                <th className="px-6 py-4">Meta Title</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {[120, 180, 200, 60].map((w, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" style={{ width: w }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <SearchIcon size={32} className="text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500">Chưa có SEO metadata nào</p>
                    </td>
                  </tr>
                )
                : rows.map((s) => (
                  <tr key={s.id ?? s.path} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4 text-blue-400 font-mono text-xs max-w-[140px] truncate">
                      {s.path ?? s.url}
                    </td>
                    <td className="px-6 py-4 text-gray-200 max-w-[200px] truncate">{s.title}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs max-w-[220px] truncate">{s.description}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-500 hover:text-blue-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Sửa"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Modal */}
      {editing !== null && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg flex flex-col max-h-[90vh] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editing.id ? 'Chỉnh sửa' : 'Thêm mới'} SEO Meta
                </h2>
                {editing.id && (
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">{editing.path ?? editing.url}</p>
                )}
              </div>
              <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {FORM_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    {f.label}{f.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={form[f.key] ?? ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button
                onClick={() => saveMut.mutate(form)}
                disabled={saveMut.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {saveMut.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2.5 rounded-xl text-sm transition-colors"
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
