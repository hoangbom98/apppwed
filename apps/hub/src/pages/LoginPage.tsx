/**
 * LoginPage — LKVIP Hub dark theme
 * - Email/password login
 * - Google OAuth2 & Facebook OAuth redirect (GAP-5)
 * - Xử lý callback sau OAuth redirect (?oauth=success) — handleOAuthCallback
 * - Open-redirect protection (OWASP A01)
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import * as hubApi from '@/api/hub';
import toast from 'react-hot-toast';

/** Validate redirect URL — prevent open-redirect (OWASP A01) */
function safeRedirect(raw: string | null): string {
  const target = raw ?? '/';
  if (!target.startsWith('/') || target.startsWith('//')) return '/';
  try {
    const resolved = new URL(target, window.location.origin);
    if (resolved.origin !== window.location.origin) return '/';
    return target;
  } catch {
    return '/';
  }
}

// ── OAuth provider config ─────────────────────────────────────────────────────
const OAUTH_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

const OAUTH_PROVIDERS = [
  {
    id:    'google',
    label: 'Google',
    href:  `${OAUTH_BASE}/api/auth/google/callback`.replace('/callback', ''),
    // Google "G" icon as inline SVG
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
      </svg>
    ),
    bg:     'var(--hub-bg-secondary)',
    border: 'var(--hub-border)',
    color:  '#fff',
  },
  {
    id:    'facebook',
    label: 'Facebook',
    href:  `${OAUTH_BASE}/api/auth/facebook/callback`.replace('/callback', ''),
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
        <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.696 4.533-4.696 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z"/>
      </svg>
    ),
    bg:     '#1877F2',
    border: '#1877F2',
    color:  '#fff',
  },
] as const;

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = safeRedirect(searchParams.get('redirect'));
  const { setAuth, handleOAuthCallback, isLoggedIn } = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  // ── Xử lý OAuth callback (?oauth=success từ backend redirect) ─────────────
  useEffect(() => {
    if (searchParams.get('oauth') === 'success') {
      handleOAuthCallback().then(() => {
        if (isLoggedIn) navigate(redirect);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Email/password login ──────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await hubApi.login({ email, password });
      const d   = res.data;
      setAuth(d.data?.user ?? d.user, d.data?.access_token ?? d.access_token, d.data?.refresh_token ?? d.refresh_token);
      toast.success('Đăng nhập thành công!');
      navigate(redirect);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
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
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/assets/gif/header-logo.gif" alt="LKVIP Logo"
            style={{ height: 48, margin: '0 auto 12px' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>LKVIP Hub</h1>
          <p style={{ fontSize: 13, color: 'var(--hub-text-muted)', margin: 0 }}>Đăng nhập tài khoản</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}
          style={{ background: 'var(--hub-bg-secondary)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--hub-text-muted)', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="email@example.com" autoComplete="email" style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--hub-text-muted)', marginBottom: 6 }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••" autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 44 }} />
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

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--hub-border)' }} />
            <span style={{ fontSize: 11, color: 'var(--hub-text-muted)', whiteSpace: 'nowrap' }}>hoặc đăng nhập bằng</span>
            <div style={{ flex: 1, height: 1, background: 'var(--hub-border)' }} />
          </div>

          {/* OAuth providers */}
          <div style={{ display: 'flex', gap: 10 }}>
            {OAUTH_PROVIDERS.map(p => (
              <a key={p.id} href={p.href}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  textDecoration: 'none', border: `1px solid ${p.border}`,
                  background: p.bg, color: p.color, transition: 'opacity .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {p.icon}
                {p.label}
              </a>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--hub-text-muted)', margin: 0 }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: 'var(--hub-primary)', fontWeight: 700 }}>Đăng ký ngay</Link>
          </p>
        </form>

      </div>
    </div>
  );
}
