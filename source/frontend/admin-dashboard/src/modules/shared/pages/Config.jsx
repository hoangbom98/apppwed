// frontend/admin-dashboard/src/modules/shared/pages/Config.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

export default function Config() {
  const [editingItem, setEditingItem] = useState(null);
  const [newValue, setNewValue]       = useState('');
  const [jsonError, setJsonError]     = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminConfig'],
    queryFn:  () => api.get('/admin/config').then(r => r.data?.data ?? r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (updates) => api.put('/admin/config', { updates }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminConfig'] });
      setEditingItem(null);
      setJsonError('');
    },
  });

  const handleSave = () => {
    try {
      const parsed = JSON.parse(newValue);
      updateMutation.mutate([{ ...editingItem, value: parsed }]);
    } catch {
      setJsonError('JSON không hợp lệ');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-black mb-4 text-white">Cấu hình hệ thống</h1>

      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Nhóm</th>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Giá trị</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
              : (data ?? []).map(row => (
                  <tr key={row.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                    <td className="px-4 py-3 text-gray-300">{row.module}</td>
                    <td className="px-4 py-3 text-gray-400">{row.group}</td>
                    <td className="px-4 py-3 font-mono text-blue-400 text-xs">{row.key}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[240px] truncate">
                      {JSON.stringify(row.value)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setEditingItem(row); setNewValue(JSON.stringify(row.value, null, 2)); setJsonError(''); }}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded"
                      >Sửa</button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Sửa cấu hình</h2>
            <p className="text-sm text-gray-400"><span className="font-mono text-blue-400">{editingItem.key}</span></p>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Giá trị mới (JSON)</label>
              <textarea
                rows={6}
                value={newValue}
                onChange={e => { setNewValue(e.target.value); setJsonError(''); }}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 font-mono focus:outline-none focus:border-blue-500 resize-none"
              />
              {jsonError && <p className="text-xs text-red-400 mt-1">{jsonError}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm disabled:opacity-60"
              >
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                onClick={() => setEditingItem(null)}
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
