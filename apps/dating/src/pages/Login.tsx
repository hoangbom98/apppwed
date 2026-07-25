import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { MobileOutlined, MailOutlined, ZhihuOutlined, FacebookOutlined, GoogleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { sendOtp } from '@/api/auth';
import toast from 'react-hot-toast';
import { ASSET_UI } from '@/utils/constants';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [tab, setTab]         = useState<'phone' | 'email'>('phone');
  const [phone, setPhone]     = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp]         = useState('');

  const handleSendOtp = async () => {
    if (!phone) return toast.error('Nhập số điện thoại');
    try {
      await sendOtp(phone);
      setOtpSent(true);
      toast.success('OTP đã gửi!');
    } catch { toast.error('Lỗi gửi OTP'); }
  };

  const handlePhoneLogin = async () => {
    try { await login({ phone, otp }); navigate('/'); }
    catch { toast.error('OTP không đúng'); }
  };

  const handleEmailLogin = async () => {
    try { await login({ email, password }); navigate('/'); }
    catch { toast.error('Email hoặc mật khẩu không đúng'); }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `url(${ASSET_UI.LOGIN_BG}) no-repeat 0 0`,
        backgroundSize: 'auto 100%',
        animation: 'bgSlide 30s linear infinite',
      }}
    >
      <style>{`
        @keyframes bgSlide {
          0%, 100% { background-position-x: 0; }
          50%       { background-position-x: 100%; }
        }
      `}</style>

      {/* Dark overlay */}
      <div className="flex-1 flex flex-col" style={{ background: 'rgba(0,0,0,0.51)' }}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

          {/* Logo */}
          <div className="mb-8 text-center">
            <img
              src={ASSET_UI.LOGIN_LOGO}
              alt="Logo"
              className="w-20 h-20 rounded-3xl mx-auto mb-4 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <h1 className="text-3xl font-black text-white">VietDating</h1>
            <p className="text-white/70 mt-1 text-sm">Kết nối trái tim Việt</p>
          </div>

          {/* Tabs */}
          <div className="w-full max-w-sm bg-black/30 rounded-2xl p-1 flex mb-6 border border-white/10">
            {(['phone', 'email'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                  tab === t
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/50'
                }`}>
                {t === 'phone' ? <><MobileOutlined /> SĐT</> : <><MailOutlined /> Email</>}
              </button>
            ))}
          </div>

          <div className="w-full max-w-sm space-y-4">
            {tab === 'phone' ? (
              <>
                <div className="flex gap-2">
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="Số điện thoại" type="tel"
                    className="flex-1 bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-pink-400" />
                  <button onClick={handleSendOtp}
                    className="px-4 py-3 bg-pink-500 text-white text-sm font-semibold rounded-xl whitespace-nowrap hover:bg-pink-600 transition-colors">
                    Gửi OTP
                  </button>
                </div>
                {otpSent && (
                  <input value={otp} onChange={e => setOtp(e.target.value)}
                    placeholder="Nhập mã OTP 6 số" maxLength={6}
                    className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 text-center tracking-widest focus:outline-none focus:border-pink-400" />
                )}
                <button onClick={handlePhoneLogin} disabled={isLoading || !otpSent}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold rounded-xl text-sm disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn size={16} />}
                  Đăng nhập
                </button>
              </>
            ) : (
              <>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email" type="email"
                  className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-pink-400" />
                <div className="relative">
                  <input value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mật khẩu" type={showPass ? 'text' : 'password'}
                    className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-pink-400 pr-12" />
                  <button onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button onClick={handleEmailLogin} disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold rounded-xl text-sm disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn size={16} />}
                  Đăng nhập
                </button>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="w-full max-w-sm flex items-center gap-3 my-6">
            <hr className="flex-1 border-white/20" />
            <span className="text-xs text-white/40">HOẶC</span>
            <hr className="flex-1 border-white/20" />
          </div>

          {/* Social */}
          <div className="w-full max-w-sm space-y-3">
            <button onClick={() => { window.location.href = '/api/dating/auth/social/zalo'; }}
              className="w-full border border-blue-400/40 text-blue-200 bg-black/20 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-3 hover:bg-black/30 transition-colors">
              <ZhihuOutlined className="text-xl" /> Tiếp tục với Zalo
            </button>
            <button onClick={() => { window.location.href = '/api/dating/auth/social/facebook'; }}
              className="w-full border border-blue-500/40 text-blue-300 bg-black/20 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-3 hover:bg-black/30 transition-colors">
              <FacebookOutlined className="text-xl" /> Tiếp tục với Facebook
            </button>
            <button onClick={() => { window.location.href = '/api/dating/auth/social/google'; }}
              className="w-full border border-red-400/40 text-red-200 bg-black/20 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-3 hover:bg-black/30 transition-colors">
              <GoogleOutlined className="text-xl" /> Tiếp tục với Google
            </button>
          </div>
        </div>

        <div className="px-6 pb-10 text-center">
          <p className="text-sm text-white/60">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-pink-400 font-semibold">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
