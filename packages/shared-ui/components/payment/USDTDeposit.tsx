/**
 * USDTDeposit.tsx — shared-ui/components/payment
 * ------------------------------------------------
 * USDT deposit flow:
 *   1. User selects network (TRC20/ERC20/BEP20) and enters amount
 *   2. Calls POST /payment/deposit → gets wallet address + QR
 *   3. Shows QR code + copyable address + auto-refund badge
 *   4. Polls deposit status every 30s until confirmed or expired
 *
 * Usage:
 *   <USDTDeposit onSuccess={(orderId) => navigate('/wallet')} />
 */

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Spinner from '../Spinner';
import Button from '../Button';

type Network = 'TRC20' | 'ERC20' | 'BEP20';

interface DepositResult {
  orderId:      string;
  type:         string;
  title:        string;
  fields:       Array<{ label: string; value: string; copyable?: boolean }>;
  qrDataUrl?:   string | null;
  expiresAt?:   string | null;
  autoRefund?:  boolean;
}

const NETWORKS: { value: Network; label: string; fee: string }[] = [
  { value: 'TRC20', label: 'TRON (TRC20)',    fee: '~1 USDT' },
  { value: 'ERC20', label: 'Ethereum (ERC20)', fee: '~5 USDT' },
  { value: 'BEP20', label: 'BSC (BEP20)',     fee: '~0.5 USDT' },
];

export interface USDTDepositProps {
  onSuccess?: (orderId: string) => void;
  minAmount?: number;
}

export function USDTDeposit({ onSuccess, minAmount = 10 }: USDTDepositProps) {
  const [network, setNetwork] = useState<Network>('TRC20');
  const [amount,  setAmount]  = useState('');
  const [result,  setResult]  = useState<DepositResult | null>(null);
  const [copied,  setCopied]  = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Deposit mutation ───────────────────────────────────────────────────────
  const depositMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/payment/deposit', {
        gatewayCode: 'usdt',
        amount:      parseFloat(amount),
        currency:    'USDT',
        network,
      });
      return res.data?.data as DepositResult;
    },
    onSuccess: (data) => {
      setResult(data);
      startPolling(data.orderId);
    },
  });

  // ── Poll status every 30s ──────────────────────────────────────────────────
  const startPolling = (orderId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/payment/orders/deposit/${orderId}/status`).catch(() => null);
        const status = res?.data?.data?.status;
        if (status === 'success' || status === 'completed') {
          clearInterval(pollRef.current!);
          onSuccess?.(orderId);
        }
        if (status === 'failed' || status === 'refunded') {
          clearInterval(pollRef.current!);
        }
      } catch { /* ignore poll errors */ }
    }, 30_000);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Copy to clipboard ──────────────────────────────────────────────────────
  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  };

  // ── If deposit instructions are showing ───────────────────────────────────
  if (result) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-semibold text-gray-800">{result.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Gửi đúng số tiền đến địa chỉ bên dưới
          </p>
        </div>

        {/* QR Code */}
        {result.qrDataUrl && (
          <div className="flex justify-center">
            <div className="p-3 bg-white border border-gray-200 rounded-xl inline-block">
              <img src={result.qrDataUrl} alt="QR Code" className="w-44 h-44" />
            </div>
          </div>
        )}

        {/* Fields */}
        <div className="space-y-2">
          {result.fields.map(f => (
            <div key={f.label} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
              <span className="text-xs text-gray-500 shrink-0">{f.label}</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-mono font-medium text-gray-800 truncate">{f.value}</span>
                {f.copyable && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(f.value, f.label)}
                    className="shrink-0 text-blue-500 hover:text-blue-700 text-xs"
                  >
                    {copied === f.label ? '✓' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Auto-refund badge */}
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700 flex items-center gap-2">
          <span>🔄</span>
          <span>Tự động hoàn trả nếu giao dịch thất bại</span>
        </div>

        {/* Expiry warning */}
        {result.expiresAt && (
          <p className="text-center text-xs text-amber-600">
            ⚠️ Địa chỉ hết hạn lúc {new Date(result.expiresAt).toLocaleTimeString('vi-VN')}
          </p>
        )}

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => { setResult(null); setAmount(''); }}
        >
          Tạo giao dịch mới
        </Button>
      </div>
    );
  }

  // ── Deposit form ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Nạp tiền bằng USDT</h3>

      {/* Network selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Chọn mạng</label>
        <div className="grid grid-cols-3 gap-2">
          {NETWORKS.map(n => (
            <button
              key={n.value}
              type="button"
              onClick={() => setNetwork(n.value)}
              className={[
                'rounded-lg border-2 p-2 text-center text-xs transition-colors',
                network === n.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
              ].join(' ')}
            >
              <div className="font-bold">{n.value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Phí: {n.fee}</div>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-amber-600">
          ⚠️ Chọn đúng mạng tương ứng với ví của bạn để tránh mất tiền
        </p>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Số tiền (USDT) — Tối thiểu {minAmount} USDT
        </label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min={minAmount}
          step="0.1"
          placeholder={`Nhập số tiền ≥ ${minAmount}`}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <Button
        className="w-full"
        loading={depositMutation.isPending}
        disabled={!amount || parseFloat(amount) < minAmount}
        onClick={() => depositMutation.mutate()}
      >
        Tạo địa chỉ nạp tiền
      </Button>

      {depositMutation.isError && (
        <p className="text-center text-sm text-red-600">
          {(depositMutation.error as any)?.response?.data?.message ?? 'Lỗi tạo giao dịch'}
        </p>
      )}
    </div>
  );
}

export default USDTDeposit;
