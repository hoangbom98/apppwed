'use strict';
/**
 * Dating Module
 *
 * Provides the dating & livestream functionality:
 * - Auth (register, login, profile)
 * - Matching (swipe, like, match, unmatch)
 * - Chat (messages, rooms, real-time via Socket.IO)
 * - Feed (posts, stories, reactions)
 * - Live streaming (start, stop, watch, gifts)
 * - VIP system (subscription, benefits)
 * - Gamification (coins, badges, ranking)
 * - Wallet (coins, gifts, transactions)
 */
const router = require('./routes/index');

module.exports = { router };
