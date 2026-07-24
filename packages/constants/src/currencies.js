'use strict';
/**
 * @lkvip/constants — currencies.js
 * Currency codes, payment gateways, and financial limits for the LKVIP platform.
 */

/**
 * Supported currency codes on the platform.
 * @type {string[]}
 */
const CURRENCY_CODES = ['VND', 'USD', 'COIN', 'DIAMOND'];

/**
 * Currency display configuration.
 * @type {Record<string, { symbol: string, name: string, decimals: number }>}
 */
const CURRENCY_CONFIG = {
  VND:     { symbol: '₫',  name: 'Vietnamese Dong',  decimals: 0 },
  USD:     { symbol: '$',  name: 'US Dollar',         decimals: 2 },
  COIN:    { symbol: '🪙', name: 'Platform Coin',     decimals: 0 },
  DIAMOND: { symbol: '💎', name: 'Platform Diamond',  decimals: 0 },
};

/**
 * Supported payment gateway codes.
 * @type {string[]}
 */
const PAYMENT_GATEWAY_CODES = [
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

/**
 * Default deposit/withdrawal limits (in VND).
 * @type {{ deposit: { min: number, max: number }, withdraw: { min: number, max: number } }}
 */
const DEFAULT_LIMITS = {
  deposit:  { min: 10_000,     max: 500_000_000  },
  withdraw: { min: 50_000,     max: 100_000_000  },
};

/**
 * Minimum transaction amounts per gateway (in VND).
 * @type {Record<string, number>}
 */
const GATEWAY_MIN_AMOUNT = {
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

module.exports = {
  CURRENCY_CODES,
  CURRENCY_CONFIG,
  PAYMENT_GATEWAY_CODES,
  DEFAULT_LIMITS,
  GATEWAY_MIN_AMOUNT,
};
