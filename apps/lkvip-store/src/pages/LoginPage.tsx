import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading }    = useAuthStore();
  const nav                     = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      nav('/customer');
    } catch {
      toast.error('Email hoặc mật khẩu không đúng');
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', background: 'transparent',
    border: '1px solid var(--store-border)', borderRadius: 8,
    fontSize: 14, color: 'var(--store-text)', outline: 'none',
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--store-text)', marginBottom: 8 }}>Đăng nhập Store</h1>
          <p style={{ fontSize: 14, color: 'var(--store-muted)' }}>Truy cập tài nguyên đã mua</p>
        </div>
        <form onSubmit={handleSubmit} style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 14, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--store-muted)', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--store-muted)', marginBottom: 6 }}>Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            style={{ padding: '12px', background: isLoading ? '#6b7280' : 'var(--store-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: 4 }}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--store-muted)' }}>
            Chưa có tài khoản?{' '}
            <button onClick={() => nav('/register')} type="button" style={{ background: 'none', border: 'none', color: 'var(--store-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Đăng ký</button>
          </p>
        </form>
      </div>
    </div>
  );
}
