/**
 * AdminSettings.jsx
 * Route: /settings
 *
 * System settings management — CRUD for key/value pairs grouped by category.
 * Communicates with:
 *   GET    /admin/settings?group=xxx
 *   POST   /admin/settings          { key, value, group, description }
 *   PUT    /admin/settings/:key     { value }
 *   DELETE /admin/settings/:key
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

// ── Constants ─────────────────────────────────────────────────────────────────

const GROUP_LABELS = {
  general:  'Cài đặt chung',
  security: 'Bảo mật',
  email:    'Email / SMTP',
  payment:  'Thanh toán',
  sms:      'SMS / OTP',
  storage:  'Lưu trữ file',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-sm font-medium shadow-xl ${
      type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
    }`}>
      {msg}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Setting row ───────────────────────────────────────────────────────────────

function SettingRow({ item, onEdit, onDelete }) {
  const isSecret = item.description?.toLowerCase().includes('secret')
    || item.description?.toLowerCase().includes('password')
    || item.key?.toLowerCase().includes('secret')
    || item.key?.toLowerCase().includes('password');

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-blue-400">{item.key}</td>
      <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
        {isSecret ? <span className="text-gray-600 italic">••••••••</span> : String(item.value ?? '—')}
      </td>
      <td className="px-4 py-3">
        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-400 border border-gray-700">
          {item.group || 'general'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{item.description || '—'}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onEdit(item)}
            className="text-xs px-3 py-1 rounded bg-gray-800 text-gray-300 hover:bg-blue-600 hover:text-white transition-colors"
          >
            Sửa
          </button>
          <button
            onClick={() => onDelete(item)}
            className="text-xs px-3 py-1 rounded bg-gray-800 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
          >
            Xóa
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Edit / Create modal ───────────────────────────────────────────────────────

function SettingModal({ initial, onClose, onSave, isSaving }) {
  const isCreate = !initial?.key;
  const [form, setForm] = useState({
    key:         initial?.key         ?? '',
    value:       initial?.value       ?? '',
    group:       initial?.group       ?? 'general',
    description: initial?.description ?? '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cls = 'w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500';

  return (
    <Modal title={isCreate ? 'Thêm cài đặt' : `Sửa: ${initial.key}`} onClose={onClose}>
      <div className="space-y-4">
        {isCreate && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Key <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="vd: maintenance_mode"
              value={form.key}
              onChange={e => set('key', e.target.value)}
              className={cls}
            />
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-400 mb-1">Value <span className="text-red-400">*</span></label>
          <textarea
            rows={3}
            value={form.value}
            onChange={e => set('value', e.target.value)}
            className={`${cls} resize-none`}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Nhóm</label>
          <select
            value={form.group}
            onChange={e => set('group', e.target.value)}
            className={cls}
          >
            {Object.entries(GROUP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Mô tả</label>
          <input
            type="text"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            className={cls}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700"
          >
            Huỷ
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.key || form.value === '' || isSaving}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isCreate ? 'Thêm' : 'Lưu'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteModal({ item, onClose, onConfirm, isDeleting }) {
  return (
    <Modal title="Xác nhận xóa" onClose={onClose}>
      <p className="text-sm text-gray-300 mb-6">
        Xóa cài đặt <span className="font-mono text-blue-400">{item.key}</span>? Hành động này không thể hoàn tác.
      </p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700">
          Huỷ
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40"
        >
          {isDeleting ? 'Đang xóa…' : 'Xóa'}
        </button>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const [group,       setGroup]       = useState('');      // '' = all
  const [search,      setSearch]      = useState('');
  const [editTarget,  setEditTarget]  = useState(null);    // null | 'new' | item
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [toast,       setToast]       = useState(null);
  const qc = useQueryClient();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['settings', group],
    queryFn:  () =>
      api.get('/admin/settings', { params: group ? { group } : {} })
        .then(r => r.data?.data ?? r.data ?? []),
  });

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search.trim()) return settings;
    const q = search.toLowerCase();
    return settings.filter(s =>
      s.key?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      String(s.value ?? '').toLowerCase().includes(q)
    );
  }, [settings, search]);

  // Group counts for sidebar
  const groupCounts = useMemo(() => {
    const counts = {};
    settings.forEach(s => {
      const g = s.group || 'general';
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [settings]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (form) => {
      if (!editTarget?.key) {
        // Create new
        return api.post('/admin/settings', form);
      }
      // Update existing
      return api.put(`/admin/settings/${editTarget.key}`, { value: form.value });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setEditTarget(null);
      showToast('Đã lưu cài đặt');
    },
    onError: (err) => showToast(err?.response?.data?.message || 'Lỗi khi lưu', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (key) => api.delete(`/admin/settings/${key}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setDeleteTarget(null);
      showToast('Đã xóa cài đặt');
    },
    onError: (err) => showToast(err?.response?.data?.message || 'Lỗi khi xóa', 'error'),
  });

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Cài đặt hệ thống</h1>
          <p className="text-sm text-gray-400 mt-0.5">Quản lý các tham số vận hành của hệ thống</p>
        </div>
        <button
          onClick={() => setEditTarget('new')}
          className="sm:ml-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + Thêm cài đặt
        </button>
      </div>

      <div className="flex gap-6">
        {/* ── Group sidebar ──────────────────────────────────────────── */}
        <aside className="w-44 flex-shrink-0 space-y-1">
          <button
            onClick={() => setGroup('')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              group === '' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Tất cả <span className="ml-1 text-xs opacity-60">({settings.length})</span>
          </button>
          {Object.entries(GROUP_LABELS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setGroup(k)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                group === k ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {v}
              {groupCounts[k] && (
                <span className="ml-1 text-xs opacity-60">({groupCounts[k]})</span>
              )}
            </button>
          ))}
        </aside>

        {/* ── Table ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Tìm theo key hoặc mô tả…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-gray-500">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Đang tải…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500">Không có cài đặt nào.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900">
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Key</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Value</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Nhóm</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">Mô tả</th>
                    <th className="px-4 py-3 text-right text-xs text-gray-500 font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900/50">
                  {filtered.map(item => (
                    <SettingRow
                      key={item.key}
                      item={item}
                      onEdit={setEditTarget}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {editTarget && (
        <SettingModal
          initial={editTarget === 'new' ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(form) => saveMutation.mutate(form)}
          isSaving={saveMutation.isPending}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.key)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
