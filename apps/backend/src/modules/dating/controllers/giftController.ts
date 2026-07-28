'use strict';
const { ok, created, error } = require('../../../shared/utils/network/response');
const GiftService = require('../services/giftService');

/**
 * GET /dating/gifts
 * Returns all available gifts (catalogue).
 */
exports.getGifts = async (req, res) => {
  try {
    const service = new GiftService(req.prisma);
    const gifts = await service.getActiveGifts();
    return ok(res, gifts);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

/**
 * POST /dating/gifts/send
 * Body: { receiverId, giftId, quantity?, streamId? }
 */
exports.sendGift = async (req, res) => {
  try {
    const { receiverId, giftId, quantity = 1, streamId = null } = req.body;
    if (!receiverId || !giftId) return error(res, 'receiverId and giftId are required', 400);
    const service = new GiftService(req.prisma);
    const result = await service.sendGift(req.user.id, receiverId, giftId, quantity, streamId);
    return created(res, result, 'Gift sent');
  } catch (e) {
    return error(res, e.message, 500);
  }
};
