// @ts-nocheck
/**
 * BruteForceProtection.jsx
 * Tab 1 — Brute Force Protection settings.
 * Renders 8 numeric threshold fields with tooltips and recommendation hints.
 */
import React from 'react';
import { Info, HelpCircle } from 'lucide-react';

// ── Reusable sub-components ──────────────────────────────────────────────────

/** Tooltip icon with hover popup */
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

/**
 * NumberField — labeled input for integer threshold values.
 * @param {{ label:string, tip:string, value:number, hint:string,
 *           min?:number, max?:number,
 *           onChange:(v:number)=>void }} props
 */
function NumberField({ label, tip, value, hint, min = 1, max = 99, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center text-xs font-medium text-gray-300">
        {label}
        <Tip text={tip} />
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value ?? ''}
          onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
          className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 text-center"
        />
        <span className="text-xs text-gray-500">lần</span>
      </div>
      {hint && <p className="text-[11px] text-gray-600">{hint}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * @param {{ settings: import('../types').SecuritySettings,
 *           onChange: (path:string, value:any)=>void }} props
 */
export default function BruteForceProtection({ settings, onChange }) {
  const bf = settings.brute_force;
  const set = (field, val) => onChange(`brute_force.${field}`, val);

  return (
    <div className="space-y-6">

      {/* Info banner */}
      <div className="flex gap-3 bg-blue-900/20 border border-blue-700/40 rounded-xl px-4 py-3 text-sm text-blue-300">
        <Info size={16} className="flex-shrink-0 mt-0.5 text-blue-400" />
        <span>
          Các thiết lập dưới đây giúp bảo vệ hệ thống khỏi tấn công Brute Force bằng cách khóa
          IP hoặc tài khoản sau khi vượt ngưỡng trong <strong>15 phút</strong>.
        </span>
      </div>

      {/* Section: Login */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gray-800/60 px-5 py-2.5 border-b border-gray-800">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Đăng nhập</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <NumberField
            label="Khóa IP nếu đăng nhập sai mật khẩu"
            tip="Khóa địa chỉ IP nếu đăng nhập sai mật khẩu quá nhiều lần trong 15 phút."
            value={bf.max_login_attempts_ip}
            hint="Khuyến nghị: ≤ 5 để bảo mật tốt nhất"
            onChange={v => set('max_login_attempts_ip', v)}
          />
          <NumberField
            label="Khóa tài khoản nếu đăng nhập sai mật khẩu"
            tip="Khóa tài khoản sau khi nhập sai mật khẩu quá nhiều lần."
            value={bf.max_login_attempts_account}
            hint="Khuyến nghị: ≤ 10 để cân bằng bảo mật và trải nghiệm"
            onChange={v => set('max_login_attempts_account', v)}
          />
        </div>
      </div>

      {/* Section: API & 2FA */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gray-800/60 px-5 py-2.5 border-b border-gray-800">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">API & Xác thực</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <NumberField
            label="Khóa IP nếu API Key sai"
            tip="Khóa IP nếu API Key sai quá nhiều lần trong 15 phút."
            value={bf.max_api_key_attempts}
            hint="Khuyến nghị: ≤ 20 lần"
            onChange={v => set('max_api_key_attempts', v)}
          />
          <NumberField
            label="Khóa IP nếu nhập sai 2FA"
            tip="Khóa IP nếu nhập sai mã 2FA quá nhiều lần trong 15 phút."
            value={bf.max_2fa_attempts}
            hint="Khuyến nghị: ≤ 10 lần"
            onChange={v => set('max_2fa_attempts', v)}
          />
          <NumberField
            label="Khóa IP nếu nhập sai OTP"
            tip="Khóa IP nếu nhập sai mã OTP quá nhiều lần trong 15 phút."
            value={bf.max_otp_attempts}
            hint="Khuyến nghị: ≤ 10 lần"
            onChange={v => set('max_otp_attempts', v)}
          />
          <NumberField
            label="Khóa IP nếu API không trong Whitelist"
            tip="Khóa IP nếu gửi quá nhiều request từ IP ngoài Whitelist API của người dùng trong 15 phút."
            value={bf.max_api_whitelist_attempts}
            hint="Khuyến nghị: ≤ 10 lần"
            onChange={v => set('max_api_whitelist_attempts', v)}
          />
        </div>
      </div>

      {/* Section: Financial */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gray-800/60 px-5 py-2.5 border-b border-gray-800">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tài chính & Mật khẩu</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <NumberField
            label="Khóa IP nếu tạo hóa đơn nạp tiền quá nhiều"
            tip="Khóa IP nếu tạo quá nhiều hóa đơn nạp tiền trong 15 phút."
            value={bf.max_invoice_attempts}
            onChange={v => set('max_invoice_attempts', v)}
          />
          <NumberField
            label="Khóa IP nếu yêu cầu khôi phục mật khẩu quá nhiều"
            tip="Khóa IP nếu gửi quá nhiều yêu cầu quên mật khẩu trong 15 phút."
            value={bf.max_forgot_password_attempts}
            onChange={v => set('max_forgot_password_attempts', v)}
          />
        </div>
      </div>

    </div>
  );
}
