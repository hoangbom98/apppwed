// source/backend/src/modules/sports/controllers/sportsProviderController.js
'use strict';
/**
 * Sports Aggregator Controller
 *
 * Handles:
 *   GET  /api/sports/provider/launch        — get sports lobby URL from aggregator
 *   POST /api/sports/provider/transfer-in   — move funds sports_db → aggregator product wallet
 *   POST /api/sports/provider/transfer-out  — pull funds aggregator → sports_db
 *   POST /api/sports/provider/sync-odds     — (admin) sync aggregator odds into sports_db
 *
 * Aggregators: GSC | GOLDGATE | TCGAMING
 *
 * TC Gaming sports products:
 *   151 = United Gaming (UG2) — primary sports
 *   131 = Panda Sports
 *    68 = IMSB Sports
 *    47 = BTI Sports
 *    54 = SBO Sports
 *   104 = CMD368 Sports
 */
const SportsProviderService     = require('../services/sportsProviderService');
const { success, error, badRequest } = require('../../../shared/utils/response');

// ── GET /api/sports/provider/launch ──────────────────────────────────────────

exports.launch = async (req, res) => {
  try {
    const {
      aggregator   = 'TCGAMING',
      productCode  = '151',       // UG2 Sports by default
      gameCode     = '',
      platform     = 'h5',
      language     = 'vi',
    } = req.query;

    const svc = new SportsProviderService(req.prisma);
    const url = await svc.getSportsLobbyUrl(aggregator.toUpperCase(), req.user.id, {
      productCode,
      gameCode,
      platform,
      language,
      ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    });

    return success(res, { url, aggregator, productCode });
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

// ── POST /api/sports/provider/transfer-in ────────────────────────────────────

exports.transferIn = async (req, res) => {
  try {
    const {
      aggregator  = 'TCGAMING',
      productCode = '151',
      amount,
    } = req.body;

    if (!amount || parseFloat(amount) <= 0) return badRequest(res, 'amount phải lớn hơn 0');

    const referenceNo = `SPORT-IN-${Date.now()}-${req.user.id}`;
    const svc         = new SportsProviderService(req.prisma);
    const result      = await svc.transferInToAggregator(
      aggregator.toUpperCase(), req.user.id, productCode, parseFloat(amount), referenceNo,
    );

    return success(res, { ...result, referenceNo, aggregator, productCode });
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

// ── POST /api/sports/provider/transfer-out ───────────────────────────────────

exports.transferOut = async (req, res) => {
  try {
    const {
      aggregator  = 'TCGAMING',
      productCode = '151',
    } = req.body;

    const referenceNo = `SPORT-OUT-${Date.now()}-${req.user.id}`;
    const svc         = new SportsProviderService(req.prisma);
    const result      = await svc.transferOutFromAggregator(
      aggregator.toUpperCase(), req.user.id, productCode, referenceNo,
    );

    return success(res, { ...result, referenceNo, aggregator, productCode });
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

// ── POST /api/sports/provider/sync-odds (admin only) ─────────────────────────

exports.syncOdds = async (req, res) => {
  try {
    const { aggregator, matchId, oddsData } = req.body;
    if (!aggregator || !matchId || !Array.isArray(oddsData)) {
      return badRequest(res, 'aggregator, matchId, oddsData[] đều bắt buộc');
    }

    const svc    = new SportsProviderService(req.prisma);
    const result = await svc.syncAggregatorOdds(aggregator.toUpperCase(), matchId, oddsData);
    return success(res, result, `Đã sync ${result.synced} markets từ ${aggregator}`);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
