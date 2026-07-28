import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/api/trade';
import { Loader2, Mail, CheckCircle, TrendingUp } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'sent'>('idle');
  const [error,   setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Vui lòng nhập email'); return; }
    setStatus('loading'); setError('');
    try {
      await forgotPassword(email);
      setStatus('sent');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi email. Vui lòng thử lại.');
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bn-bg-base)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black"
            style={{ background: 'var(--bn-yellow)', color: '#0b0e11' }}>
            <TrendingUp size={18} />
          </div>
          <span className="text-2xl font-black" style={{ color: 'var(--bn-yellow)' }}>TradePro</span>
        </div>

        {status === 'sent' ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'var(--bn-green-muted)', border: '1px solid rgba(14,203,129,0.25)' }}>
              <CheckCircle size={32} style={{ color: 'var(--bn-green)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--bn-text-primary)' }}>Email đã gửi!</h2>
            <p className="text-sm" style={{ color: 'var(--bn-text-secondary)' }}>
              Nếu <strong style={{ color: 'var(--bn-text-primary)' }}>{email}</strong> tồn tại trong hệ thống,
              bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu trong vài phút.
            </p>
            <p className="text-xs" style={{ color: 'var(--bn-text-muted)' }}>Kiểm tra cả hộp thư spam nếu không thấy email.</p>
            <Link to="/login" className="inline-block mt-2 text-sm font-semibold" style={{ color: 'var(--bn-yellow)' }}>
              ← Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--bn-yellow-muted)', border: '1px solid var(--bn-yellow-border)' }}>
                <Mail size={22} style={{ color: 'var(--bn-yellow)' }} />
              </div>
              <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--bn-text-primary)' }}>Quên mật khẩu</h2>
              <p className="text-sm" style={{ color: 'var(--bn-text-secondary)' }}>
                Nhập email tài khoản của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl text-sm"
                style={{ background: 'var(--bn-red-muted)', border: '1px solid rgba(246,70,93,0.25)', color: 'var(--bn-red)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--bn-text-secondary)' }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="email@example.com"
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                  style={{ background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)', color: 'var(--bn-text-primary)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--bn-yellow)')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'var(--bn-border)')}
                />
              </div>
              <button
                type="submit" disabled={status === 'loading'}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 bn-btn-yellow transition-colors"
              >
                {status === 'loading'
                  ? <><Loader2 size={16} className="animate-spin" /> Đang gửi...</>
                  : 'Gửi hướng dẫn đặt lại'
                }
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: 'var(--bn-text-muted)' }}>
              Nhớ mật khẩu rồi?{' '}
              <Link to="/login" className="font-semibold" style={{ color: 'var(--bn-yellow)' }}>Đăng nhập</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
