'use strict';
// backend/src/modules/game/services/gameService/GameService.js
const BaseService = require('../../../../shared/services/BaseService');

class GameService extends BaseService {
  constructor(prisma) {
    super(prisma, 'game');
  }

  async getGames(where, skip, take) {
    return this.prisma.game.findMany({
      where,
      skip,
      take,
      orderBy: { sortOrder: 'asc' },
      include: { category: true },
    });
  }
}

module.exports = GameService;
