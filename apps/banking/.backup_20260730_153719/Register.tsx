import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/trade/auth/register', { email, password, fullName });
      toast.success('Đăng ký thành công! Đăng nhập để tiếp tục.');
      nav('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bank-bg)' }}>
      <div className="px-6 pt-14 pb-8 text-center" style={{ background: 'var(--bank-primary)' }}>
        <h1 className="text-3xl font-black text-white tracking-tight">LKVIP Bank</h1>
        <p className="text-white/80 text-sm mt-1">Tạo tài khoản miễn phí</p>
      </div>

      <div className="flex-1 px-6 pt-8">
        <h2 className="text-xl font-bold mb-6">Đăng ký</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--bank-muted)' }}>Họ và tên</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
              className="w-full py-3.5 px-4 rounded-xl text-sm outline-none"
              style={{ background: '#fff', border: '1px solid var(--bank-border)' }}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--bank-muted)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full py-3.5 px-4 rounded-xl text-sm outline-none"
              style={{ background: '#fff', border: '1px solid var(--bank-border)' }}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--bank-muted)' }}>Mật khẩu</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ít nhất 8 ký tự"
                minLength={8}
                required
                className="w-full py-3.5 px-4 pr-12 rounded-xl text-sm outline-none"
                style={{ background: '#fff', border: '1px solid var(--bank-border)' }}
              />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2">
                {show ? <EyeOff size={16} color="var(--bank-muted)" /> : <Eye size={16} color="var(--bank-muted)" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white disabled:opacity-50 transition-all active:scale-[0.98]"
            style={{ background: 'var(--bank-primary)' }}
          >
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>
        <p className="text-center text-sm mt-6" style={{ color: 'var(--bank-muted)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--bank-primary)' }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
