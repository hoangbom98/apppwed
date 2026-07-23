/**
 * PaymentGateways.jsx — Admin page for managing payment gateways.
 * Route: /payment-gateways
 *
 * Features:
 * - List all gateways with status (active / inactive / maintenance)
 * - Toggle gateway on/off with one click
 * - Edit gateway config (fees, limits, name)
 * - View available (registered) adapter codes
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  active:      'bg-green-900/40 text-green-400 border-green-700',
  inactive:    'bg-gray-800 text-gray-500 border-gray-700',
  maintenance: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
};

const STATUS_LABEL = {
  active:      'Hoạt động',
  inactive:    'Tắt',
  maintenance: 'Bảo trì',
};

const TYPE_ICON = {
  bank:    '🏦',
  crypto:  '₿',
  ewallet: '📱',
  card:    '💳',
};

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-sm font-medium shadow-xl ${
      type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
    }`}>{msg}</div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditGatewayModal({ gateway, onClose, onSave, isSaving }) {
  const [form, setForm] = useState({
    name:      gateway.name      ?? '',
    status:    gateway.status    ?? 'active',
    fees:      JSON.stringify(gateway.fees    ?? {}, null, 2),
    limits:    JSON.stringify(gateway.limits  ?? {}, null, 2),
    config:    JSON.stringify(gateway.config  ?? {}, null, 2),
    sortOrder: gateway.sortOrder ?? 0,
  });
  const [jsonErr, setJsonErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    try {
      const updates = {
        name:      form.name,
        status:    form.status,
        fees:      JSON.parse(form.fees),
        limits:    JSON.parse(form.limits),
        config:    JSON.parse(form.config),
        sortOrder: Number(form.sortOrder),
      };
      setJsonErr('');
      onSave(updates);
    } catch (e) {
      setJsonErr('JSON không hợp lệ: ' + e.message);
    }
  };

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500';

  return (
    <Modal title={`Cấu hình: ${gateway.code}`} onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Tên hiển thị</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Trạng thái</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
            <option value="active">Hoạt động</option>
            <option value="inactive">Tắt</option>
            <option value="maintenance">Bảo trì</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Phí (JSON) — <code>{`{ percentage: 0.5, fixed: 0 }`}</code></label>
          <textarea rows={3} value={form.fees} onChange={e => set('fees', e.target.value)} className={`${inputCls} resize-none font-mono text-xs`} />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Giới hạn (JSON) — <code>{`{ min, max, daily }`}</code></label>
          <textarea rows={3} value={form.limits} onChange={e => set('limits', e.target.value)} className={`${inputCls} resize-none font-mono text-xs`} />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            Config (JSON) — <span className="text-yellow-400">Giá trị nhạy cảm đã được ẩn</span>
          </label>
          <textarea rows={5} value={form.config} onChange={e => set('config', e.target.value)} className={`${inputCls} resize-none font-mono text-xs`} />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Thứ tự hiển thị</label>
          <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', e.target.value)} className={inputCls} />
        </div>

        {jsonErr && <p className="text-xs text-red-400">{jsonErr}</p>}
      </div>

      <div className="flex gap-3 mt-5 pt-4 border-t border-gray-800">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700">
          Huỷ
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Lưu cấu hình
        </button>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PaymentGateways() {
  const [editing,  setEditing]  = useState(null);
  const [toast,    setToast]    = useState(null);
  const qc = useQueryClient();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch all gateways ───────────────────────────────────────────────────
  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ['adminPaymentGateways'],
    queryFn:  () => api.get('/admin/payment/gateways').then(r => r.data?.data ?? r.data ?? []),
  });

  // ── Fetch available (registered) adapter codes ───────────────────────────
  const { data: available = [] } = useQuery({
    queryKey: ['adminPaymentAvailable'],
    queryFn:  () => api.get('/admin/payment/gateways/available').then(r => r.data?.data ?? r.data ?? []),
    staleTime: Infinity,
  });

  // ── Toggle ────────────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: (code) => api.post(`/admin/payment/gateways/${code}/toggle`),
    onSuccess: (_, code) => {
      qc.invalidateQueries({ queryKey: ['adminPaymentGateways'] });
      showToast(`Đã cập nhật trạng thái gateway ${code}`);
    },
    onError: (err) => showToast(err?.response?.data?.message ?? 'Lỗi khi toggle', 'error'),
  });

  // ── Update ────────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ code, data }) => api.put(`/admin/payment/gateways/${code}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminPaymentGateways'] });
      setEditing(null);
      showToast('Đã lưu cấu hình gateway');
    },
    onError: (err) => showToast(err?.response?.data?.message ?? 'Lỗi khi lưu', 'error'),
  });

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Cổng thanh toán</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Quản lý, bật/tắt và cấu hình các cổng thanh toán
          </p>
        </div>
        <div className="sm:ml-auto">
          <span className="text-xs text-gray-500">
            Adapters đã đăng ký:{' '}
            {available.map(c => (
              <code key={c} className="ml-1 px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">{c}</code>
            ))}
          </span>
        </div>
      </div>

      {/* ── Gateway cards ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-16 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Đang tải…
        </div>
      ) : gateways.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <p className="mb-2">Chưa có gateway nào.</p>
          <p className="text-xs">
            Chạy: <code className="text-blue-400">npm run seed:payment</code>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gateways.map(gw => (
            <div
              key={gw.code}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4"
            >
              {/* Top row: icon + name + status badge */}
              <div className="flex items-start gap-3">
                <span className="text-3xl">{TYPE_ICON[gw.type] ?? '💰'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{gw.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{gw.code}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLE[gw.status] ?? STATUS_STYLE.inactive}`}>
                  {STATUS_LABEL[gw.status] ?? gw.status}
                </span>
              </div>

              {/* Fees + limits */}
              {gw.fees && (
                <p className="text-xs text-gray-400">
                  Phí: {gw.fees.percentage ?? 0}%{gw.fees.fixed ? ` + ${Number(gw.fees.fixed).toLocaleString()}₫` : ''}
                </p>
              )}
              {gw.limits && (
                <p className="text-xs text-gray-400">
                  Giới hạn: {Number(gw.limits.min ?? 0).toLocaleString()} –{' '}
                  {Number(gw.limits.max ?? 0).toLocaleString()}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-800">
                {/* Toggle */}
                <button
                  onClick={() => toggleMutation.mutate(gw.code)}
                  disabled={toggleMutation.isPending}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    gw.status === 'active'
                      ? 'bg-red-900/40 text-red-400 hover:bg-red-800/40'
                      : 'bg-green-900/40 text-green-400 hover:bg-green-800/40'
                  } disabled:opacity-40`}
                >
                  {gw.status === 'active' ? '⏸ Tắt' : '▶ Bật'}
                </button>

                {/* Config */}
                <button
                  onClick={() => setEditing(gw)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  ⚙ Cấu hình
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit modal ─────────────────────────────────────────────── */}
      {editing && (
        <EditGatewayModal
          gateway={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => updateMutation.mutate({ code: editing.code, data })}
          isSaving={updateMutation.isPending}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
