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
    mutationFn: () => api.put('/trade/auth/password', { currentPassword: pwdForm.current, newPassword: pwdForm.next }).then(r => r.data),
    onSuccess: () => {
      setMsg('OK Đổi mật khẩu thành công!');
      setPwdForm({ current: '', next: '', confirm: '' });
      setShowChangePwd(false);
    },
    onError: (e: any) => setMsg(e.response?.data?.message || 'ERR Đổi mật khẩu thất bại'),
  });

  const handleChangePwd = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.next !== pwdForm.confirm) { setMsg('ERR Mật khẩu xác nhận không khớp'); return; }
    if (pwdForm.next.length < 8) { setMsg('ERR Mật khẩu phải dài tối thiểu 8 ký tự'); return; }
    setMsg('');
    changePwdMut.mutate();
  };

  const kycStatus = (user as any)?.kycStatus ?? 'none';
  const kycBadge = kycStatus === 'verified'
    ? <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--bn-green)' }}><CheckCircle size={12} />Đã xác minh</span>
    : kycStatus === 'pending_review'
    ? <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--bn-yellow)' }}><AlertTriangle size={12} />Đang xét duyệt</span>
    : <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--bn-text-muted)' }}>Chưa xác minh</span>;

  const inputStyle = {
    background: 'var(--bn-bg-elevated)',
    border:     '1px solid var(--bn-border)',
    color:      'var(--bn-text-primary)',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/profile"
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--bn-text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--bn-text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--bn-text-secondary)')}>
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--bn-text-primary)' }}>Cài đặt &amp; Bảo mật</h1>
          <p className="text-xs" style={{ color: 'var(--bn-text-secondary)' }}>Quản lý tài khoản và bảo mật</p>
        </div>
      </div>

      {/* Security status */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-yellow-border)' }}>
        <div className="flex items-center gap-3 mb-3">
          <Shield size={18} style={{ color: 'var(--bn-yellow)' }} />
          <span className="font-semibold" style={{ color: 'var(--bn-text-primary)' }}>Trạng thái bảo mật</span>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Xác minh email',        ok: !!(user as any)?.email },
            { label: 'Xác minh KYC',          ok: kycStatus === 'verified' },
            { label: 'Xác thực 2 bước (2FA)', ok: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--bn-text-secondary)' }}>{item.label}</span>
              {item.ok
                ? <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--bn-green)' }}><CheckCircle size={12} />Đã bật</span>
                : <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--bn-text-muted)' }}><AlertTriangle size={12} />Chưa bật</span>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Account */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
          style={{ color: 'var(--bn-text-muted)' }}>Tài khoản</h2>
        <div className="rounded-2xl divide-y" style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)', borderColor: 'var(--bn-border)' }}>
          <Link to="/kyc"
            className="flex items-center justify-between px-4 py-3.5 transition-colors"
            style={{ color: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bn-bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bn-bg-elevated)' }}>
                <Shield size={15} style={{ color: 'var(--bn-yellow)' }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--bn-text-primary)' }}>Xác minh KYC</p>
                <div className="mt-0.5">{kycBadge}</div>
              </div>
            </div>
            <ChevronRight size={15} style={{ color: 'var(--bn-text-muted)' }} />
          </Link>

          <Link to="/2fa"
            className="flex items-center justify-between px-4 py-3.5 transition-colors"
            style={{ color: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bn-bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bn-bg-elevated)' }}>
                <Smartphone size={15} style={{ color: 'var(--bn-blue)' }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--bn-text-primary)' }}>Xác thực 2 bước (2FA)</p>
                <p className="text-[10px]" style={{ color: 'var(--bn-text-muted)' }}>Google Authenticator</p>
              </div>
            </div>
            <ChevronRight size={15} style={{ color: 'var(--bn-text-muted)' }} />
          </Link>

          <button
            onClick={() => setShowChangePwd(!showChangePwd)}
            className="w-full flex items-center justify-between px-4 py-3.5 transition-colors"
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bn-bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bn-bg-elevated)' }}>
                <Key size={15} style={{ color: 'var(--bn-yellow)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--bn-text-primary)' }}>Đổi mật khẩu</p>
            </div>
            <ChevronRight size={15} style={{ color: 'var(--bn-text-muted)', transform: showChangePwd ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>

          {showChangePwd && (
            <form onSubmit={handleChangePwd} className="px-4 pb-4 space-y-3 pt-4"
              style={{ borderTop: '1px solid var(--bn-border)' }}>
              {(['current', 'next', 'confirm'] as const).map(k => (
                <div key={k} className="relative">
                  <label className="block text-xs mb-1" style={{ color: 'var(--bn-text-muted)' }}>
                    {k === 'current' ? 'Mật khẩu hiện tại' : k === 'next' ? 'Mật khẩu mới' : 'Xác nhận mật khẩu mới'}
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwdForm[k]}
                    onChange={e => setPwdForm(p => ({ ...p, [k]: e.target.value }))}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none pr-10 transition-colors"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--bn-yellow)')}
                    onBlur={e  => (e.currentTarget.style.borderColor = 'var(--bn-border)')}
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 bottom-2.5" style={{ color: 'var(--bn-text-muted)' }}>
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              ))}
              {msg && (
                <p className="text-xs p-2.5 rounded-xl"
                  style={{
                    background: msg.startsWith('OK') ? 'var(--bn-green-muted)' : 'var(--bn-red-muted)',
                    color: msg.startsWith('OK') ? 'var(--bn-green)' : 'var(--bn-red)',
                  }}>
                  {msg.replace(/^(OK|ERR) /, '')}
                </p>
              )}
              <button type="submit" disabled={changePwdMut.isPending}
                className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors bn-btn-yellow">
                {changePwdMut.isPending ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
          style={{ color: 'var(--bn-text-muted)' }}>Thông báo</h2>
        <div className="rounded-2xl divide-y" style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
          {[
            { key: 'notifications',  label: 'Thông báo giao dịch',    icon: Bell },
            { key: 'emailAlerts',    label: 'Cảnh báo qua email',     icon: Bell },
            { key: 'tradingAlerts',  label: 'Cảnh báo biến động giá', icon: Bell },
          ].map(({ key, label, icon: Icon }) => {
            const isOn = prefs[key as keyof typeof prefs];
            return (
              <div key={key} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--bn-bg-elevated)' }}>
                    <Icon size={15} style={{ color: 'var(--bn-text-secondary)' }} />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--bn-text-primary)' }}>{label}</p>
                </div>
                <button
                  onClick={() => toggle(key as keyof typeof prefs)}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ background: isOn ? 'var(--bn-yellow)' : 'var(--bn-border)' }}
                >
                  <span
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    style={{ transform: isOn ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-colors"
        style={{ background: 'var(--bn-red-muted)', border: '1px solid rgba(246,70,93,0.25)', color: 'var(--bn-red)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(246,70,93,0.18)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--bn-red-muted)')}
      >
        <LogOut size={15} /> Đăng xuất khỏi tài khoản
      </button>

      <p className="text-center text-[10px]" style={{ color: 'var(--bn-text-muted)' }}>
        TradePro v1.0.0 · Giao dịch có trách nhiệm
      </p>
    </div>
  );
}
