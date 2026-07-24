// @ts-nocheck
'use strict';
/**
 * businessEvents.ts — Centralised Node.js EventEmitter for LKVIP business events.
 *
 * Pattern: Event-driven automation.
 * Any service can emit an event; workers listen and react automatically.
 *
 * Usage (emit):
 *   const biz = require('./businessEvents');
 *   biz.emit('deposit:completed', { userId, amount, vaNumber });
 *
 * Usage (listen — done once at startup by each worker):
 *   biz.on('deposit:completed', async ({ userId, amount }) => { ... });
 *
 * Events defined:
 *   deposit:completed   { userId, amount, vaNumber, transactionId }
 *   deposit:expired     { userId, vaNumber }
 *   withdrawal:approved { userId, amount, withdrawalId }
 *   bet:settled         { userId, gameType, validBet, totalBet, totalWin, aggregator }
 *   commission:paid     { agentId, amount, period }
 *   rebate:credited     { userId, amount, gameType, period }
 *   vip:upgraded        { userId, oldLevel, newLevel }
 *   fraud:detected      { userId, rule, details }
 *   balance:low         { userId, balance, threshold }
 */

const EventEmitter = require('events');
const logger       = require('../shared/services/logger');

const biz = new EventEmitter();
biz.setMaxListeners(50); // multiple workers may subscribe

// ── Error guard: unhandled async listener rejections → log only ──────────────
const _origEmit = biz.emit.bind(biz);
biz.emit = function safeEmit(event, ...args) {
  try {
    return _origEmit(event, ...args);
  } catch (err) {
    logger.error(`[BusinessEvents] emit "${event}" threw: ${err.message}`);
    return false;
  }
};

// ── Built-in fanout: log every business event at debug level ─────────────────
biz.on('newListener', (event) => {
  if (event === 'newListener' || event === 'removeListener') return;
  logger.debug(`[BusinessEvents] listener registered for "${event}"`);
});

module.exports = biz;
