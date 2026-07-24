/**
 * LoginPage — theme OKVIP tối, logo gif
 */
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import * as hubApi from '@/api/hub';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { setAuth } = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await hubApi.login({ email, password });
      const d   = res.data;
      setAuth(d.user, d.access_token, d.refresh_token);
      localStorage.setItem('hub_access_token',  d.access_token);
      localStorage.setItem('hub_refresh_token', d.refresh_token);
      toast.success('Đăng nhập thành công!');
      navigate(redirect);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/assets/gif/header-logo.gif" alt="OKVIP Logo"
            style={{ height: 48, margin: '0 auto 12px' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>OKVIP Hub</h1>
          <p style={{ fontSize: 13, color: 'var(--hub-text-muted)', margin: 0 }}>Đăng nhập tài khoản</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}
          style={{ background: 'var(--hub-bg-secondary)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--hub-text-muted)', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="email@example.com" autoComplete="email"
              style={{ width: '100%', background: 'var(--hub-bg-body)', border: '1px solid var(--hub-border)',
                borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--hub-text-muted)', marginBottom: 6 }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••" autoComplete="current-password"
                style={{ width: '100%', background: 'var(--hub-bg-body)', border: '1px solid var(--hub-border)',
                  borderRadius: 10, padding: '10px 44px 10px 14px', fontSize: 14, color: '#fff', outline: 'none' }} />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--hub-text-muted)', cursor: 'pointer', padding: 0 }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: 'var(--hub-primary)',
              color: '#111', fontWeight: 800, fontSize: 15, borderRadius: 10,
              opacity: loading ? .6 : 1, transition: 'opacity .15s' }}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--hub-text-muted)', margin: 0 }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: 'var(--hub-primary)', fontWeight: 700 }}>Đăng ký ngay</Link>
          </p>
        </form>

      </div>
    </div>
  );
}
