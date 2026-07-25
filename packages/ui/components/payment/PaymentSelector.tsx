// @ts-nocheck
/**
 * PaymentSelector.tsx — shared-ui/components/payment
 * -----------------------------------------------------
 * Display a grid of available payment gateways (deposit or withdraw).
 * Fetches from GET /api/{project}/payment/gateways and lets user pick one.
 *
 * Usage:
 *   <PaymentSelector
 *     type="deposit"
 *     project="game"
 *     onSelect={(gatewayCode) => setGateway(gatewayCode)}
 *   />
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Spinner from '../Spinner';

import { MobileOutlined, BankOutlined, CreditCardOutlined, StarOutlined, DollarOutlined } from '@ant-design/icons';

// ── Gateway icon map (code → ant-design icon) ──────────────────────────────────
const GATEWAY_ICONS: Record<string, React.ReactNode> = {
  momo:    <MobileOutlined />,
  zalopay: <DollarOutlined />,
  vnpay:   <BankOutlined />,
  okpay:   <CreditCardOutlined />,
  gopay:   <DollarOutlined />,
  '818pay':<DollarOutlined />,
  usdt:    '₮',
  lkvip:   <StarOutlined />,
  bank:    <BankOutlined />,
};

export interface GatewayInfo {
  id:       string;
  code:     string;
  name:     string;
  type:     string;
  limits?:  { min?: number; max?: number };
  iconUrl?: string;
}

export interface PaymentSelectorProps {
  type:     'deposit' | 'withdraw';
  project?: string;
  onSelect: (code: string, gateway: GatewayInfo) => void;
  selected?: string | null;
  /** Filter to show only these gateway codes (optional) */
  filter?:  string[];
  className?: string;
}

export function PaymentSelector({
  type,
  onSelect,
  selected,
  filter,
  className = '',
}: PaymentSelectorProps) {
  const [active, setActive] = useState<string | null>(selected ?? null);

  const { data: gateways, isLoading, isError } = useQuery<GatewayInfo[]>({
    queryKey: ['payment', 'gateways', type],
    queryFn:  async () => {
      const res = await api.get('/payment/gateways');
      const list = (res.data?.data ?? res.data ?? []) as GatewayInfo[];
      // For withdrawal, filter out crypto-only deposit gateways
      const filtered = type === 'withdraw'
        ? list.filter(g => ['bank', 'ewallet', 'crypto'].includes(g.type))
        : list;
      return filter ? filtered.filter(g => filter.includes(g.code)) : filtered;
    },
    staleTime: 5 * 60_000,
  });

  const handleSelect = (gw: GatewayInfo) => {
    setActive(gw.code);
    onSelect(gw.code, gw);
  };

  if (isLoading) return (
    <div className={`flex justify-center py-8 ${className}`}>
      <Spinner />
    </div>
  );

  if (isError || !gateways?.length) return (
    <p className="text-center text-gray-500 py-6 text-sm">
      Không có phương thức thanh toán nào khả dụng.
    </p>
  );

  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${className}`}>
      {gateways.map(gw => {
        const isSelected = active === gw.code;
        const icon = gw.iconUrl
          ? <img src={gw.iconUrl} alt={gw.name} className="w-8 h-8 object-contain" />
          : <span className="text-2xl">{GATEWAY_ICONS[gw.code] ?? '💳'}</span>;

        return (
          <button
            key={gw.code}
            type="button"
            onClick={() => handleSelect(gw)}
            className={[
              'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center',
              'transition-all duration-150 cursor-pointer',
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50',
            ].join(' ')}
          >
            {isSelected && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-white">
                  <path d="M1 6l3 3 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
            {icon}
            <span className="text-xs font-semibold text-gray-700 leading-tight">{gw.name}</span>
            {gw.limits?.min != null && (
              <span className="text-[10px] text-gray-400">
                Min: {gw.limits.min.toLocaleString('vi-VN')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default PaymentSelector;
