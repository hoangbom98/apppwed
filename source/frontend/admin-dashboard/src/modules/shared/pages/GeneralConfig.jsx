/**
 * GeneralConfig.jsx
 * Admin page for managing per-project UI / branding / social / feature configurations.
 * Route: /config/general
 *
 * Features:
 * - Select project (hub, game, trade, dating, sports)
 * - Groups configs by module + group in collapsible sections
 * - Renders type-appropriate inputs (text, number, boolean toggle, image URL)
 * - Bulk save with a single PUT /admin/ui-config
 * - Inline cache bust after save
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

const PROJECTS = [
  { code: 'hub',    label: 'Hub Portal' },
  { code: 'game',   label: 'Game Center' },
  { code: 'trade',  label: 'Trade Pro' },
  { code: 'dating', label: 'VietDating' },
  { code: 'sports', label: 'Sports Live' },
];

const MODULE_LABELS = {
  general: 'Giao diện & Thương hiệu',
  social:  'Mạng xã hội & Liên hệ',
  feature: 'Tính năng',
};

const GROUP_LABELS = {
  brand:   'Thương hiệu',
  colors:  'Màu sắc',
  social:  'Mạng xã hội',
  feature: 'Tính năng',
};

// ── Type-aware input ───────────────────────────────────────────────────────────
function ConfigInput({ item, value, onChange }) {
  const cls = 'w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500';

  if (item.type === 'boolean') {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    );
  }

  if (item.type === 'image') {
    return (
      <div className="space-y-1">
        <input
          type="text"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="URL hoặc đường dẫn ảnh"
          className={cls}
        />
        {value && (
          <img
            src={value}
            alt="preview"
            className="h-12 w-auto object-contain rounded border border-gray-700"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>
    );
  }

  if (item.type === 'number') {
    return (
      <input
        type="number"
        value={value ?? ''}
        onChange={e => onChange(Number(e.target.value))}
        className={cls}
      />
    );
  }

  // Default: string / text
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className={cls}
    />
  );
}

// ── Section card ───────────────────────────────────────────────────────────────
function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-800 text-left"
      >
        <span className="font-semibold text-gray-200 text-sm">{title}</span>
        <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>}
    </div>
  );
}

// ── Toast helper ───────────────────────────────────────────────────────────────
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GeneralConfig() {
  const [project, setProject] = useState('hub');
  const [changes, setChanges] = useState({});     // { key: newValue }
  const [toast,   setToast]   = useState(null);
  const qc = useQueryClient();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch all UI configs for selected project ──────────────────────────────
  const { data: configs = [], isLoading, isError } = useQuery({
    queryKey: ['uiConfig', project],
    queryFn:  () =>
      api.get('/admin/ui-config', { params: { project } }).then(r => r.data?.data ?? r.data ?? []),
    onError:  () => showToast('Không thể tải cấu hình', 'error'),
  });

  // ── Group by module → group ────────────────────────────────────────────────
  const sections = useMemo(() => {
    const map = {};
    (configs ?? []).filter(c => c.editable !== false).forEach(c => {
      const key = `${c.module}||${c.group}`;
      if (!map[key]) map[key] = { module: c.module, group: c.group, items: [] };
      map[key].items.push(c);
    });
    return Object.values(map);
  }, [configs]);

  // ── Effective value for each config ───────────────────────────────────────
  const valueOf = (item) => {
    const changed = changes[item.id];
    return changed !== undefined ? changed : item.value;
  };

  const handleChange = (item, val) => {
    setChanges(prev => ({ ...prev, [item.id]: val }));
  };

  // ── Bulk save ─────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => {
      const updatedIds = Object.keys(changes);
      if (!updatedIds.length) return Promise.resolve();
      const items = configs.filter(c => updatedIds.includes(c.id));
      const updates = items.map(c => ({
        module: c.module,
        group:  c.group,
        key:    c.key,
        value:  changes[c.id],
        type:   c.type,
      }));
      return api.put('/admin/ui-config', { project, updates });
    },
    onSuccess: () => {
      setChanges({});
      qc.invalidateQueries({ queryKey: ['uiConfig', project] });
      showToast('Đã lưu cấu hình thành công');
    },
    onError: (err) => showToast(err?.response?.data?.message || 'Lỗi khi lưu', 'error'),
  });

  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className="space-y-6">
      {/* Page title + project selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Cấu hình giao diện</h1>
          <p className="text-sm text-gray-400 mt-0.5">Thay đổi thương hiệu, màu sắc, liên hệ theo dự án</p>
        </div>
        <div className="sm:ml-auto flex gap-2 flex-wrap">
          {PROJECTS.map(p => (
            <button
              key={p.code}
              type="button"
              onClick={() => { setProject(p.code); setChanges({}); }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                project === p.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / error states */}
      {isLoading && (
        <div className="py-16 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Đang tải cấu hình...
        </div>
      )}
      {isError && !isLoading && (
        <div className="py-16 text-center text-red-400">Không thể tải cấu hình. Kiểm tra kết nối.</div>
      )}
      {!isLoading && !isError && sections.length === 0 && (
        <div className="py-16 text-center text-gray-500">
          Chưa có cấu hình nào. Chạy seed: <code className="text-blue-400">node backend/src/prisma/seeds/ui-config.seed.js</code>
        </div>
      )}

      {/* Config sections */}
      {!isLoading && sections.map(sec => {
        const secTitle = `${MODULE_LABELS[sec.module] || sec.module} › ${GROUP_LABELS[sec.group] || sec.group}`;
        return (
          <Section key={`${sec.module}||${sec.group}`} title={secTitle}>
            {sec.items.map(item => (
              <div key={item.id} className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-300">
                  {item.description || item.key}
                  <span className="ml-1 text-[10px] text-gray-600 font-mono">[{item.key}]</span>
                </label>
                <ConfigInput
                  item={item}
                  value={valueOf(item)}
                  onChange={val => handleChange(item, val)}
                />
              </div>
            ))}
          </Section>
        );
      })}

      {/* Save bar */}
      {!isLoading && sections.length > 0 && (
        <div className={`sticky bottom-4 flex items-center gap-4 p-4 rounded-xl border transition-colors ${
          hasChanges
            ? 'bg-gray-900 border-blue-600/60'
            : 'bg-gray-900/60 border-gray-800'
        }`}>
          {hasChanges
            ? <p className="text-sm text-yellow-400 flex-1">Có <strong>{Object.keys(changes).length}</strong> thay đổi chưa lưu.</p>
            : <p className="text-sm text-gray-500 flex-1">Mọi thay đổi đã được lưu.</p>
          }
          <button
            type="button"
            onClick={() => setChanges({})}
            disabled={!hasChanges || saveMutation.isPending}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 disabled:opacity-40"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2"
          >
            {saveMutation.isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Lưu cấu hình
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
