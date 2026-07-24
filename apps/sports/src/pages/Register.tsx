import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', fullName: '' });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center font-black text-2xl text-white mx-auto mb-3">S</div>
          <h1 className="text-2xl font-black text-white">Tham gia Sports</h1>
          <p className="text-sm text-gray-500 mt-1">Tạo tài khoản miễn phí ngay hôm nay</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={form.fullName} onChange={set('fullName')} placeholder="Họ và tên" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
          <input value={form.username} onChange={set('username')} placeholder="Username *" required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
          <input type="email" value={form.email} onChange={set('email')} placeholder="Email *" required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
          <input type="password" value={form.password} onChange={set('password')} placeholder="Mật khẩu *" required minLength={6} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-green-400 font-semibold hover:text-green-300">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
