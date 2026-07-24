import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

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
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1a1d27] rounded-2xl p-7 space-y-6 shadow-xl">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">Xác thực 2 lớp (2FA)</h1>
          <p className="text-sm text-gray-400 mt-1">
            Bảo vệ tài khoản giao dịch bằng Google Authenticator.
          </p>
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${is2FAEnabled ? 'bg-green-400' : 'bg-gray-600'}`} />
          <span className="text-sm text-gray-300">
            Trạng thái:{' '}
            <strong className={is2FAEnabled ? 'text-green-400' : 'text-red-400'}>
              {is2FAEnabled ? 'Đã bật' : 'Chưa bật'}
            </strong>
          </span>
        </div>

        {/* ── STEP: idle — show enable/disable CTA ── */}
        {step === 'idle' && (
          <div className="space-y-3">
            {!is2FAEnabled ? (
              <>
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 text-sm text-yellow-300">
                  ⚠️ Yêu cầu: Tài khoản Trading <strong>phải bật 2FA</strong> để kích hoạt đầy đủ chức năng nạp/rút.
                </div>
                <button
                  onClick={() => setupMutation.mutate()}
                  disabled={isPending}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Đang khởi tạo…' : 'Bật xác thực 2 lớp'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400">Nhập mã OTP từ Google Authenticator để tắt 2FA.</p>
                <OtpInput value={token} onChange={setToken} disabled={isPending} />
                <button
                  onClick={handleDisable}
                  disabled={isPending}
                  className="w-full py-3 rounded-xl bg-red-700 text-white font-semibold hover:bg-red-800 transition-colors disabled:opacity-50"
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
            <p className="text-sm text-gray-300">
              1. Mở <strong>Google Authenticator</strong> và quét mã QR bên dưới.<br />
              2. Nhập mã 6 chữ số từ app để xác nhận.
            </p>

            <div className="flex flex-col items-center gap-3">
              <img
                src={setupData.qrCodeUrl}
                alt="2FA QR Code"
                className="w-48 h-48 rounded-xl bg-white p-2"
              />
              <p className="text-xs text-gray-500">
                Không quét được QR? Nhập thủ công:{' '}
                <code className="text-gray-300 break-all">{setupData.secret}</code>
              </p>
            </div>

            <OtpInput value={token} onChange={setToken} disabled={isPending} />

            <button
              onClick={handleEnable}
              disabled={isPending || token.length < 6}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Đang xác thực…' : 'Xác nhận & Bật 2FA'}
            </button>
          </div>
        )}

        {/* ── STEP: done — show backup codes ── */}
        {step === 'done' && (
          <div className="space-y-4">
            <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 text-sm text-green-300">
              ✅ 2FA đã được bật thành công!
            </div>

            <div>
              <p className="text-sm text-gray-300 font-medium mb-2">
                Mã dự phòng (Backup Codes)
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Lưu các mã này ở nơi an toàn. Mỗi mã chỉ dùng được 1 lần khi mất điện thoại.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {codes.map((c, i) => (
                  <code key={i} className="text-xs font-mono bg-gray-800 rounded-lg px-3 py-2 text-gray-200 text-center tracking-widest">
                    {c}
                  </code>
                ))}
              </div>
              <button
                onClick={copyBackupCodes}
                className="mt-3 w-full py-2.5 rounded-xl bg-gray-700 text-white text-sm font-semibold hover:bg-gray-600 transition-colors"
              >
                {copied ? '✓ Đã sao chép' : 'Sao chép tất cả mã'}
              </button>
            </div>

            <button
              onClick={() => setStep('idle')}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Hoàn tất
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-2.5">
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
      <label className="block text-sm text-gray-400 mb-1">Mã OTP (6 chữ số)</label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        disabled={disabled}
        placeholder="000000"
        className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
      />
    </div>
  );
}
