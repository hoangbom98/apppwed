// @ts-nocheck
'use strict';
/**
 * giftCodeController.ts
 *
 * Routes:
 *   POST /game/giftcode/redeem      — user: redeem a gift code
 *   GET  /game/giftcode/history     — user: redemption history
 */

const { success, error, badRequest } = require('../../../shared/utils/network/response');
const GiftCodeService = require('../services/giftCodeService');

// ── POST /game/giftcode/redeem ────────────────────────────────────────────────
exports.redeem = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return badRequest(res, 'code is required');
    }

    const result = await GiftCodeService.redeem(req.user.id, code.trim());
    return success(res, result, 'Gift code redeemed successfully');
  } catch (e) {
    const clientCodes = [
      'GIFTCODE_NOT_FOUND', 'GIFTCODE_EXPIRED', 'GIFTCODE_DEPLETED',
      'GIFTCODE_ALREADY_USED', 'GIFTCODE_VIP_REQUIRED',
    ];
    const status = clientCodes.includes(e.code) ? 400 : 500;
    return error(res, e.message, status);
  }
};

// ── GET /game/giftcode/history ────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const history = await GiftCodeService.getUserRedemptions(req.user.id);
    return success(res, history);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
