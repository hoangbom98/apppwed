/**
 * ProjectConfigPanel.jsx
 *
 * Reusable admin panel for managing per-project dynamic config.
 * Renders config rows grouped by module → group in collapsible sections.
 * Supports type-aware inputs: boolean toggle, number, array (multi-select), string.
 *
 * Usage:
 *   <ProjectConfigPanel projectCode="game" moduleFilter="payment" title="Cấu hình thanh toán" />
 *   <ProjectConfigPanel projectCode="hub" />  // all modules
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

// ── Labels ─────────────────────────────────────────────────────────────────────
const MODULE_LABELS = {
  payment:      'Thanh toán',
  kyc:          'Xác minh danh tính (KYC)',
  promotion:    'Khuyến mãi',
  notification: 'Thông báo',
  general:      'Giao diện & Thương hiệu',
  system:       'Hệ thống & Bảo mật',
};

const GROUP_LABELS = {
  deposit:   'Nạp tiền',
  withdraw:  'Rút tiền',
  gateway:   'Cổng thanh toán',
  general:   'Tổng quan',
  channels:  'Kênh thông báo',
  events:    'Sự kiện thông báo',
  brand:     'Thương hiệu',
  colors:    'Màu sắc',
  social:    'Mạng xã hội',
  referral:  'Giới thiệu bạn bè',
  security:  'Bảo mật',
};

// ── Type-aware input ───────────────────────────────────────────────────────────
function ConfigInput({ item, value, onChange }) {
  const base = 'w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500';

  // Boolean toggle
  if (item.type === 'boolean') {
    const boolVal = value === true || value === 'true';
    return (
      <button
        type="button"
        onClick={() => onChange(!boolVal)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          boolVal ? 'bg-blue-600' : 'bg-gray-600'
        }`}
        aria-label={boolVal ? 'Bật' : 'Tắt'}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          boolVal ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    );
  }

  // Number
  if (item.type === 'number') {
    return (
      <input
        type="number"
        value={value ?? 0}
        onChange={e => onChange(Number(e.target.value))}
        className={base}
      />
    );
  }

  // Array multi-select (options defined in item.options)
  if (item.type === 'array' && Array.isArray(item.options) && item.options.length) {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-wrap gap-2">
        {item.options.map(opt => {
          const active = arr.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const next = active ? arr.filter(v => v !== opt) : [...arr, opt];
                onChange(next);
              }}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                active
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  // Array — no options (free text, comma-separated)
  if (item.type === 'array') {
    const arr = Array.isArray(value) ? value : [];
    return (
      <input
        type="text"
        value={arr.join(', ')}
        onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
        placeholder="Nhập giá trị cách nhau bằng dấu phẩy"
        className={base}
      />
    );
  }

  // Image URL with preview
  if (item.type === 'image') {
    return (
      <div className="space-y-1.5">
        <input
          type="text"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="URL hoặc đường dẫn ảnh"
          className={base}
        />
        {value && (
          <img
            src={value}
            alt="preview"
            className="h-10 w-auto object-contain rounded border border-gray-700 opacity-80"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>
    );
  }

  // Default: string
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className={base}
    />
  );
}

// ── Section card ───────────────────────────────────────────────────────────────
function Section({ moduleKey, groupKey, items, changes, onChangeItem, hasAnyChange }) {
  const [open, setOpen] = useState(true);
  const moduleLabel = MODULE_LABELS[moduleKey] || moduleKey;
  const groupLabel  = GROUP_LABELS[groupKey]   || groupKey;
  const dirtyCount  = items.filter(i => changes[i.id] !== undefined).length;

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-800/70 text-left hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{moduleLabel}</span>
          <span className="text-gray-600">›</span>
          <span className="font-semibold text-gray-200 text-sm">{groupLabel}</span>
          {dirtyCount > 0 && (
            <span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {dirtyCount} thay đổi
            </span>
          )}
        </div>
        <span className="text-gray-600 text-xs ml-4">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/40">
          {items.map(item => {
            const currentValue = changes[item.id] !== undefined ? changes[item.id] : item.value;
            const isDirty      = changes[item.id] !== undefined;
            return (
              <div key={item.id} className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-300">
                  <span>{item.description || item.key}</span>
                  <span className="font-mono text-[10px] text-gray-600">[{item.key}]</span>
                  {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />}
                </label>
                <ConfigInput
                  item={item}
                  value={currentValue}
                  onChange={val => onChangeItem(item.id, val)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

// ── Main component ─────────────────────────────────────────────────────────────
/**
 * @param {Object}      props
 * @param {string}      props.projectCode   – 'hub' | 'game' | 'dating' | 'trade' | 'sports'
 * @param {string|null} [props.moduleFilter] – restrict to one module (e.g. 'payment')
 * @param {string|null} [props.title]        – custom page title
 */
