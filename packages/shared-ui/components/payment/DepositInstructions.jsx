/**
 * DepositInstructions.jsx — Renders payment instructions returned by the backend.
 *
 * Usage:
 *   import { DepositInstructions } from '@ui/components/payment/DepositInstructions';
 *   <DepositInstructions orderId={id} instructions={data} onClose={() => {}} />
 *
 * Supported instruction types:
 *   bank_transfer   → list of fields with copy buttons
 *   crypto          → wallet address fields + QR code
 *   redirect        → auto-redirect or manual "Go to payment" button
 *   qr_code         → standalone QR display
 */
import React, { useEffect, useRef, useState } from 'react';

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(value)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
      aria-label="Sao chép"
    >
      {copied ? '✓ Đã sao chép' : 'Sao chép'}
    </button>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────

function Countdown({ expiresAt }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setRemaining('Đã hết hạn'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, '0')}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!remaining) return null;
  return (
    <p className="text-xs text-yellow-400 mt-2">
      ⏱ Hết hạn sau: <strong>{remaining}</strong>
    </p>
  );
}

// ── Field list ────────────────────────────────────────────────────────────────

function FieldList({ fields }) {
  return (
    <div className="space-y-3">
      {fields.map((f, i) => (
        <div key={i} className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-gray-400">{f.label}</p>
            <p className="text-sm font-mono text-white break-all">{f.value}</p>
          </div>
          {f.copyable && <CopyButton value={f.value} />}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DepositInstructions({ orderId, instructions, onClose }) {
  const redirectRef = useRef(false);

  // Auto-redirect for redirect-type gateways (once)
  useEffect(() => {
    if (
      instructions?.type === 'redirect' &&
      instructions?.redirectUrl &&
      !redirectRef.current
    ) {
      redirectRef.current = true;
      setTimeout(() => {
        window.open(instructions.redirectUrl, '_blank', 'noopener,noreferrer');
      }, 1000);
    }
  }, [instructions]);

  if (!instructions) return null;

  const { type, title, fields = [], qrDataUrl, redirectUrl, expiresAt } = instructions;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-white text-base">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Mã đơn: <span className="font-mono text-gray-300">{orderId}</span>
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl leading-none"
            aria-label="Đóng"
          >
            ✕
          </button>
        )}
      </div>

      {/* Bank transfer / Crypto fields */}
      {fields.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4">
          <FieldList fields={fields} />
        </div>
      )}

      {/* QR code */}
      {qrDataUrl && (
        <div className="flex flex-col items-center gap-2">
          <img
            src={qrDataUrl}
            alt="QR Code thanh toán"
            className="w-44 h-44 rounded-lg border border-gray-700 bg-white p-1"
          />
          <p className="text-xs text-gray-400">Quét mã QR để thanh toán</p>
        </div>
      )}

      {/* Redirect button */}
      {type === 'redirect' && redirectUrl && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-gray-300 text-center">
            Đang mở trang thanh toán… nếu không tự động mở, nhấn nút bên dưới.
          </p>
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Đến trang thanh toán →
          </a>
        </div>
      )}

      {/* Expiry countdown */}
      <Countdown expiresAt={expiresAt} />

      {/* Info box */}
      <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-xl p-3">
        <p className="text-xs text-yellow-300">
          ⚠️ Sau khi chuyển tiền, số dư sẽ được cộng tự động trong vòng 1–5 phút.
          Nếu quá 30 phút chưa nhận, vui lòng liên hệ hỗ trợ kèm mã đơn.
        </p>
      </div>
    </div>
  );
}

export default DepositInstructions;
