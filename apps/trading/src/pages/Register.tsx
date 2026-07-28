import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { register as apiRegister } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, Loader2, Check, TrendingUp } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<{
    fullName: string; email: string; phone: string;
    password: string; confirm: string; referralCode: string;
  }>({
    fullName: '', email: '', phone: '',
    password: '', confirm: '',
    referralCode: searchParams.get('ref') ?? '',
  });
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [agreed,   setAgreed]   = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Mật khẩu xác nhận không khớp'); return; }
    if (!agreed) { setError('Vui lòng đồng ý với điều khoản sử dụng'); return; }
    setLoading(true); setError('');
    try {
      await apiRegister({
        fullName:     form.fullName,
        email:        form.email,
        password:     form.password,
        phone:        form.phone || undefined,
        referralCode: form.referralCode || undefined,
      });
      await login({ email: form.email, password: form.password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally { setLoading(false); }
  };

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
  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'][strength];
  const strengthBg    = ['', 'var(--bn-red)', 'var(--bn-yellow)', 'var(--bn-blue)', 'var(--bn-green)'][strength];

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

        <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--bn-text-primary)' }}>Tạo tài khoản</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--bn-text-secondary)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--bn-yellow)' }}>Đăng nhập</Link>
        </p>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl text-sm"
            style={{ background: 'var(--bn-red-muted)', border: '1px solid rgba(246,70,93,0.25)', color: 'var(--bn-red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--bn-text-secondary)' }}>Họ và tên</label>
            <input type="text" value={form.fullName} onChange={update('fullName')} required
              placeholder="Nguyễn Văn A"
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--bn-text-secondary)' }}>Email</label>
            <input type="email" value={form.email} onChange={update('email')} required
              placeholder="email@example.com"
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--bn-text-secondary)' }}>Số điện thoại</label>
            <input type="tel" value={form.phone} onChange={update('phone')}
              placeholder="0909xxxxxx"
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--bn-text-secondary)' }}>Mật khẩu</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={update('password')} required
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
                <p className="text-[10px]" style={{ color: strength >= 3 ? 'var(--bn-green)' : strength === 2 ? 'var(--bn-yellow)' : 'var(--bn-red)' }}>
                  Độ mạnh: {strengthLabel}
                </p>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--bn-text-secondary)' }}>Xác nhận mật khẩu</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.confirm} onChange={update('confirm')} required
                placeholder="Nhập lại mật khẩu"
                className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none transition-colors"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
              {form.confirm && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: form.confirm === form.password ? 'var(--bn-green)' : 'var(--bn-red)' }}>
                  <Check size={16} />
                </div>
              )}
            </div>
          </div>

          {/* Referral code */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--bn-text-secondary)' }}>
              Mã giới thiệu <span style={{ color: 'var(--bn-text-muted)', fontWeight: 400, textTransform: 'none' }}>(tuỳ chọn)</span>
            </label>
            <input type="text" value={form.referralCode} onChange={update('referralCode')}
              placeholder="Nhập mã giới thiệu nếu có"
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors uppercase"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              className="mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                background: agreed ? 'var(--bn-yellow)' : 'transparent',
                border: `1px solid ${agreed ? 'var(--bn-yellow)' : 'var(--bn-border)'}`,
              }}
              onClick={() => setAgreed(!agreed)}
            >
              {agreed && <Check size={10} color="#0b0e11" />}
            </div>
            <span className="text-xs" style={{ color: 'var(--bn-text-secondary)' }}>
              Tôi đồng ý với{' '}
              <span style={{ color: 'var(--bn-yellow)' }}>Điều khoản sử dụng</span> và{' '}
              <span style={{ color: 'var(--bn-yellow)' }}>Chính sách bảo mật</span> của TradePro
            </span>
          </label>

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 bn-btn-yellow transition-colors"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Đang tạo tài khoản...</>
              : 'Tạo tài khoản miễn phí'
            }
          </button>
        </form>
      </div>
    </div>
  );
}
