/**
 * RegisterPage — theme OKVIP tối, logo gif
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register } from '@/api/hub';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [err, setErr]   = useState('');

  const mut = useMutation({
    mutationFn: register,
    onSuccess: (res: any) => {
      const d = res.data;
      setAuth(d.user, d.access_token, d.refresh_token);
      toast.success('Đăng ký thành công! Chào mừng bạn!');
      navigate('/');
    },
    onError: (e: any) => {
      setErr(e.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại');
    },
  });

  const FIELDS = [
    { key: 'full_name' as const, label: 'Họ và tên (tuỳ chọn)', type: 'text',     placeholder: 'Nguyễn Văn A' },
    { key: 'username'  as const, label: 'Tên đăng nhập',         type: 'text',     placeholder: 'user123' },
    { key: 'email'     as const, label: 'Email',                  type: 'email',    placeholder: 'email@example.com' },
    { key: 'password'  as const, label: 'Mật khẩu',               type: 'password', placeholder: '••••••••' },
  ];

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/assets/gif/header-logo.gif" alt="OKVIP"
            style={{ height: 44, margin: '0 auto 10px' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Đăng ký</h1>
          <p style={{ fontSize: 13, color: 'var(--hub-text-muted)', margin: 0 }}>Tạo tài khoản OKVIP Hub</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); setErr(''); mut.mutate(form); }}
          style={{ background: 'var(--hub-bg-secondary)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {err && (
            <p style={{ background: '#3f1f1f', border: '1px solid #f87171', borderRadius: 8,
              padding: '8px 12px', color: '#fca5a5', fontSize: 13, margin: 0 }}>{err}</p>
          )}

          {FIELDS.map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--hub-text-muted)', marginBottom: 5 }}>{f.label}</label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                required={f.key !== 'full_name'}
                placeholder={f.placeholder}
                style={{ width: '100%', background: 'var(--hub-bg-body)', border: '1px solid var(--hub-border)',
                  borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none' }}
              />
            </div>
          ))}

          <button type="submit" disabled={mut.isPending}
            style={{ width: '100%', padding: '12px', background: 'var(--hub-primary)',
              color: '#111', fontWeight: 800, fontSize: 15, borderRadius: 10,
              opacity: mut.isPending ? .6 : 1, marginTop: 4 }}>
            {mut.isPending ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--hub-text-muted)', margin: 0 }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: 'var(--hub-primary)', fontWeight: 700 }}>Đăng nhập</Link>
          </p>
        </form>

      </div>
    </div>
  );
}
