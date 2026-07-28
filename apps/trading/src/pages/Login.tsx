import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Vui lòng nhập đầy đủ thông tin'); return; }
    setLoading(true); setError('');
    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bn-bg-base)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12"
        style={{ background: 'var(--bn-bg-surface)', borderRight: '1px solid var(--bn-border)' }}
      >
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl"
              style={{ background: 'var(--bn-yellow)', color: '#0b0e11' }}>
              <TrendingUp size={24} />
            </div>
            <span className="text-3xl font-black" style={{ color: 'var(--bn-yellow)' }}>TradePro</span>
          </div>
          <h1 className="text-4xl font-black leading-tight mb-4" style={{ color: 'var(--bn-text-primary)' }}>
            Giao dịch<br />chuyên nghiệp<br />
            <span style={{ color: 'var(--bn-yellow)' }}>mọi lúc mọi nơi</span>
          </h1>
          <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--bn-text-secondary)' }}>
            Nền tảng giao dịch tiền mã hóa hàng đầu với công nghệ AI, phân tích realtime và bảo mật cấp ngân hàng.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Cặp giao dịch', value: '500+' },
              { label: 'Người dùng',    value: '2M+' },
              { label: 'Uptime',        value: '99.9%' },
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-2xl"
                style={{ background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)' }}>
                <p className="text-2xl font-black" style={{ color: 'var(--bn-yellow)' }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--bn-text-secondary)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black"
              style={{ background: 'var(--bn-yellow)', color: '#0b0e11' }}>
              <TrendingUp size={18} />
            </div>
            <span className="text-2xl font-black" style={{ color: 'var(--bn-yellow)' }}>TradePro</span>
          </div>

          <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--bn-text-primary)' }}>Đăng nhập</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--bn-text-secondary)' }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold" style={{ color: 'var(--bn-yellow)' }}>Đăng ký miễn phí</Link>
          </p>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl text-sm"
              style={{ background: 'var(--bn-red-muted)', border: '1px solid rgba(246,70,93,0.25)', color: 'var(--bn-red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--bn-text-secondary)' }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="email@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                style={{ background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)', color: 'var(--bn-text-primary)' }}
                onFocus={e  => (e.currentTarget.style.borderColor = 'var(--bn-yellow)')}
                onBlur={e   => (e.currentTarget.style.borderColor = 'var(--bn-border)')}
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--bn-text-secondary)' }}>Mật khẩu</label>
                <Link to="/forgot-password" className="text-xs" style={{ color: 'var(--bn-yellow)' }}>Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none transition-colors"
                  style={{ background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)', color: 'var(--bn-text-primary)' }}
                  onFocus={e  => (e.currentTarget.style.borderColor = 'var(--bn-yellow)')}
                  onBlur={e   => (e.currentTarget.style.borderColor = 'var(--bn-border)')}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--bn-text-muted)' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 bn-btn-yellow transition-colors"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Đang đăng nhập...</>
                : <><TrendingUp size={16} /> Đăng nhập</>
              }
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--bn-border)' }} />
            <span className="text-xs" style={{ color: 'var(--bn-text-muted)' }}>Hoặc</span>
            <div className="flex-1 h-px" style={{ background: 'var(--bn-border)' }} />
          </div>

          <div className="mt-4">
            <button type="button"
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)', color: 'var(--bn-text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--bn-yellow-border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bn-border)')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Tiếp tục với Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
