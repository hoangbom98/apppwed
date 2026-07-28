// __APPNAME__/src/pages/LoginPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import client from '../api/client';

export default function LoginPage() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const { setAuth, clearAuth, isLoggedIn } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Xử lý OAuth callback (?oauth=success) ────────────────────────────────
  // Sau khi backend redirect về frontend với cookie đã set,
  // gọi /auth/me để lấy user info.
  useEffect(() => {
    if (searchParams.get('oauth') !== 'success') return;
    (async () => {
      setLoading(true);
      try {
        const res  = await client.get('/auth/me');
        const user = res.data?.data ?? res.data;
        // Cookie httpOnly — token không đọc được từ JS
        // Dùng setAuth với token rỗng để đánh dấu logged-in qua cookie
        setAuth(user, user.access_token || '__cookie__', user.refresh_token);
        window.history.replaceState({}, '', window.location.pathname);
        navigate('/');
      } catch {
        clearAuth();
        setError('Đăng nhập OAuth thất bại');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Email/password login ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/auth/login', {
        email:    fd.get('email'),
        password: fd.get('password'),
      });
      const d = data?.data ?? data;
      setAuth(d.user, d.access_token, d.refresh_token);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ── OAuth providers ───────────────────────────────────────────────────────
  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace('/api', '');
  const oauthProviders = [
    { id: 'google',   label: 'Google',   href: `${apiBase}/api/auth/google` },
    { id: 'facebook', label: 'Facebook', href: `${apiBase}/api/auth/facebook` },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">__APPNAME__</h1>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email" type="email" required autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              name="password" type="password" required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">hoặc</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* OAuth buttons */}
        <div className="flex gap-2">
          {oauthProviders.map(p => (
            <a key={p.id} href={p.href}
              className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              {p.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
