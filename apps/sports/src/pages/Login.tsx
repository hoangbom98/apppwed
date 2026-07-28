import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToast } from '@ui/hooks/useToast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--sports-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white mx-auto mb-3"
            style={{ background: 'var(--sports-primary)' }}>S</div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--sports-text)' }}>Sports</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--sports-text-muted)' }}>
            Đăng nhập tài khoản của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Email hoặc username"
            className="sports-input"
            autoComplete="username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            className="sports-input"
            autoComplete="current-password"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-sm transition-colors sports-btn-primary"
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--sports-text-muted)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold" style={{ color: 'var(--sports-primary)' }}>
            Đăng ký
          </Link>
        </p>
        <p className="text-center mt-3">
          <Link to="/" className="text-xs transition-colors" style={{ color: 'var(--sports-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--sports-text-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--sports-text-muted)')}>
            ← Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
