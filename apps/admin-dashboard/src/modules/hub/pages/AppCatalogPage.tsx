// Quản lý App Catalog — CRUD các app được hiển thị trên trang tải app của Hub.
// Route: /app-catalog
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

// ── API helpers ────────────────────────────────────────────────────────────────
const catalogApi = {
  list:   ()        => api.get('/admin/app-catalog').then(r => r.data?.data ?? []),
  update: (id, body) => api.put(`/admin/app-catalog/${id}`, body),
  create: (body)    => api.post('/admin/app-catalog', body),
  remove: (id)      => api.delete(`/admin/app-catalog/${id}`),
};

// ── Color swatch map ───────────────────────────────────────────────────────────
const APP_META = {
  game:    { bg: 'linear-gradient(135deg,#052e16,#14532d)', label: 'Game' },
  dating:  { bg: 'linear-gradient(135deg,#500724,#831843)', label: 'Dating' },
  sports:  { bg: 'linear-gradient(135deg,#052e16,#065f46)', label: 'Sports' },
  trade:   { bg: 'linear-gradient(135deg,#172554,#1e3a8a)', label: 'Trade' },
};

// ── Toast ──────────────────────────────────────────────────────────────────────
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

// ── App card (list view) ────────────────────────────────────────────────────────
function AppCard({ app, onEdit }) {
  const meta = APP_META[app.appId] ?? { bg: '#374151', label: app.appId };
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      {/* Header gradient */}
      <div style={{ background: meta.bg }} className="px-5 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base leading-tight truncate">{app.name}</p>
          <p className="text-white/60 text-xs mt-0.5">{app.category ?? meta.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            app.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {app.isPublished ? 'Published' : 'Hidden'}
          </span>
        </div>
      </div>

      {/* Links summary */}
      <div className="px-5 py-3 space-y-1.5">
        <div className="flex items-start gap-2 text-xs">
          <span className="text-green-400 font-semibold w-20 flex-shrink-0">Android</span>
          <span className="text-gray-400 truncate flex-1 font-mono">{app.androidLink || '—'}</span>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <span className="text-blue-400 font-semibold w-20 flex-shrink-0">iOS</span>
          <span className="text-gray-400 truncate flex-1 font-mono">{app.iosLink || '—'}</span>
        </div>
        <div className="flex items-center gap-3 pt-1 text-xs text-gray-500">
          <span>{parseFloat(app.rating).toFixed(1)} sao</span>
          <span>{app.downloads ?? '—'} lượt tải</span>
          <span className="ml-auto">{app.developer ?? ''}</span>
        </div>
      </div>

      <div className="px-5 pb-4">
        <button
          onClick={() => onEdit(app)}
          className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold rounded-lg transition-colors"
        >
          Chỉnh sửa
        </button>
      </div>
    </div>
  );
}

// ── Edit modal ─────────────────────────────────────────────────────────────────
const FIELDS = [
  { key: 'name',         label: 'Tên app',            required: true },
  { key: 'developer',    label: 'Developer' },
  { key: 'category',     label: 'Category' },
  { key: 'iconUrl',      label: 'Icon URL' },
  { key: 'primaryColor', label: 'Primary Color',       placeholder: '#194C38' },
  { key: 'rating',       label: 'Rating',              type: 'number', step: '0.1', min: '0', max: '5' },
  { key: 'reviewsCount', label: 'Số đánh giá',         placeholder: '12.5 N' },
  { key: 'downloads',    label: 'Lượt tải',            placeholder: '500 N+' },
  { key: 'androidLink',  label: 'Android APK / Play Store URL', placeholder: 'https://...', wide: true },
  { key: 'iosLink',      label: 'iOS OTA / App Store URL',       placeholder: 'itms-services://...', wide: true },
  { key: 'description',  label: 'Mô tả',              type: 'textarea', wide: true },
];

function EditModal({ app, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(() => ({ ...app }));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/75 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-lg">Chỉnh sửa App</h2>
            <p className="text-gray-500 text-xs mt-0.5 font-mono">{app.appId}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 text-xl leading-none">×</button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELDS.map(f => (
            <div key={f.key} className={f.wide ? 'sm:col-span-2' : ''}>
              <label className="block text-xs text-gray-400 mb-1 font-medium">
                {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={form[f.key] ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
                />
              ) : (
                <input
                  type={f.type ?? 'text'}
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  placeholder={f.placeholder}
                  value={form[f.key] ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          ))}

          {/* Published toggle */}
          <div className="sm:col-span-2 flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => set('isPublished', !form.isPublished)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isPublished ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isPublished ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-gray-300">
              {form.isPublished ? 'Published — hiển thị trên trang tải app' : 'Hidden — ẩn khỏi trang tải app'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={() => onSave(form)}
            disabled={isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AppCatalogPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['adminAppCatalog'],
    queryFn:  catalogApi.list,
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, body }) => catalogApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminAppCatalog'] });
      setEditing(null);
      showToast('Đã lưu thông tin app');
    },
    onError: (err) => showToast(err?.response?.data?.message || 'Lỗi khi lưu', 'error'),
  });

  const handleSave = (form) => {
    saveMutation.mutate({ id: form.id, body: form });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">App Catalog</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Quản lý thông tin và link tải của các ứng dụng hiển thị trên trang phân phối app
          </p>
        </div>
        <div className="flex-shrink-0 text-xs text-gray-500 bg-gray-800 px-3 py-1.5 rounded-lg">
          API: <code className="text-blue-400">GET /api/hub/app-catalog</code>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-950/50 border border-blue-800 rounded-xl px-5 py-3 text-xs text-blue-300">
        Thay đổi tại đây sẽ ngay lập tức hiển thị trên trang <strong>/download</strong> của Hub.
        Hub DownloadPage tự động fetch từ <code className="font-mono">/api/hub/app-catalog</code> và fallback về env vars nếu API lỗi.
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="py-20 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Đang tải danh sách app...
        </div>
      )}

      {/* App grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {apps.map(app => (
            <AppCard key={app.id} app={app} onEdit={setEditing} />
          ))}
          {apps.length === 0 && (
            <div className="md:col-span-2 py-16 text-center text-gray-500">
              <p className="text-3xl mb-4 text-gray-600">—</p>
              <p className="font-semibold">Chưa có app nào trong catalog</p>
              <p className="text-sm mt-1">Chạy <code className="font-mono text-blue-400">npm run seed:ui-config</code> để thêm dữ liệu mẫu</p>
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal
          app={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          isSaving={saveMutation.isPending}
        />
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}
