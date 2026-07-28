const { success, error } = require('../../../shared/utils/network/response');
const GiftService = require('../services/giftService');
const VipService = require('../services/vipService');

exports.sendGift = async (req, res) => {
  try {
    const service = new GiftService(req.prisma);
    const result = await service.sendGift(req.user.id, req.body.receiverId, req.body.giftId, req.body.quantity);
    return success(res, result, 'Gift sent', 201);
  } catch (e) { return error(res, e.message); }
};

exports.purchaseVip = async (req, res) => {
  try {
    const service = new VipService(req.prisma);
    const result = await service.purchaseVip(req.user.id, req.body.planId);
    return success(res, result, 'VIP purchased', 201);
  } catch (e) { return error(res, e.message); }
};
