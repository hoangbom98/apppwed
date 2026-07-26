import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@ui';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({ username, password });
      navigate('/');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--game-bg)',
        padding: '24px 16px',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <img src="/wap/img/logo.png" alt="LKVIP" style={{ height: 52, marginBottom: 8 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--game-primary)' }}>LKVIP</div>
        <div style={{ fontSize: 13, color: 'var(--game-text-secondary)', marginTop: 4 }}>
          Đăng nhập tài khoản
        </div>
      </div>

      {/* Form card */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--game-bg-white)',
          borderRadius: 'var(--game-radius-xl)',
          padding: '24px 20px',
          boxShadow: 'var(--game-shadow-md)',
        }}
      >
        {error && (
          <div style={{
            background: '#fff2f0', border: '1px solid #ffccc7',
            borderRadius: 'var(--game-radius)', padding: '8px 12px',
            fontSize: 13, color: '#ff4d4f', marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--game-text-primary)', display: 'block', marginBottom: 6 }}>
              Tên đăng nhập
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--game-text-secondary)' }} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                style={{
                  width: '100%', padding: '10px 12px 10px 36px',
                  border: '1px solid var(--game-border-dark)',
                  borderRadius: 'var(--game-radius)',
                  fontSize: 14, outline: 'none',
                  background: 'var(--game-bg)',
                  color: 'var(--game-text-primary)',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--game-primary)'; }}
                onBlur={e =>  { e.currentTarget.style.borderColor = 'var(--game-border-dark)'; }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--game-text-primary)', display: 'block', marginBottom: 6 }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--game-text-secondary)' }} />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                style={{
                  width: '100%', padding: '10px 40px 10px 36px',
                  border: '1px solid var(--game-border-dark)',
                  borderRadius: 'var(--game-radius)',
                  fontSize: 14, outline: 'none',
                  background: 'var(--game-bg)',
                  color: 'var(--game-text-primary)',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--game-primary)'; }}
                onBlur={e =>  { e.currentTarget.style.borderColor = 'var(--game-border-dark)'; }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--game-text-secondary)', padding: 4 }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 0',
              background: loading ? 'var(--game-primary-dark)' : 'var(--game-primary)',
              color: '#fff', border: 'none',
              borderRadius: 'var(--game-radius-lg)',
              fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1, transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--game-text-secondary)' }}>
          Chưa có tài khoản?{' '}
          <button
            onClick={() => navigate('/register')}
            style={{ background: 'none', border: 'none', color: 'var(--game-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
