'use strict';
/**
 * Trade Module — Main Entry
 *
 * Provides the trading platform functionality:
 * - Auth (register, login, profile, KYC)
 * - Market data (symbols, prices, orderbook, price history)
 * - Order management (buy, sell, market, limit, cancel)
 * - Position tracking and portfolio
 * - Wallet (deposit, withdraw, balance, transaction history)
 * - Investment packages (buy, history, daily profit distribution)
 * - Referral & commission tracking
 * - Notifications
 * - Background jobs: liquidation, profit distribution, price feed
 */
const router = require('./routes/index');
const jobs   = require('./jobs/index');

module.exports = { router, jobs };
