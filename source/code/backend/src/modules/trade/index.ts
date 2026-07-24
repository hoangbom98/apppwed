'use strict';
/**
 * Trade Module
 *
 * Provides the trading platform functionality:
 * - Auth (register, login, profile, KYC)
 * - Market data (symbols, prices, price feed)
 * - Order management (buy, sell, market, limit)
 * - Position tracking
 * - Wallet (deposit, withdraw, history)
 * - Notifications
 */
const router = require('./routes/index');

module.exports = { router };
