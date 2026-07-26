import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@ui';
import { Eye, EyeOff, Lock, User, Phone } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const [form, setForm]     = useState({ username: '', email: '', phone: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await registerUser({
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      navigate('/');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px 10px 36px',
    border: '1px solid var(--game-border-dark)',
    borderRadius: 'var(--game-radius)',
    fontSize: 14, outline: 'none',
    background: 'var(--game-bg)',
    color: 'var(--game-text-primary)',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600,
    color: 'var(--game-text-primary)',
    display: 'block', marginBottom: 6,
  };
  const iconStyle: React.CSSProperties = {
    position: 'absolute', left: 12, top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--game-text-secondary)',
  };

  const fields = [
    { key: 'username' as const, label: 'Tên đăng nhập', icon: <User size={16} style={iconStyle} />, type: 'text', placeholder: 'Tối thiểu 4 ký tự' },
    { key: 'email'    as const, label: 'Email', icon: <User size={16} style={iconStyle} />, type: 'email', placeholder: 'email@example.com' },
    { key: 'phone'    as const, label: 'Số điện thoại (tuỳ chọn)', icon: <Phone size={16} style={iconStyle} />, type: 'tel', placeholder: '0912345678' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--game-bg)', padding: '24px 16px',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <img src="/wap/img/logo.png" alt="LKVIP" style={{ height: 52, marginBottom: 8 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--game-primary)' }}>LKVIP</div>
        <div style={{ fontSize: 13, color: 'var(--game-text-secondary)', marginTop: 4 }}>
          Tạo tài khoản mới
        </div>
      </div>

      <div
        style={{
          width: '100%', maxWidth: 400,
          background: 'var(--game-bg-white)',
          borderRadius: 'var(--game-radius-xl)',
          padding: '24px 20px',
          boxShadow: 'var(--game-shadow-md)',
        }}
      >
        {error && (
          <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 'var(--game-radius)', padding: '8px 12px', fontSize: 13, color: '#ff4d4f', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{f.label}</label>
              <div style={{ position: 'relative' }}>
                {f.icon}
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={set(f.key)}
                  placeholder={f.placeholder}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--game-primary)'; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = 'var(--game-border-dark)'; }}
                />
              </div>
            </div>
          ))}

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={iconStyle} />
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Tối thiểu 6 ký tự"
                style={{ ...inputStyle, paddingRight: 40 }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--game-primary)'; }}
                onBlur={e =>  { e.currentTarget.style.borderColor = 'var(--game-border-dark)'; }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--game-text-secondary)', padding: 4 }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Xác nhận mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={iconStyle} />
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.confirm}
                onChange={set('confirm')}
                placeholder="Nhập lại mật khẩu"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--game-primary)'; }}
                onBlur={e =>  { e.currentTarget.style.borderColor = 'var(--game-border-dark)'; }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 0',
              background: loading ? 'var(--game-primary-dark)' : 'var(--game-primary)',
              color: '#fff', border: 'none',
              borderRadius: 'var(--game-radius-lg)',
              fontWeight: 700, fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--game-text-secondary)' }}>
          Đã có tài khoản?{' '}
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: 'var(--game-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
