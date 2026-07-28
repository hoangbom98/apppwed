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
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--sports-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white mx-auto mb-3"
            style={{ background: 'var(--sports-primary)' }}>S</div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--sports-text)' }}>Tham gia Sports</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--sports-text-muted)' }}>
            Tạo tài khoản miễn phí ngay hôm nay
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={form.fullName} onChange={set('fullName')}
            placeholder="Họ và tên" className="sports-input" />
          <input value={form.username} onChange={set('username')}
            placeholder="Username *" required className="sports-input" />
          <input type="email" value={form.email} onChange={set('email')}
            placeholder="Email *" required className="sports-input" />
          <input type="password" value={form.password} onChange={set('password')}
            placeholder="Mật khẩu *" required minLength={6} className="sports-input" />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-sm transition-colors sports-btn-primary"
          >
            {isLoading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--sports-text-muted)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--sports-primary)' }}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
