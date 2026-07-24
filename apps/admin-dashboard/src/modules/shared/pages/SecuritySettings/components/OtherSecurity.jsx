/**
 * OtherSecurity.jsx
 * Tab 4 — Other security settings: admin path, session lifetime,
 *          cron secret, strong password policy, account limits.
 */
import React, { useState } from 'react';
import { HelpCircle, Link, Key, Clock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

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

function ToggleRow({ label, tip, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-800 last:border-0">
      <div className="flex-1">
        <div className="flex items-center text-sm font-medium text-gray-200">
          {label}
          <Tip text={tip} />
        </div>
        {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 ${
          checked ? 'bg-blue-600' : 'bg-gray-600'
        }`}
        aria-checked={checked}
        role="switch"
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}

/** Format seconds as human-readable (e.g. 3600 → "1 giờ") */
function formatDuration(secs) {
  if (!secs) return '';
  if (secs < 3600) return `${secs} giây`;
  if (secs < 86400) return `${(secs / 3600).toFixed(1).replace('.0', '')} giờ`;
  return `${(secs / 86400).toFixed(1).replace('.0', '')} ngày`;
}

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500';

/**
 * @param {{ settings: import('../types').SecuritySettings,
 *           onChange: (path:string, value:any)=>void }} props
 */
export default function OtherSecurity({ settings, onChange }) {
  const other = settings.other;
  const set   = (field, val) => onChange(`other.${field}`, val);
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="space-y-6">

      {/* Admin Panel Path */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gray-800/60 px-5 py-2.5 border-b border-gray-800">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <Link size={12} />
            Admin Panel
          </span>
        </div>
        <div className="p-5 space-y-5">

          <div className="space-y-1.5">
            <label className="flex items-center text-xs font-medium text-gray-300">
              Đường dẫn Admin Panel
              <Tip text="Bảo mật đường dẫn vào Admin Panel. Hãy lưu lại URL này để truy cập sau." />
            </label>
            <div className="flex items-stretch gap-0">
              <span className="inline-flex items-center px-3 bg-gray-700 border border-r-0 border-gray-600 rounded-l text-xs text-gray-400 whitespace-nowrap">
                /admin?module=
              </span>
              <input
                type="text"
                value={other.admin_panel_path}
                onChange={e => set('admin_panel_path', e.target.value)}
                placeholder="adcp"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-r px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 min-w-0"
              />
            </div>
            <p className="text-xs text-gray-500">
              Lưu lại đường dẫn này. Sau khi thay đổi, trang khách sẽ không hiển thị nút Admin.
            </p>
          </div>

          <ToggleRow
            label="Hiển thị nút truy cập Admin Panel"
            tip="Bật/Tắt hiển thị nút truy cập Admin Panel trên trang khách."
            description={
              other.show_admin_login_button
                ? 'Bật — Nút Admin đang hiển thị trên trang khách.'
                : 'Tắt — Nút Admin bị ẩn, chỉ truy cập qua đường dẫn trực tiếp.'
            }
            checked={other.show_admin_login_button}
            onChange={v => set('show_admin_login_button', v)}
          />
        </div>
      </div>

      {/* Account limits & session */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gray-800/60 px-5 py-2.5 border-b border-gray-800">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <Clock size={12} />
            Giới hạn & Phiên đăng nhập
          </span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">

          <div className="space-y-1.5">
            <label className="flex items-center text-xs font-medium text-gray-300">
              Số tài khoản tối đa mỗi IP
              <Tip text="1 địa chỉ IP chỉ được phép đăng ký tối đa N tài khoản." />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={999}
                value={other.max_accounts_per_ip ?? ''}
                onChange={e => set('max_accounts_per_ip', Number(e.target.value))}
                className="w-28 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 text-center"
              />
              <span className="text-xs text-gray-500">tài khoản</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center text-xs font-medium text-gray-300">
              Thời gian lưu đăng nhập
              <Tip text="Thời gian tồn tại phiên đăng nhập (giây). Ví dụ: 86400 = 24 giờ, 3600 = 1 giờ." />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={60}
                step={3600}
                value={other.session_lifetime ?? ''}
                onChange={e => set('session_lifetime', Number(e.target.value))}
                className="w-36 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 text-center"
              />
              <span className="text-xs text-gray-500">
                giây
                {other.session_lifetime > 0 && (
                  <span className="ml-1.5 text-blue-400">
                    ({formatDuration(other.session_lifetime)})
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cron Job & Password */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gray-800/60 px-5 py-2.5 border-b border-gray-800">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <Key size={12} />
            Cron Job & Mật khẩu
          </span>
        </div>
        <div className="p-5 space-y-5">

          <div className="space-y-1.5">
            <label className="flex items-center text-xs font-medium text-gray-300">
              Mã bí mật Cron Job
              <Tip text="Mã này xác thực request từ Cron Job, ngăn spam cron từ bên ngoài. Dùng chuỗi ngẫu nhiên ≥ 32 ký tự." />
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={other.cron_job_secret}
                onChange={e => set('cron_job_secret', e.target.value)}
                placeholder="Chuỗi bí mật Cron Job..."
                className={`${inputCls} pr-10`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300"
                title={showSecret ? 'Ẩn' : 'Hiện'}
              >
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-xs text-gray-500">Khuyến nghị: sử dụng chuỗi ngẫu nhiên ≥ 32 ký tự.</p>
          </div>

          <ToggleRow
            label="Bắt buộc mật khẩu phức tạp khi đăng ký"
            tip="Khi bật, người dùng không thể đăng ký với mật khẩu yếu. Phải có ≥ 8 ký tự, gồm chữ hoa, chữ thường và số."
            description={
              other.require_strong_password
                ? 'Bật — Yêu cầu mật khẩu mạnh (≥ 8 ký tự, chữ hoa + chữ thường + số).'
                : 'Tắt — Không yêu cầu độ phức tạp mật khẩu.'
            }
            checked={other.require_strong_password}
            onChange={v => set('require_strong_password', v)}
          />
        </div>
      </div>

      {/* Recommendations */}
      <div className="flex gap-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-4 py-3">
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-yellow-400" />
        <div className="text-sm text-yellow-300 space-y-1">
          <p className="font-semibold">Khuyến nghị bảo mật:</p>
          <ul className="text-xs space-y-0.5 list-disc list-inside text-yellow-400/80">
            <li>Sử dụng mã bí mật Cron Job ngẫu nhiên, ít nhất 32 ký tự</li>
            <li>Bật yêu cầu mật khẩu phức tạp để tăng bảo mật tài khoản</li>
            <li>Ẩn nút Admin Panel trên trang khách sau khi cấu hình xong</li>
            <li>Thường xuyên kiểm tra và cập nhật các thiết lập bảo mật</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
