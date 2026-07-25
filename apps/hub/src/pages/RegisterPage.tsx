/**
 * RegisterPage — LKVIP Hub dark theme
 * Password policy: NIST SP 800-63B (min 8 chars, strength indicator, no complexity mandates)
 */
import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register } from '@/api/hub';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

/** Client-side password strength scoring (mirrors authService.validatePasswordStrength) */
function scorePassword(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(4, score);
  const map: Record<number, { label: string; color: string }> = {
    0: { label: 'Rất yếu',    color: '#ef4444' },
    1: { label: 'Yếu',        color: '#f97316' },
    2: { label: 'Trung bình', color: '#eab308' },
    3: { label: 'Khá mạnh',   color: '#22c55e' },
    4: { label: 'Rất mạnh',   color: '#16a34a' },
  };
  return { score, ...map[score] };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [err, setErr]   = useState('');

  const pwStrength = useMemo(() => scorePassword(form.password), [form.password]);

  // Client-side NIST policy guard (server re-validates — this is UX only)
  const pwTooShort = form.password.length > 0 && form.password.length < 8;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (form.password.length < 8) {
      setErr('Mật khẩu phải có ít nhất 8 ký tự (NIST SP 800-63B)');
      return;
    }
    mut.mutate(form);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--hub-bg-body)',
    border: '1px solid var(--hub-border)', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none',
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/assets/gif/header-logo.gif" alt="LKVIP"
            style={{ height: 44, margin: '0 auto 10px' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Đăng ký</h1>
          <p style={{ fontSize: 13, color: 'var(--hub-text-muted)', margin: 0 }}>Tạo tài khoản LKVIP Hub</p>
        </div>

        <form onSubmit={handleSubmit}
          style={{ background: 'var(--hub-bg-secondary)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {err && (
            <p style={{ background: '#3f1f1f', border: '1px solid #f87171', borderRadius: 8,
              padding: '8px 12px', color: '#fca5a5', fontSize: 13, margin: 0 }}>{err}</p>
          )}

          {/* Full name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--hub-text-muted)', marginBottom: 5 }}>
              Họ và tên (tuỳ chọn)
            </label>
            <input type="text" value={form.full_name} placeholder="Nguyễn Văn A"
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              style={inputStyle} />
          </div>

          {/* Username */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--hub-text-muted)', marginBottom: 5 }}>
              Tên đăng nhập
            </label>
            <input type="text" value={form.username} placeholder="user123" required
              onChange={e => setForm({ ...form, username: e.target.value })}
              style={inputStyle} />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--hub-text-muted)', marginBottom: 5 }}>
              Email
            </label>
            <input type="email" value={form.email} placeholder="email@example.com" required
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={inputStyle} />
          </div>

          {/* Password + strength meter (NIST SP 800-63B) */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--hub-text-muted)', marginBottom: 5 }}>
              Mật khẩu <span style={{ color: '#888', fontWeight: 400 }}>(tối thiểu 8 ký tự)</span>
            </label>
            <input type="password" value={form.password} placeholder="••••••••" required
              minLength={8}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ ...inputStyle, borderColor: pwTooShort ? '#ef4444' : 'var(--hub-border)' }} />

            {/* Strength bar */}
            {form.password.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i < pwStrength.score ? pwStrength.color : '#333',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, margin: 0, color: pwStrength.color }}>
                  {pwStrength.label}
                  {pwTooShort && ' — cần ít nhất 8 ký tự'}
                </p>
              </div>
            )}
          </div>

          <button type="submit" disabled={mut.isPending || pwTooShort}
            style={{ width: '100%', padding: '12px', background: 'var(--hub-primary)',
              color: '#111', fontWeight: 800, fontSize: 15, borderRadius: 10,
              opacity: (mut.isPending || pwTooShort) ? .5 : 1, marginTop: 4,
              cursor: pwTooShort ? 'not-allowed' : 'pointer' }}>
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
