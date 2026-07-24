'use strict';
/**
 * Game Module
 *
 * Provides the game center functionality:
 * - Auth (register, login, profile)
 * - Game catalog (GSC+, Goldgate, TC Gaming providers)
 * - Wallet (deposit, withdraw, balance, history)
 * - VIP system (levels, cashbacks, interests)
 * - Lottery (types, draws, betting)
 * - Game sessions (launch, history)
 * - Agent/commission system
 * - Provider callbacks (GSC seamless, Goldgate, TC Gaming)
 * - Payment engine integration
 */
const router = require('./routes/index');

module.exports = { router };
