import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { AlertTriangle, CheckCircle, Check } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SetupData {
  qrCodeUrl:  string;
  secret:     string;
  backupCodes: string[];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TwoFactor() {
  const qc = useQueryClient();
  const [step, setStep]     = useState<'idle' | 'setup' | 'verify' | 'done'>('idle');
  const [token, setToken]   = useState('');
  const [error, setError]   = useState<string | null>(null);
  const [setupData, setSData] = useState<SetupData | null>(null);
  const [codes, setCodes]   = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // ── Profile query to know current 2FA status ────────────────────────────────
  const { data: profile } = useQuery({
    queryKey: ['tradeProfile'],
    queryFn:  () => api.get('/trade/auth/me').then(r => r.data?.data ?? r.data),
  });
  const is2FAEnabled = profile?.twoFAEnabled ?? false;

  // ── Setup mutation (generates QR) ───────────────────────────────────────────
  const setupMutation = useMutation({
    mutationFn: () => api.post('/trade/auth/2fa/setup').then(r => r.data?.data ?? r.data),
    onSuccess: (data: SetupData) => {
      setSData(data);
      setStep('setup');
      setError(null);
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Không thể khởi tạo 2FA'),
  });

  // ── Enable mutation (verify token → enable) ─────────────────────────────────
  const enableMutation = useMutation({
    mutationFn: (t: string) => api.post('/trade/auth/2fa/enable', { token: t }).then(r => r.data?.data ?? r.data),
    onSuccess: (data: { backupCodes?: string[] }) => {
      setCodes(data.backupCodes ?? []);
      setStep('done');
      qc.invalidateQueries({ queryKey: ['tradeProfile'] });
      setError(null);
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Mã xác thực không đúng'),
  });

  // ── Disable mutation ─────────────────────────────────────────────────────────
  const disableMutation = useMutation({
    mutationFn: (t: string) => api.post('/trade/auth/2fa/disable', { token: t }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tradeProfile'] });
      setStep('idle');
      setToken('');
      setError(null);
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Mã xác thực không đúng'),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleEnable = () => {
    if (token.length !== 6) { setError('Mã OTP gồm 6 chữ số'); return; }
    enableMutation.mutate(token);
  };

  const handleDisable = () => {
    if (token.length !== 6) { setError('Mã OTP gồm 6 chữ số'); return; }
    disableMutation.mutate(token);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(codes.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const isPending = setupMutation.isPending || enableMutation.isPending || disableMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bn-bg-base)' }}>
      <div className="w-full max-w-md rounded-2xl p-7 space-y-6 bn-surface">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--bn-text-primary)' }}>Xác thực 2 lớp (2FA)</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--bn-text-secondary)' }}>
            Bảo vệ tài khoản giao dịch bằng Google Authenticator.
          </p>
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: is2FAEnabled ? 'var(--bn-green)' : 'var(--bn-text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--bn-text-secondary)' }}>
            Trạng thái:{' '}
            <strong style={{ color: is2FAEnabled ? 'var(--bn-green)' : 'var(--bn-red)' }}>
              {is2FAEnabled ? 'Đã bật' : 'Chưa bật'}
            </strong>
          </span>
        </div>

        {/* ── STEP: idle — show enable/disable CTA ── */}
        {step === 'idle' && (
          <div className="space-y-3">
            {!is2FAEnabled ? (
              <>
                <div className="flex items-start gap-2 rounded-xl p-4 text-sm" style={{ background: 'var(--bn-yellow-muted)', border: '1px solid var(--bn-yellow-border)', color: 'var(--bn-yellow)' }}>
                  <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>Yêu cầu: Tài khoản Trading <strong>phải bật 2FA</strong> để kích hoạt đầy đủ chức năng nạp/rút.</span>
                </div>
                <button
                  onClick={() => setupMutation.mutate()}
                  disabled={isPending}
                  className="w-full py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 bn-btn-primary"
                >
                  {isPending ? 'Đang khởi tạo…' : 'Bật xác thực 2 lớp'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm" style={{ color: 'var(--bn-text-secondary)' }}>Nhập mã OTP từ Google Authenticator để tắt 2FA.</p>
                <OtpInput value={token} onChange={setToken} disabled={isPending} />
                <button
                  onClick={handleDisable}
                  disabled={isPending}
                  className="w-full py-3 rounded-xl text-white font-semibold transition-colors disabled:opacity-50"
                  style={{ background: 'var(--bn-red)' }}
                >
                  {isPending ? 'Đang xử lý…' : 'Tắt 2FA'}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── STEP: setup — show QR code ── */}
        {step === 'setup' && setupData && (
          <div className="space-y-5">
            <p className="text-sm" style={{ color: 'var(--bn-text-secondary)' }}>
              1. Mở <strong>Google Authenticator</strong> và quét mã QR bên dưới.<br />
              2. Nhập mã 6 chữ số từ app để xác nhận.
            </p>

            <div className="flex flex-col items-center gap-3">
              <img
                src={setupData.qrCodeUrl}
                alt="2FA QR Code"
                className="w-48 h-48 rounded-xl bg-white p-2"
              />
              <p className="text-xs break-all" style={{ color: 'var(--bn-text-muted)' }}>
                Không quét được QR? Nhập thủ công:{' '}
                <code style={{ color: 'var(--bn-text-secondary)' }}>{setupData.secret}</code>
              </p>
            </div>

            <OtpInput value={token} onChange={setToken} disabled={isPending} />

            <button
              onClick={handleEnable}
              disabled={isPending || token.length < 6}
              className="w-full py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 bn-btn-primary"
            >
              {isPending ? 'Đang xác thực…' : 'Xác nhận & Bật 2FA'}
            </button>
          </div>
        )}

        {/* ── STEP: done — show backup codes ── */}
        {step === 'done' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl p-4 text-sm" style={{ background: 'var(--bn-green-muted)', border: '1px solid rgba(14,203,129,0.25)', color: 'var(--bn-green)' }}>
              <CheckCircle size={15} className="flex-shrink-0" />2FA đã được bật thành công!
            </div>

            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--bn-text-secondary)' }}>
                Mã dự phòng (Backup Codes)
              </p>
              <p className="text-xs mb-3" style={{ color: 'var(--bn-text-muted)' }}>
                Lưu các mã này ở nơi an toàn. Mỗi mã chỉ dùng được 1 lần khi mất điện thoại.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {codes.map((c, i) => (
                  <code key={i} className="text-xs font-mono rounded-lg px-3 py-2 text-center tracking-widest" style={{ background: 'var(--bn-bg-elevated)', color: 'var(--bn-text-primary)' }}>
                    {c}
                  </code>
                ))}
              </div>
              <button
                onClick={copyBackupCodes}
                className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'var(--bn-bg-elevated)', color: 'var(--bn-text-primary)', border: '1px solid var(--bn-border)' }}
              >
                {copied ? <><Check size={13} className="inline mr-1" />Đã sao chép</> : 'Sao chép tất cả mã'}
              </button>
            </div>

            <button
              onClick={() => setStep('idle')}
              className="w-full py-3 rounded-xl font-semibold transition-colors bn-btn-primary"
            >
              Hoàn tất
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <p className="text-sm rounded-xl px-4 py-2.5" style={{ color: 'var(--bn-red)', background: 'var(--bn-red-muted)', border: '1px solid rgba(246,70,93,0.25)' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ── OTP input sub-component ───────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm mb-1" style={{ color: 'var(--bn-text-secondary)' }}>Mã OTP (6 chữ số)</label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        disabled={disabled}
        placeholder="000000"
        className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none transition-colors disabled:opacity-50"
        style={{ background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)', color: 'var(--bn-text-primary)' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--bn-yellow)')}
        onBlur={e  => (e.currentTarget.style.borderColor = 'var(--bn-border)')}
      />
    </div>
  );
}
