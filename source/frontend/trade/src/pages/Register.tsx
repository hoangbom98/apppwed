import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ fullName:'', email:'', phone:'', password:'', confirm:'' });
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
      await apiRegister({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password });
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
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strength];

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white">T</div>
          <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">TradePro</span>
        </div>

        <h2 className="text-2xl font-black text-white mb-1">Tạo tài khoản</h2>
        <p className="text-gray-400 text-sm mb-6">Đã có tài khoản? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">Đăng nhập</Link></p>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950 border border-red-900 text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Họ và tên</label>
            <input type="text" value={form.fullName} onChange={update('fullName')} required placeholder="Nguyễn Văn A"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
            <input type="email" value={form.email} onChange={update('email')} required placeholder="email@example.com"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Số điện thoại</label>
            <input type="tel" value={form.phone} onChange={update('phone')} placeholder="0909xxxxxx"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mật khẩu</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={update('password')} required
                placeholder="Tối thiểu 8 ký tự"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-800'}`} />
                  ))}
                </div>
                <p className={`text-[10px] ${strength >= 3 ? 'text-green-400' : strength === 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                  Độ mạnh: {strengthLabel}
                </p>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Xác nhận mật khẩu</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.confirm} onChange={update('confirm')} required
                placeholder="Nhập lại mật khẩu"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {form.confirm && (
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 ${form.confirm === form.password ? 'text-green-400' : 'text-red-400'}`}>
                  <Check size={16} />
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${agreed ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-600'}`}
              onClick={() => setAgreed(!agreed)}>
              {agreed && <Check size={10} className="text-white" />}
            </div>
            <span className="text-xs text-gray-400">
              Tôi đồng ý với <span className="text-blue-400">Điều khoản sử dụng</span> và <span className="text-blue-400">Chính sách bảo mật</span> của TradePro
            </span>
          </label>

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Đang tạo tài khoản...</> : 'Tạo tài khoản miễn phí'}
          </button>
        </form>
      </div>
    </div>
  );
}
