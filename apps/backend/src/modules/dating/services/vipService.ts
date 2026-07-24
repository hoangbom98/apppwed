// VipService.js
const BaseService = require('../../../shared/services/BaseService');
class VipService extends BaseService {
  constructor(prisma) { super(prisma, 'vipPlan'); }
  async purchaseVip(userId, planId) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.vipPlan.findUnique({ where: { id: planId } });
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (Number(wallet.balance) < Number(plan.price)) throw new Error('Insufficient funds');
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: Number(plan.price) } } });
      return await tx.vipHistory.create({ data: { userId, planId, tier: plan.tier, price: plan.price, startDate: new Date() } });
    });
  }
}
module.exports = VipService;
