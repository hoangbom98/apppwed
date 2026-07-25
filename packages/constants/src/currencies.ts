/**
 * @lkvip/constants — currencies.ts
 * Currency codes, payment gateways, and financial limits for the LKVIP platform.
 */

export type CurrencyCode = 'VND' | 'USD' | 'COIN' | 'DIAMOND';

export type PaymentGatewayCode =
  | 'momo'
  | 'zalopay'
  | 'vnpay'
  | 'vietqr'
  | 'bank_transfer'
  | 'lkvip'
  | 'usdt'
  | 'okpay'
  | 'pay818';

export interface CurrencyConfig {
  symbol:   string;
  name:     string;
  decimals: number;
}

export interface DepositWithdrawLimits {
  min: number;
  max: number;
}

/** Supported currency codes on the platform. */
export const CURRENCY_CODES: readonly CurrencyCode[] = ['VND', 'USD', 'COIN', 'DIAMOND'];

/** Currency display configuration. */
export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyConfig> = {
  VND:     { symbol: '₫',  name: 'Vietnamese Dong',  decimals: 0 },
  USD:     { symbol: '$',  name: 'US Dollar',         decimals: 2 },
  COIN:    { symbol: '🪙', name: 'Platform Coin',     decimals: 0 },
  DIAMOND: { symbol: '💎', name: 'Platform Diamond',  decimals: 0 },
};

/** Supported payment gateway codes. */
export const PAYMENT_GATEWAY_CODES: readonly PaymentGatewayCode[] = [
  'momo',
  'zalopay',
  'vnpay',
  'vietqr',
  'bank_transfer',
  'lkvip',
  'usdt',
  'okpay',
  'pay818',
];

/** Default deposit/withdrawal limits (in VND). */
export const DEFAULT_LIMITS: {
  deposit:  DepositWithdrawLimits;
  withdraw: DepositWithdrawLimits;
} = {
  deposit:  { min: 10_000,  max: 500_000_000 },
  withdraw: { min: 50_000,  max: 100_000_000 },
};

/** Minimum transaction amounts per gateway (in VND). */
export const GATEWAY_MIN_AMOUNT: Record<PaymentGatewayCode, number> = {
  momo:          10_000,
  zalopay:       10_000,
  vnpay:         10_000,
  vietqr:        10_000,
  bank_transfer: 50_000,
  lkvip:         10_000,
  usdt:          100_000,
  okpay:         50_000,
  pay818:        50_000,
};
