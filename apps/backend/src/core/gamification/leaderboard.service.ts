// @ts-nocheck
/**
 * core/gamification/leaderboard.service.ts
 *
 * Unified leaderboard engine for Game, Sports, and Trade.
 * Supports multiple board types: points, bets_amount, wins, profit.
 * Rankings are cached in Redis and refreshed by a BullMQ worker every 5 minutes.
 *
 * Usage:
 *   const { LeaderboardService } = require('../../core/gamification/leaderboard.service');
 *   const svc = new LeaderboardService(prisma, 'game');
 *   const top = await svc.getTopN('points', 100);
 */
'use strict';

const logger       = require('../../shared/services/logger');
const cacheService = require('../../shared/services/cacheService');

// Board types per project
const BOARD_CONFIGS = Object.freeze({
  game:   ['points', 'bet_amount', 'win_count'],
  sports: ['points', 'bet_amount', 'win_count'],
  trade:  ['points', 'profit', 'trade_volume'],
  dating: ['points', 'matches'],
  hub:    ['points'],
});

const CACHE_TTL = 300; // 5 minutes

class LeaderboardService {
  /**
   * @param {object} prisma       – project Prisma client
   * @param {string} projectCode  – 'game' | 'sports' | 'trade' | 'dating' | 'hub'
   */
  constructor(prisma, projectCode) {
    this.prisma      = prisma;
    this.projectCode = projectCode;
  }

  /**
   * Get top N users for a given board type.
   * Results are cached in Redis for CACHE_TTL seconds.
   *
   * @param {'points'|'bet_amount'|'win_count'|'profit'|'trade_volume'|'matches'} boardType
   * @param {number} [limit=100]
   * @returns {Promise<Array<{ rank, userId, displayName, avatar, value }>>}
   */
  async getTopN(boardType, limit = 100) {
    const cacheKey = `leaderboard:${this.projectCode}:${boardType}:top${limit}`;
    return cacheService.remember(cacheKey, CACHE_TTL, async () => {
      return this._fetchBoard(boardType, limit);
    });
  }

  /**
   * Get the rank of a specific user on a given board.
   * @param {string} userId
   * @param {string} boardType
   */
  async getUserRank(userId, boardType) {
    const cacheKey = `leaderboard:${this.projectCode}:${boardType}:rank:${userId}`;
    return cacheService.remember(cacheKey, CACHE_TTL, async () => {
      const rows = await this._fetchBoard(boardType, 500);
      const idx  = rows.findIndex(r => r.userId === userId);
      return idx >= 0
        ? { rank: idx + 1, ...rows[idx] }
        : { rank: null, userId, displayName: null, value: 0 };
    });
  }

  /**
   * Force-refresh the cache for all boards in this project.
   * Called by the leaderboard BullMQ worker every 5 minutes.
   */
  async refreshCache() {
    const boards = BOARD_CONFIGS[this.projectCode] || ['points'];
    for (const boardType of boards) {
      await cacheService.del(`leaderboard:${this.projectCode}:${boardType}:top100`);
      await this.getTopN(boardType, 100);
    }
    logger.info(`[Leaderboard] cache refreshed for project=${this.projectCode}`);
  }

  /**
   * List all board types available for this project.
   */
  getBoardTypes() {
    return BOARD_CONFIGS[this.projectCode] || ['points'];
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  async _fetchBoard(boardType, limit) {
    switch (boardType) {
      case 'points':
        return this._byField('loyaltyPoints', 'desc', limit);
      case 'bet_amount':
        return this._byAggregatedBets('amount', limit);
      case 'win_count':
        return this._byAggregatedBets('wins', limit);
      case 'profit':
        return this._byProfit(limit);
      case 'trade_volume':
        return this._byTradeVolume(limit);
      case 'matches':
        return this._byMatches(limit);
      default:
        return this._byField('loyaltyPoints', 'desc', limit);
    }
  }

  async _byField(field, order, limit) {
    try {
      const rows = await this.prisma.user.findMany({
        where:   { status: 'active' },
        orderBy: { [field]: order },
        take:    limit,
        select:  { id: true, username: true, fullName: true, avatar: true, [field]: true },
      });
      return rows.map((r, i) => ({
        rank:        i + 1,
        userId:      r.id,
        displayName: r.fullName || r.username,
        avatar:      r.avatar || null,
        value:       Number(r[field] ?? 0),
      }));
    } catch {
      return [];
    }
  }

  async _byAggregatedBets(metric, limit) {
    try {
      const model = this.projectCode === 'sports' ? 'betSlip' : 'lotteryBet';
      const field = metric === 'amount' ? '_sum' : '_count';
      const rows  = await this.prisma[model].groupBy({
        by:      ['userId'],
        _sum:    { amount: true },
        _count:  { id: true },
        orderBy: { [field]: metric === 'amount' ? { amount: 'desc' } : { id: 'desc' } },
        take:    limit,
      });

      const userIds = rows.map(r => r.userId);
      const users   = await this.prisma.user.findMany({
        where:  { id: { in: userIds } },
        select: { id: true, username: true, fullName: true, avatar: true },
      });
      const userMap = Object.fromEntries(users.map(u => [u.id, u]));

      return rows.map((r, i) => {
        const u = userMap[r.userId] || {};
        return {
          rank:        i + 1,
          userId:      r.userId,
          displayName: u.fullName || u.username || 'Unknown',
          avatar:      u.avatar || null,
          value:       metric === 'amount'
            ? Number(r._sum?.amount ?? 0)
            : Number(r._count?.id ?? 0),
        };
      });
    } catch {
      return [];
    }
  }

  async _byProfit(limit) {
    try {
      const rows = await this.prisma.position.groupBy({
        by:      ['userId'],
        where:   { status: 'CLOSED' },
        _sum:    { profitLoss: true },
        orderBy: { _sum: { profitLoss: 'desc' } },
        take:    limit,
      });
      const userIds = rows.map(r => r.userId);
      const users   = await this.prisma.user.findMany({
        where:  { id: { in: userIds } },
        select: { id: true, username: true, fullName: true, avatar: true },
      });
      const userMap = Object.fromEntries(users.map(u => [u.id, u]));
      return rows.map((r, i) => {
        const u = userMap[r.userId] || {};
        return {
          rank:        i + 1,
          userId:      r.userId,
          displayName: u.fullName || u.username || 'Unknown',
          avatar:      u.avatar || null,
          value:       Number(r._sum?.profitLoss ?? 0),
        };
      });
    } catch {
      return [];
    }
  }

  async _byTradeVolume(limit) {
    try {
      const rows = await this.prisma.order.groupBy({
        by:      ['userId'],
        where:   { status: 'FILLED' },
        _sum:    { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take:    limit,
      });
      const userIds = rows.map(r => r.userId);
      const users   = await this.prisma.user.findMany({
        where:  { id: { in: userIds } },
        select: { id: true, username: true, fullName: true, avatar: true },
      });
      const userMap = Object.fromEntries(users.map(u => [u.id, u]));
      return rows.map((r, i) => {
        const u = userMap[r.userId] || {};
        return {
          rank:        i + 1,
          userId:      r.userId,
          displayName: u.fullName || u.username || 'Unknown',
          avatar:      u.avatar || null,
          value:       Number(r._sum?.amount ?? 0),
        };
      });
    } catch {
      return [];
    }
  }

  async _byMatches(limit) {
    return this._byField('matchCount', 'desc', limit);
  }
}

module.exports = { LeaderboardService };
