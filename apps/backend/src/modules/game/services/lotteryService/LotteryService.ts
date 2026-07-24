'use strict';
// backend/src/modules/game/services/lotteryService/LotteryService.js
const BaseService = require('../../../../shared/services/BaseService');

class LotteryService extends BaseService {
  constructor(prisma) {
    super(prisma, 'lotteryDraw');
  }

  async getDraws(where, skip, take) {
    return this.prisma.lotteryDraw.findMany({
      where,
      skip,
      take,
      orderBy: { drawTime: 'desc' },
      include: { type: true },
    });
  }
}

module.exports = LotteryService;
