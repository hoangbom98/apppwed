import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const nav = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      nav('/', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? 'Email hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ac-bg)' }}>
      <div className="px-6 pt-14 pb-8 text-center" style={{ background: 'var(--ac-primary)' }}>
        <h1 className="text-3xl font-black text-white tracking-tight">LKVIP Academy</h1>
        <p className="text-white/80 text-sm mt-1">Học viện đào tạo chuyên nghiệp</p>
      </div>
      <div className="flex-1 px-6 pt-8">
        <h2 className="text-xl font-bold mb-6">Đăng nhập</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ac-muted)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" required
              className="w-full py-3.5 px-4 rounded-xl text-sm outline-none"
              style={{ background: '#fff', border: '1px solid var(--ac-border)', color: 'var(--ac-text)' }} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ac-muted)' }}>Mật khẩu</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full py-3.5 px-4 pr-12 rounded-xl text-sm outline-none"
                style={{ background: '#fff', border: '1px solid var(--ac-border)', color: 'var(--ac-text)' }} />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2">
                {show ? <EyeOff size={16} color="var(--ac-muted)" /> : <Eye size={16} color="var(--ac-muted)" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading}
            className="w-full py-4 rounded-xl font-bold text-white disabled:opacity-50 transition-all active:scale-[0.98]"
            style={{ background: 'var(--ac-primary)' }}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="text-center text-sm mt-6" style={{ color: 'var(--ac-muted)' }}>
          Chưa có tài khoản?{' '}
          <Link to="https://hub.tc-gaming.live/register" className="font-semibold"
            style={{ color: 'var(--ac-primary)' }}>Đăng ký tại Hub</Link>
        </p>
      </div>
    </div>
  );
}
