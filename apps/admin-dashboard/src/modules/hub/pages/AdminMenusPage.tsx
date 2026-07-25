// @ts-nocheck
// frontend/admin-dashboard/src/modules/hub/pages/AdminMenusPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu, X } from 'lucide-react';
import { adminMenus } from '../api';

export default function AdminMenusPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['hub-admin-menus'],
    queryFn: () => adminMenus.list(),
  });

  const items = data?.data?.data ?? data?.data ?? [];

  const saveMut = useMutation({
    mutationFn: (body) => adminMenus.update(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hub-admin-menus'] }); setEditing(null); },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Quản lý Menu</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Menus được tổ chức theo vị trí. Mỗi menu là một mảng JSON các mục điều hướng.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-800/50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-gray-800">
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Số items</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}><td colSpan={3} className="px-6 py-4">
                      <div className="h-4 bg-gray-800 rounded animate-pulse w-40" />
                    </td></tr>
                  ))
                : items.length === 0
                ? <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">Chưa có menu nào</td></tr>
                : items.map((m) => (
                  <tr key={m.location ?? m.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-gray-200 font-mono font-semibold">
                      <div className="flex items-center gap-2">
                        <Menu size={14} className="text-gray-500" />
                        {m.location ?? m.id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-full font-semibold">
                        {Array.isArray(m.items) ? m.items.length : '—'} items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditing({ ...m, _json: JSON.stringify(m.items ?? [], null, 2) })}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Sửa JSON
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-white">Menu: <span className="text-blue-400 font-mono">{editing.location ?? editing.id}</span></h2>
                <p className="text-xs text-gray-500 mt-0.5">Chỉnh sửa cấu trúc JSON của menu items</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Items (JSON array)
              </label>
              <textarea
                rows={16}
                value={editing._json}
                onChange={e => setEditing({ ...editing, _json: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 font-mono focus:outline-none focus:border-blue-500 resize-none transition-colors"
              />
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(editing._json);
                    saveMut.mutate({ location: editing.location ?? editing.id, items: parsed });
                  } catch {
                    alert('JSON không hợp lệ — hãy kiểm tra lại cú pháp');
                  }
                }}
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
