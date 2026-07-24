import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Bell, Shield, Key, Smartphone, LogOut,
  ChevronRight, CheckCircle, AlertTriangle, Eye, EyeOff,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMutation } from '@tanstack/react-query';
import api from '@/api/client';

export default function TradeSettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [prefs, setPrefs] = useState({ notifications: true, emailAlerts: true, tradingAlerts: true });
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [msg, setMsg] = useState('');

  const toggle = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const changePwdMut = useMutation({
    mutationFn: () => api.put('/trade/auth/password', { currentPassword: pwdForm.current, newPassword: pwdForm.next }),
    onSuccess: () => {
      setMsg('✅ Đổi mật khẩu thành công!');
      setPwdForm({ current: '', next: '', confirm: '' });
      setShowChangePwd(false);
    },
    onError: (e: any) => setMsg(e.response?.data?.message || '❌ Đổi mật khẩu thất bại'),
  });

  const handleChangePwd = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.next !== pwdForm.confirm) { setMsg('❌ Mật khẩu xác nhận không khớp'); return; }
    if (pwdForm.next.length < 8) { setMsg('❌ Mật khẩu phải dài tối thiểu 8 ký tự'); return; }
    setMsg('');
    changePwdMut.mutate();
  };

  const kycStatus = (user as any)?.kycStatus ?? 'none';
  const kycBadge = kycStatus === 'verified'
    ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={12} />Đã xác minh</span>
    : kycStatus === 'pending_review'
    ? <span className="flex items-center gap-1 text-yellow-400 text-xs"><AlertTriangle size={12} />Đang xét duyệt</span>
    : <span className="flex items-center gap-1 text-gray-400 text-xs">Chưa xác minh</span>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/profile" className="p-1.5 text-gray-400 hover:text-white rounded-lg">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Cài đặt & Bảo mật</h1>
          <p className="text-xs text-gray-400">Quản lý tài khoản và bảo mật</p>
        </div>
      </div>

      {/* Security status */}
      <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Shield size={18} className="text-blue-400" />
          <span className="font-semibold text-white">Trạng thái bảo mật</span>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Xác minh email', ok: !!(user as any)?.email },
            { label: 'Xác minh KYC',  ok: kycStatus === 'verified' },
            { label: 'Xác thực 2 bước (2FA)', ok: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{item.label}</span>
              {item.ok
                ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={12} />Đã bật</span>
                : <span className="flex items-center gap-1 text-gray-500 text-xs"><AlertTriangle size={12} />Chưa bật</span>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Account */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Tài khoản</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800/60">
          <Link to="/kyc" className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-800/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center">
                <Shield size={15} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white">Xác minh KYC</p>
                <div className="mt-0.5">{kycBadge}</div>
              </div>
            </div>
            <ChevronRight size={15} className="text-gray-500" />
          </Link>

          <Link to="/2fa" className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-800/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center">
                <Smartphone size={15} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-white">Xác thực 2 bước (2FA)</p>
                <p className="text-[10px] text-gray-500">Google Authenticator</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-gray-500" />
          </Link>

          <button
            onClick={() => setShowChangePwd(!showChangePwd)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center">
                <Key size={15} className="text-yellow-400" />
              </div>
              <p className="text-sm text-white">Đổi mật khẩu</p>
            </div>
            <ChevronRight size={`15`} className={`text-gray-500 transition-transform ${showChangePwd ? 'rotate-90' : ''}`} />
          </button>

          {showChangePwd && (
            <form onSubmit={handleChangePwd} className="px-4 pb-4 space-y-3 border-t border-gray-800/60 pt-4">
              {(['current', 'next', 'confirm'] as const).map(k => (
                <div key={k} className="relative">
                  <label className="block text-xs text-gray-500 mb-1">
                    {k === 'current' ? 'Mật khẩu hiện tại' : k === 'next' ? 'Mật khẩu mới' : 'Xác nhận mật khẩu mới'}
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwdForm[k]}
                    onChange={e => setPwdForm(p => ({ ...p, [k]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 bottom-2.5 text-gray-500 hover:text-gray-300">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              ))}
              {msg && (
                <p className={`text-xs p-2.5 rounded-xl ${msg.startsWith('✅') ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>{msg}</p>
              )}
              <button type="submit" disabled={changePwdMut.isPending}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50 transition-colors">
                {changePwdMut.isPending ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Thông báo</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800/60">
          {[
            { key: 'notifications',  label: 'Thông báo giao dịch', icon: Bell },
            { key: 'emailAlerts',    label: 'Cảnh báo qua email',  icon: Bell },
            { key: 'tradingAlerts',  label: 'Cảnh báo biến động giá', icon: Bell },
          ].map(({ key, label, icon: Icon }) => {
            const isOn = prefs[key as keyof typeof prefs];
            return (
              <div key={key} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center">
                    <Icon size={15} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-white">{label}</p>
                </div>
                <button onClick={() => toggle(key as keyof typeof prefs)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isOn ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="w-full flex items-center justify-center gap-2 py-3 bg-red-900/20 border border-red-900/30 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-2xl text-sm font-medium transition-colors"
      >
        <LogOut size={15} /> Đăng xuất khỏi tài khoản
      </button>

      <p className="text-center text-[10px] text-gray-600">TradePro v1.0.0 · Giao dịch có trách nhiệm</p>
    </div>
  );
}
