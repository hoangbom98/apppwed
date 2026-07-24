'use strict';
const { ok, created, error, notFound } = require('../../../shared/utils/response');
const VipService = require('../services/vipService');

/**
 * GET /dating/vip/plans
 * Returns all available VIP plans.
 */
exports.getPlans = async (req, res) => {
  try {
    const plans = await req.prisma.vipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    return ok(res, plans);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

/**
 * GET /dating/vip/status
 * Returns the current user's VIP membership status.
 */
exports.getStatus = async (req, res) => {
  try {
    const membership = await req.prisma.vipMembership.findFirst({
      where:   { userId: req.user.id, status: 'active' },
      include: { plan: true },
      orderBy: { endDate: 'desc' },
    });
    return ok(res, { isVip: !!membership, membership: membership || null });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

/**
 * POST /dating/vip/subscribe
 * Body: { planId }
 * Deducts from wallet and creates a VipMembership record.
 */
exports.purchaseVip = async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) return error(res, 'planId is required', 400);

    const plan = await req.prisma.vipPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) return notFound(res, 'VIP plan not found or inactive');

    const service = new VipService(req.prisma);
    const result  = await service.purchaseVip(req.user.id, planId);
    return created(res, result, 'VIP membership activated');
  } catch (e) {
    return error(res, e.message, 500);
  }
};
