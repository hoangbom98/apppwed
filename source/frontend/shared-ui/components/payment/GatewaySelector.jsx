/**
 * GatewaySelector.jsx — Payment gateway picker for deposit/withdraw flows.
 *
 * Usage:
 *   import { GatewaySelector } from '@ui/components/payment/GatewaySelector';
 *   <GatewaySelector selected={gw} onChange={setGw} />
 *
 * Props:
 *   selected  {string}               — currently selected gateway code
 *   onChange  {(code: string) => void}
 *   disabled  {boolean}              — disable all buttons (e.g. during submit)
 *   apiBase   {string}               — overrides VITE_API_URL (optional)
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import Spinner from './Spinner';

// Icon map per gateway type
const TYPE_ICON = {
  bank:    '🏦',
  crypto:  '₿',
  ewallet: '📱',
  card:    '💳',
};

export function GatewaySelector({ selected, onChange, disabled = false }) {
  const { data: gateways, isLoading, isError } = useQuery({
    queryKey:  ['paymentGateways'],
    queryFn:   () => api.get('/payment/gateways').then(r => r.data?.data ?? r.data ?? []),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
        <Spinner size="sm" /> Đang tải cổng thanh toán…
      </div>
    );
  }

  if (isError || !gateways?.length) {
    return (
      <p className="text-sm text-red-400 py-4 text-center">
        Không có cổng thanh toán nào khả dụng. Vui lòng thử lại sau.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {gateways.map(gw => {
        const isActive = selected === gw.code;
        const limits   = gw.limits ?? {};

        return (
          <button
            key={gw.code}
            type="button"
            disabled={disabled}
            onClick={() => onChange(gw.code)}
            className={[
              'relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              isActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800/60 hover:border-gray-500',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            {/* Active tick */}
            {isActive && (
              <span className="absolute top-2 right-2 text-blue-400 text-xs">✓</span>
            )}

            <span className="text-2xl mb-2" aria-hidden="true">
              {TYPE_ICON[gw.type] ?? '💰'}
            </span>

            <span className="font-semibold text-white text-sm leading-tight">
              {gw.name}
            </span>

            {limits.min != null && (
              <span className="text-[11px] text-gray-400 mt-1">
                Tối thiểu: {Number(limits.min).toLocaleString('vi-VN')}
                {gw.type === 'crypto' ? ' USDT' : '₫'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default GatewaySelector;
