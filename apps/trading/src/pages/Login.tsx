import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleOutlined, SendOutlined } from '@ant-design/icons';

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
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg">T</div>
            <span className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">TradePro</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Giao dịch<br />chuyên nghiệp<br />
            <span className="text-blue-400">mọi lúc mọi nơi</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-8">
            Nền tảng giao dịch tiền mã hóa hàng đầu với công nghệ AI, phân tích realtime và bảo mật cấp ngân hàng.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Cặp giao dịch', value: '500+' },
              { label: 'Người dùng',    value: '2M+' },
              { label: 'Uptime',        value: '99.9%' },
            ].map(s => (
              <div key={s.label} className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-2xl font-black text-blue-400">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white">T</div>
            <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">TradePro</span>
          </div>

          <h2 className="text-2xl font-black text-white mb-1">Đăng nhập</h2>
          <p className="text-gray-400 text-sm mb-8">Chưa có tài khoản? <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold">Đăng ký miễn phí</Link></p>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950 border border-red-900 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="email@example.com"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mật khẩu</label>
                <button type="button" className="text-xs text-blue-400 hover:text-blue-300">Quên mật khẩu?</button>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Đang đăng nhập...</> : <>
                <TrendingUp size={16} /> Đăng nhập
              </>}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600">Hoặc</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <div className="mt-4 space-y-2.5">
            <button className="w-full flex items-center justify-center gap-3 py-3 bg-gray-900 border border-gray-800 hover:border-red-700/50 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all">
              <GoogleOutlined className="text-base" />Tiếp tục với Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 py-3 bg-gray-900 border border-gray-800 hover:border-blue-700/50 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all">
              <SendOutlined className="text-base" />Tiếp tục với Telegram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
