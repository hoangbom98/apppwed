// backend/src/modules/game/controllers/providerCallbackController.js
/**
 * Game Provider Callback Controller
 *
 * Handles all incoming seamless callbacks from aggregator services.
 * In this context req.prisma = game_db client.
 *
 * Routes:
 *   POST /api/game/callbacks/gsc                     — GSC balance/transaction
 *   POST /api/game/callbacks/goldgate/balance         — Goldgate balance inquiry
 *   POST /api/game/callbacks/goldgate/transaction     — Goldgate transaction
 *   POST /api/game/callbacks/tc-gaming/seamless       — TC Gaming seamless (sgb/db/cr)
 */
const { getAggregator } = require('../../../shared/services/aggregators');
const logger            = require('../../../shared/services/logger');

// ── GSC ───────────────────────────────────────────────────────────────────────

exports.gsc = async (req, res) => {
  try {
    const gsc    = await getAggregator('GSC').catch(() => null);
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
    logger.error(`[Game/Callback/GSC] ${err.message}`);
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
    logger.error(`[Game/Callback/Goldgate/balance] ${err.message}`);
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
    logger.error(`[Game/Callback/Goldgate/transaction] ${err.message}`);
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
      // Verify signature
      if (!tc.verifySign(encryptedParams, sign)) {
        logger.warn('[Game/Callback/TCGaming] Invalid signature');
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
    logger.error(`[Game/Callback/TCGaming] ${err.message}`);
    return res.json({ status: 9999, message: err.message });
  }
};
