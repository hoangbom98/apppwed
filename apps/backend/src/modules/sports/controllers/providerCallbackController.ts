// code/backend/src/modules/sports/controllers/providerCallbackController.js
'use strict';
/**
 * Sports Aggregator Callback Controller
 *
 * Handles incoming seamless-wallet callbacks from aggregator services
 * in the context of the Sports module (sports_db).
 *
 * In this context: req.prisma = sports_db client (set by projectResolver).
 * All balance mutations go against sports_db.user / sports_db.transaction.
 * Aggregator configs are read from game_db via getAggregator().
 *
 * Routes:
 *   POST /api/sports/callbacks/gsc                    — GSC balance/transaction
 *   POST /api/sports/callbacks/goldgate/balance        — Goldgate balance inquiry
 *   POST /api/sports/callbacks/goldgate/transaction    — Goldgate transaction
 *   POST /api/sports/callbacks/tc-gaming/seamless      — TC Gaming seamless
 */
const { getAggregator } = require('../../../shared/services/aggregators');
const logger            = require('../../../shared/services/logger');

// ── GSC ───────────────────────────────────────────────────────────────────────

exports.gsc = async (req, res) => {
  try {
    const gsc = await getAggregator('GSC').catch(() => null);
    if (!gsc) return res.json({ code: 1, message: 'GSC not configured' });

    const { action } = req.body;
    let result;
    if (action === 'getBalance' || action === 'balance') {
      result = await gsc.handleBalance(req.body, req.prisma);
    } else if (['transaction', 'debit', 'credit'].includes(action)) {
      result = await gsc.handleTransaction(req.body, req.prisma);
    } else {
      result = { code: 0 };
    }
    return res.json(result);
  } catch (err) {
    logger.error(`[Sports/Callback/GSC] ${err.message}`);
    return res.json({ code: 1, message: err.message });
  }
};

// ── Goldgate ──────────────────────────────────────────────────────────────────

exports.goldgateBalance = async (req, res) => {
  try {
    const gg = await getAggregator('GOLDGATE').catch(() => null);
    if (!gg) return res.json({ code: 1, message: 'Goldgate not configured' });

    const { userCode, vendorCode } = req.body;
    const result = await gg.handleBalance(userCode, vendorCode, req.prisma);
    return res.json(result);
  } catch (err) {
    logger.error(`[Sports/Callback/Goldgate/balance] ${err.message}`);
    return res.json({ code: 1, message: err.message });
  }
};

exports.goldgateTransaction = async (req, res) => {
  try {
    const gg = await getAggregator('GOLDGATE').catch(() => null);
    if (!gg) return res.json({ code: 1, message: 'Goldgate not configured' });

    const result = await gg.handleTransaction(req.body, req.prisma);
    return res.json(result);
  } catch (err) {
    logger.error(`[Sports/Callback/Goldgate/transaction] ${err.message}`);
    return res.json({ code: 1, message: err.message });
  }
};

// ── TC Gaming Seamless ────────────────────────────────────────────────────────

exports.tcGamingSeamless = async (req, res) => {
  try {
    const tc = await getAggregator('TCGAMING').catch(() => null);
    if (!tc) return res.json({ status: 1002, message: 'TCGaming not configured' });

    const { params: encryptedParams, sign } = req.body;

    if (encryptedParams && sign) {
      if (!tc.verifySign(encryptedParams, sign)) {
        logger.warn('[Sports/Callback/TCGaming] Invalid signature');
        return res.json({ status: 9001, message: 'Invalid signature' });
      }
      const data   = tc.decrypt(encryptedParams);
      const result = await tc.handleSeamlessCallback(data, req.prisma);
      return res.json(result);
    }

    // Plain JSON (dev/test)
    const result = await tc.handleSeamlessCallback(req.body, req.prisma);
    return res.json(result);
  } catch (err) {
    logger.error(`[Sports/Callback/TCGaming] ${err.message}`);
    return res.json({ status: 9999, message: err.message });
  }
};
