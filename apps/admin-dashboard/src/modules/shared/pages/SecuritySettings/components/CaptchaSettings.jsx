/**
 * CaptchaSettings.jsx
 * Tab 3 — Captcha configuration: enable/disable, provider, keys, modules.
 */
import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, Loader2, ExternalLink, Check, X } from 'lucide-react';
import { CAPTCHA_TYPES } from '../types';
import { securityApi } from '../security.api';

function Tip({ text }) {
  return (
    <span className="relative group inline-flex items-center ml-1.5 cursor-help">
      <HelpCircle size={13} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
      <span className="absolute left-5 top-0 z-20 hidden group-hover:block w-64 bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2 shadow-xl leading-relaxed pointer-events-none">
        {text}
      </span>
    </span>
  );
}

// ── Captcha module pill ───────────────────────────────────────────────────────
function ModulePill({ module, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(module.id, !module.enabled)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        module.enabled
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {module.enabled
        ? <Check size={11} strokeWidth={3} />
        : <X size={11} strokeWidth={3} />
      }
      {module.label}
    </button>
  );
}

/**
 * @param {{ settings: import('../types').SecuritySettings,
 *           onChange: (path:string, value:any)=>void }} props
 */
export default function CaptchaSettings({ settings, onChange }) {
  const cap = settings.captcha;
  const set = (field, val) => onChange(`captcha.${field}`, val);

  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState(null); // null | {success, message}

  const handleModuleToggle = (id, enabled) => {
    const modules = cap.modules.map(m => m.id === id ? { ...m, enabled } : m);
    set('modules', modules);
  };

  const enabledCount = cap.modules.filter(m => m.enabled).length;

  const handleTest = async () => {
    if (!cap.site_key || !cap.secret_key) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await securityApi.testCaptcha(cap.site_key, cap.secret_key, cap.type);
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Lỗi kết nối API' });
    } finally {
      setTesting(false);
    }
  };

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500';

  return (
    <div className="space-y-6">

      {/* Help link */}
      <div className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
        <ExternalLink size={14} />
        <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer">
          Xem hướng dẫn chi tiết cấu hình reCAPTCHA
        </a>
      </div>

      {/* Enable + provider row */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gray-800/60 px-5 py-2.5 border-b border-gray-800">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cấu hình chung</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* Status toggle */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">Trạng thái</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('status', !cap.status)}
                className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 ${
                  cap.status ? 'bg-blue-600' : 'bg-gray-600'
                }`}
                aria-checked={cap.status}
                role="switch"
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                  cap.status ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <span className={`text-xs font-medium ${cap.status ? 'text-green-400' : 'text-gray-500'}`}>
                {cap.status ? 'Đang bật' : 'Đang tắt'}
              </span>
            </div>
          </div>

          {/* Provider select */}
          <div className="space-y-2">
            <label className="flex items-center text-xs font-medium text-gray-300">
              Loại Captcha
              <Tip text="Chọn nhà cung cấp, sau đó điền Site Key và Secret Key tương ứng." />
            </label>
            <select
              value={cap.type}
              onChange={e => set('type', e.target.value)}
              className={inputCls}
            >
              {CAPTCHA_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Test connection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">Kiểm tra kết nối</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !cap.site_key || !cap.secret_key}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {testing && <Loader2 size={12} className="animate-spin" />}
                {testing ? 'Đang test...' : 'Test kết nối'}
              </button>

              {testResult && (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                  testResult.success
                    ? 'bg-green-900/40 text-green-400 border border-green-700/40'
                    : 'bg-red-900/40 text-red-400 border border-red-700/40'
                }`}>
                  {testResult.success
                    ? <CheckCircle size={11} />
                    : <XCircle size={11} />
                  }
                  {testResult.message}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keys */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gray-800/60 px-5 py-2.5 border-b border-gray-800">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">API Keys</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="flex items-center text-xs font-medium text-gray-300">
              Site Key
              <Tip text="Site Key từ nhà cung cấp Captcha, hiển thị trên frontend." />
            </label>
            <input
              type="text"
              placeholder="Nhập Site Key..."
              value={cap.site_key}
              onChange={e => set('site_key', e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center text-xs font-medium text-gray-300">
              Secret Key
              <Tip text="Secret Key từ nhà cung cấp Captcha. Giữ bí mật, không chia sẻ." />
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Nhập Secret Key..."
                value={cap.secret_key}
                onChange={e => set('secret_key', e.target.value)}
                className={inputCls}
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Module selection */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gray-800/60 px-5 py-2.5 border-b border-gray-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Module áp dụng Captcha</span>
          <span className="text-xs text-gray-500">{enabledCount} / {cap.modules.length} được chọn</span>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {cap.modules.map(m => (
              <ModulePill key={m.id} module={m} onToggle={handleModuleToggle} />
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Những module được chọn sẽ yêu cầu xác thực Captcha khi người dùng submit form.
          </p>
          {enabledCount === 0 && (
            <p className="text-xs text-yellow-500">
              ⚠ Chưa có module nào được chọn — Captcha sẽ không áp dụng dù đã bật.
            </p>
          )}
          {/* Quick select buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => set('modules', cap.modules.map(m => ({ ...m, enabled: true })))}
              className="text-xs px-3 py-1 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Chọn tất cả
            </button>
            <button
              type="button"
              onClick={() => set('modules', cap.modules.map(m => ({ ...m, enabled: false })))}
              className="text-xs px-3 py-1 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
