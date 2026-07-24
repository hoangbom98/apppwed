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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center font-black text-2xl text-white mx-auto mb-3">S</div>
          <h1 className="text-2xl font-black text-white">Sports</h1>
          <p className="text-sm text-gray-500 mt-1">Đăng nhập tài khoản của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Email hoặc username"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
            autoComplete="username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
            autoComplete="current-password"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-green-400 font-semibold hover:text-green-300">Đăng ký</Link>
        </p>
        <p className="text-center mt-3">
          <Link to="/" className="text-xs text-gray-600 hover:text-gray-400">← Về trang chủ</Link>
        </p>
      </div>
    </div>
  );
}
