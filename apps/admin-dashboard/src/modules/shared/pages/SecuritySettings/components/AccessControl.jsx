/**
 * AccessControl.jsx
 * Tab 2 — Access Control: limit devices and IPs for admins/clients.
 */
import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

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
 * ToggleRow — a labelled toggle switch row with description.
 */
function ToggleRow({ label, tip, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-800 last:border-0">
      <div className="flex-1">
        <div className="flex items-center text-sm font-medium text-gray-200">
          {label}
          <Tip text={tip} />
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
          checked ? 'bg-blue-600' : 'bg-gray-600'
        }`}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

/**
 * NumberField — compact inline number input for access control.
 */
function NumberField({ label, tip, value, hint, min = 1, max = 99, onChange }) {
  return (
    <div className="py-4 border-b border-gray-800 last:border-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center text-sm font-medium text-gray-200">
            {label}
            <Tip text={tip} />
          </div>
          {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            value={value ?? ''}
            onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
            className="w-20 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 text-center"
          />
          <span className="text-xs text-gray-500 w-6">lần</span>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ settings: import('../types').SecuritySettings,
 *           onChange: (path:string, value:any)=>void }} props
 */
export default function AccessControl({ settings, onChange }) {
  const ac  = settings.access_control;
  const set = (field, val) => onChange(`access_control.${field}`, val);

  return (
    <div className="space-y-6">

      {/* Warning banner */}
      <div className="flex gap-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-4 py-3 text-sm text-yellow-300">
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-yellow-400" />
        <span>
          Các thiết lập này kiểm soát chặt chẽ ai có thể truy cập vào hệ thống và Admin Panel.
          Thay đổi cẩn thận để tránh tự khóa mình ra ngoài.
        </span>
      </div>

      {/* Admin Panel section */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gray-800/60 px-5 py-2.5 border-b border-gray-800">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin Panel</span>
        </div>
        <div className="px-5">
          <NumberField
            label="Khóa IP truy cập trái phép Admin Panel"
            tip="Khóa IP nếu cố truy cập sai đường dẫn Admin Panel quá nhiều lần trong 15 phút."
            value={ac.max_admin_wrong_url_attempts}
            hint="Số lần truy cập sai URL admin trước khi block IP"
            onChange={v => set('max_admin_wrong_url_attempts', v)}
          />
          <ToggleRow
            label="Chỉ cho phép Admin đăng nhập từ 1 IP"
            tip="Khi đăng nhập từ IP mới, hệ thống tự đăng xuất phiên cũ trên IP trước đó."
            description={
              ac.admin_single_ip
                ? '⚠ Bật — Admin chỉ được đăng nhập từ 1 địa chỉ IP tại một thời điểm.'
                : 'Tắt — Admin có thể đăng nhập từ nhiều IP.'
            }
            checked={ac.admin_single_ip}
            onChange={v => set('admin_single_ip', v)}
          />
          <ToggleRow
            label="Chỉ cho phép Admin đăng nhập từ 1 thiết bị"
            tip="Khi đăng nhập từ thiết bị mới, hệ thống tự đăng xuất phiên cũ trên thiết bị trước."
            description={
              ac.admin_single_device
                ? '⚠ Bật — Admin chỉ được đăng nhập từ 1 thiết bị tại một thời điểm.'
                : 'Tắt — Admin có thể đăng nhập từ nhiều thiết bị.'
            }
            checked={ac.admin_single_device}
            onChange={v => set('admin_single_device', v)}
          />
        </div>
      </div>

      {/* Client section */}
      <div className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gray-800/60 px-5 py-2.5 border-b border-gray-800">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Người dùng (Client)</span>
        </div>
        <div className="px-5">
          <ToggleRow
            label="Chỉ cho phép Client đăng nhập từ 1 thiết bị"
            tip="Khi người dùng đăng nhập từ thiết bị mới, hệ thống tự đăng xuất phiên cũ."
            description={
              ac.client_single_device
                ? '⚠ Bật — Người dùng chỉ được đăng nhập từ 1 thiết bị tại một thời điểm.'
                : 'Tắt — Người dùng có thể đăng nhập từ nhiều thiết bị (điện thoại + máy tính).'
            }
            checked={ac.client_single_device}
            onChange={v => set('client_single_device', v)}
          />
        </div>
      </div>

    </div>
  );
}
