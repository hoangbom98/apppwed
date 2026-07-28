import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/api/trade';
import { Loader2, Eye, EyeOff, CheckCircle, TrendingUp } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params]  = useSearchParams();
  const token     = params.get('token') ?? '';

  const [form,     setForm]     = useState({ password: '', confirm: '' });
  const [showPwd,  setShowPwd]  = useState(false);
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'done'>('idle');
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!token) setError('Link đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu lại.');
  }, [token]);

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = passwordStrength();
  const strengthBg    = ['', 'var(--bn-red)', 'var(--bn-yellow)', 'var(--bn-blue)', 'var(--bn-green)'][strength];
  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (form.password !== form.confirm) { setError('Mật khẩu xác nhận không khớp'); return; }
    if (form.password.length < 8) { setError('Mật khẩu phải dài ít nhất 8 ký tự'); return; }
    setStatus('loading'); setError('');
    try {
      await resetPassword({ token, password: form.password });
      setStatus('done');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.');
      setStatus('idle');
    }
  };

  const inputStyle = {
    background: 'var(--bn-bg-elevated)',
    border:     '1px solid var(--bn-border)',
    color:      'var(--bn-text-primary)',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'var(--bn-yellow)');
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'var(--bn-border)');

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bn-bg-base)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black"
            style={{ background: 'var(--bn-yellow)', color: '#0b0e11' }}>
            <TrendingUp size={18} />
          </div>
          <span className="text-2xl font-black" style={{ color: 'var(--bn-yellow)' }}>TradePro</span>
        </div>

        {status === 'done' ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'var(--bn-green-muted)', border: '1px solid rgba(14,203,129,0.25)' }}>
              <CheckCircle size={32} style={{ color: 'var(--bn-green)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--bn-text-primary)' }}>Đặt lại thành công!</h2>
            <p className="text-sm" style={{ color: 'var(--bn-text-secondary)' }}>
              Mật khẩu của bạn đã được cập nhật. Đang chuyển đến trang đăng nhập…
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--bn-text-primary)' }}>Đặt lại mật khẩu</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--bn-text-secondary)' }}>
              Nhập mật khẩu mới cho tài khoản của bạn.
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
                  style={{ color: 'var(--bn-text-secondary)' }}>Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none transition-colors"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--bn-text-muted)' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all"
                          style={{ background: i <= strength ? strengthBg : 'var(--bn-border)' }} />
                      ))}
                    </div>
                    <p className="text-[10px]"
                      style={{ color: strength >= 3 ? 'var(--bn-green)' : strength === 2 ? 'var(--bn-yellow)' : 'var(--bn-red)' }}>
                      Độ mạnh: {strengthLabel}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--bn-text-secondary)' }}>Xác nhận mật khẩu</label>
                <input
                  type={showPwd ? 'text' : 'password'} value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required
                  placeholder="Nhập lại mật khẩu"
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
              </div>
              <button
                type="submit" disabled={status === 'loading' || !token}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 bn-btn-yellow transition-colors"
              >
                {status === 'loading'
                  ? <><Loader2 size={16} className="animate-spin" /> Đang lưu...</>
                  : 'Xác nhận mật khẩu mới'
                }
              </button>
            </form>
            <p className="text-center text-sm mt-6" style={{ color: 'var(--bn-text-muted)' }}>
              <Link to="/login" className="font-semibold" style={{ color: 'var(--bn-yellow)' }}>← Quay lại đăng nhập</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