export default function ProjectConfigPanel({ projectCode, moduleFilter = null, title = null }) {
  const [changes, setChanges] = useState({});
  const [toast,   setToast]   = useState(null);
  const qc = useQueryClient();

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Data fetch ──────────────────────────────────────────────────────────────
  const queryParams = { project: projectCode, ...(moduleFilter && { module: moduleFilter }) };
  const { data: configs = [], isLoading, isError } = useQuery({
    queryKey: ['projectConfig', projectCode, moduleFilter],
    queryFn:  () =>
      api.get('/admin/ui-config', { params: queryParams })
         .then(r => r.data?.data ?? r.data ?? []),
  });

  // ── Group by module → group ─────────────────────────────────────────────────
  const sections = useMemo(() => {
    const map = {};
    (configs ?? [])
      .filter(c => c.editable !== false)
      .forEach(c => {
        const k = `${c.module}||${c.group}`;
        if (!map[k]) map[k] = { module: c.module, group: c.group, items: [] };
        map[k].items.push(c);
      });
    return Object.values(map);
  }, [configs]);

  const handleChange = useCallback((id, val) => {
    setChanges(prev => ({ ...prev, [id]: val }));
  }, []);

  const hasChanges = Object.keys(changes).length > 0;

  // ── Save mutation ───────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => {
      if (!hasChanges) return Promise.resolve();
      const ids = Object.keys(changes);
      const updates = configs
        .filter(c => ids.includes(c.id))
        .map(c => ({
          module:      c.module,
          group:       c.group,
          key:         c.key,
          value:       changes[c.id],
          type:        c.type,
          description: c.description,
        }));
      return api.put('/admin/ui-config', { project: projectCode, updates });
    },
    onSuccess: () => {
      setChanges({});
      qc.invalidateQueries({ queryKey: ['projectConfig', projectCode] });
      showToast('Đã lưu cấu hình thành công');
    },
    onError: (err) => showToast(err?.response?.data?.message || 'Lỗi khi lưu cấu hình', 'error'),
  });

  const pageTitle = title || `Cấu hình ${moduleFilter ? MODULE_LABELS[moduleFilter] || moduleFilter : 'dự án'}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div>
          <h2 className="text-xl font-black text-white">{pageTitle}</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">{projectCode}</p>
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div className="py-16 text-center text-gray-500">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Đang tải cấu hình...
        </div>
      )}
      {isError && !isLoading && (
        <div className="py-12 text-center text-red-400 text-sm">Không thể tải cấu hình. Kiểm tra kết nối.</div>
      )}
      {!isLoading && !isError && sections.length === 0 && (
        <div className="py-12 text-center text-gray-500 text-sm">
          Chưa có cấu hình. Chạy:{' '}
          <code className="text-blue-400 text-xs">node source/backend/prisma/seed-config.js</code>
        </div>
      )}

      {/* Sections */}
      {!isLoading && sections.map(sec => (
        <Section
          key={`${sec.module}||${sec.group}`}
          moduleKey={sec.module}
          groupKey={sec.group}
          items={sec.items}
          changes={changes}
          onChangeItem={handleChange}
          hasAnyChange={hasChanges}
        />
      ))}

      {/* Sticky save bar */}
      {!isLoading && sections.length > 0 && (
        <div className={`sticky bottom-4 flex items-center gap-3 p-4 rounded-xl border transition-colors ${
          hasChanges ? 'bg-gray-900 border-blue-600/60' : 'bg-gray-900/60 border-gray-800'
        }`}>
          {hasChanges
            ? <p className="flex-1 text-sm text-yellow-400"><strong>{Object.keys(changes).length}</strong> thay đổi chưa lưu</p>
            : <p className="flex-1 text-sm text-gray-500">Mọi thay đổi đã được lưu</p>
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

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
