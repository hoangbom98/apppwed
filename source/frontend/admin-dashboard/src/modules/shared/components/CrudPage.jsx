// frontend/admin-dashboard/src/modules/shared/components/CrudPage.jsx
// Generic admin CRUD table — reusable for Games, News, Tools, etc.
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * @param {{
 *   title:    string,
 *   queryKey: string,
 *   api: {
 *     list:   (params?: object) => Promise<any>,
 *     create: (body: object)   => Promise<any>,
 *     update: (id: number, body: object) => Promise<any>,
 *     remove: (id: number)    => Promise<any>,
 *   },
 *   fields: Array<{
 *     key: string, label: string,
 *     type?: 'text'|'number'|'textarea'|'select',
 *     options?: Array<{label:string, value:string}>,
 *     required?: boolean,
 *     listHide?: boolean,
 *   }>,
 * }}
 */
export default function CrudPage({ title, queryKey, api, fields }) {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [editing, setEditing] = useState(null);   // null=closed, {}=new, {...}=edit
  const [form, setForm]       = useState({});

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, page],
    queryFn:  () => api.list({ page, limit: 15 }),
  });
  const rows       = data?.data?.data ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

  const saveMut = useMutation({
    mutationFn: () => editing?.id ? api.update(editing.id, form) : api.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); setEditing(null); },
  });

  const delMut = useMutation({
    mutationFn: api.remove,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [queryKey] }),
  });

  const tableFields = fields.filter(f => !f.listHide);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <button
          onClick={() => { setEditing({}); setForm({}); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Tạo mới
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="px-4 py-3">#</th>
              {tableFields.map(f => <th key={f.key} className="px-4 py-3">{f.label}</th>)}
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={tableFields.length + 2} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
              : rows.length === 0
              ? <tr><td colSpan={tableFields.length + 2} className="px-4 py-8 text-center text-gray-500">Trống</td></tr>
              : rows.map(row => (
                  <tr key={row.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                    <td className="px-4 py-3 text-gray-500">{row.id}</td>
                    {tableFields.map(f => (
                      <td key={f.key} className="px-4 py-3 text-gray-300 max-w-[200px] truncate">
                        {String(row[f.key] ?? '').slice(0, 80)}
                      </td>
                    ))}
                    <td className="px-4 py-3 flex gap-1">
                      <button
                        onClick={() => { setEditing(row); setForm({ ...row }); }}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded"
                      >Sửa</button>
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
        <button
          className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40 text-gray-300"
          disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}
        >Trước</button>
        <span className="px-3 py-1 text-gray-400">{page} / {totalPages}</span>
        <button
          className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40 text-gray-300"
          disabled={page >= totalPages}
          onClick={() => setPage(p => p + 1)}
        >Sau</button>
      </div>

      {/* Edit / Create modal */}
      {editing !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">
                {editing.id ? 'Chỉnh sửa' : 'Tạo mới'} {title}
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>

            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-sm text-gray-400 mb-1">
                  {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={4}
                    value={form[f.key] ?? ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
                  />
                ) : f.type === 'select' ? (
                  <select
                    value={form[f.key] ?? ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none"
                  >
                    <option value="">Chọn...</option>
                    {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={form[f.key] ?? ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm disabled:opacity-60"
              >
                {saveMut.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-sm"
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
