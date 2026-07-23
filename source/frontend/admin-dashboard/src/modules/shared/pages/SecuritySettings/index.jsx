/**
 * SecuritySettings/index.jsx
 * Route: /settings/security
 *
 * System Security Settings page — tabbed layout with:
 *   Tab 1: Brute Force Protection
 *   Tab 2: Access Control
 *   Tab 3: Captcha Settings
 *   Tab 4: Other Security
 *
 * Uses TanStack Query (via useSecuritySettings hook) for server state.
 * All tab components receive `settings` and `onChange` — no Ant Design.
 */
import React, { useState } from 'react';
import {
  Shield, Save, RotateCcw, Lock, Users, Bot, Settings2,
  AlertTriangle, Loader2, Info,
} from 'lucide-react';
import { useSecuritySettings } from './hooks/useSecuritySettings';
import BruteForceProtection from './components/BruteForceProtection';
import AccessControl        from './components/AccessControl';
import CaptchaSettings      from './components/CaptchaSettings';
import OtherSecurity        from './components/OtherSecurity';

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { key: 'bruteforce', label: 'Brute Force',       icon: Lock,     component: BruteForceProtection },
  { key: 'access',     label: 'Kiểm soát truy cập', icon: Users,    component: AccessControl },
  { key: 'captcha',    label: 'Captcha',             icon: Bot,      component: CaptchaSettings },
  { key: 'other',      label: 'Bảo mật khác',        icon: Settings2,component: OtherSecurity },
];

// ── Confirm reset modal ───────────────────────────────────────────────────────
function ResetModal({ onConfirm, onCancel, isResetting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-yellow-400 flex-shrink-0" size={20} />
          <h3 className="font-bold text-white">Xác nhận Reset</h3>
        </div>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Bạn có chắc muốn reset <strong className="text-white">toàn bộ cài đặt bảo mật</strong>{' '}
          về giá trị mặc định của hệ thống? Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isResetting}
            className="flex-1 py-2.5 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 disabled:opacity-40"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={isResetting}
            className="flex-1 py-2.5 rounded-lg bg-yellow-600 text-white text-sm font-semibold hover:bg-yellow-700 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isResetting && <Loader2 size={14} className="animate-spin" />}
            {isResetting ? 'Đang reset...' : 'Reset mặc định'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-sm font-medium shadow-xl max-w-sm ${
      type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
    }`}>
      {msg}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SecuritySettingsPage() {
  const [activeTab,    setActiveTab]    = useState('bruteforce');
  const [showReset,    setShowReset]    = useState(false);
  const [toast,        setToast]        = useState(null);

  const {
    settings,
    isLoading,
    isError,
    isDirty,
    isSaving,
    isResetting,
    saveError,
    handleChange,
    save,
    discardDraft,
    resetToDefault,
  } = useSecuritySettings();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    try {
      await save();
      showToast('Đã lưu cài đặt bảo mật thành công!');
    } catch {
      showToast(saveError || 'Lưu cài đặt thất bại!', 'error');
    }
  };

  const handleReset = () => {
    resetToDefault(undefined, {
      onSuccess: () => { setShowReset(false); showToast('Đã reset cài đặt về mặc định.'); },
      onError:   () => { setShowReset(false); showToast('Reset thất bại!', 'error'); },
    });
  };

  // ── Active tab component ─────────────────────────────────────────────────
  const ActiveComponent = TABS.find(t => t.key === activeTab)?.component ?? null;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <Loader2 size={28} className="animate-spin text-blue-500" />
        <span className="text-sm">Đang tải cài đặt bảo mật...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Cài đặt bảo mật hệ thống</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Cấu hình bảo vệ chống tấn công, kiểm soát truy cập, Captcha và các tuỳ chọn bảo mật khác
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isDirty && (
            <button
              onClick={discardDraft}
              className="px-3 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 transition-colors"
            >
              Huỷ thay đổi
            </button>
          )}
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 transition-colors"
          >
            <RotateCcw size={14} />
            Reset mặc định
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving
              ? <Loader2 size={14} className="animate-spin" />
              : <Save size={14} />
            }
            {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>

      {/* API error banner */}
      {isError && (
        <div className="flex gap-3 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-sm text-red-300">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
          <span>Không thể tải cài đặt từ server. Đang hiển thị giá trị mặc định.</span>
        </div>
      )}

      {/* Unsaved changes banner */}
      {isDirty && (
        <div className="flex gap-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-4 py-3 text-sm text-yellow-300">
          <Info size={16} className="flex-shrink-0 mt-0.5 text-yellow-400" />
          <span>Bạn có thay đổi chưa được lưu. Nhấn <strong>Lưu cài đặt</strong> để áp dụng.</span>
        </div>
      )}

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {TABS.map(tab => {
          const Icon    = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      {ActiveComponent && (
        <ActiveComponent
          settings={settings}
          onChange={handleChange}
        />
      )}

      {/* ── Sticky save bar (shown when dirty) ───────────────────────────── */}
      {isDirty && (
        <div className="sticky bottom-4 z-10 flex items-center gap-4 p-4 bg-gray-900 border border-blue-600/50 rounded-xl shadow-2xl">
          <p className="flex-1 text-sm text-yellow-300">
            Bạn có thay đổi chưa lưu.
          </p>
          <button
            onClick={discardDraft}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            Lưu cài đặt
          </button>
        </div>
      )}

      {/* ── Modals & Notifications ────────────────────────────────────────── */}
      {showReset && (
        <ResetModal
          onConfirm={handleReset}
          onCancel={() => setShowReset(false)}
          isResetting={isResetting}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}

    </div>
  );
}
