// @ts-nocheck
// source/backend/src/modules/sports/services/sportsProviderService.js
'use strict';
/**
 * Sports Aggregator Service
 *
 * Bridge layer connecting the Sports module to shared aggregator services
 * (GSC, Goldgate, TC Gaming).
 *
 * In the transfer-wallet model (mainly TC Gaming):
 *   1. User clicks "Play Sports" on the sports frontend
 *   2. Frontend calls POST /api/sports/provider/transfer-in  (move balance to product wallet)
 *   3. Frontend opens the launch URL                         (GET /api/sports/provider/launch)
 *   4. After session, POST /api/sports/provider/transfer-out (pull balance back)
 *
 * In the seamless-wallet model (GSC / Goldgate seamless):
 *   The aggregator calls our callback URLs for every bet/win.
 *   We handle these in sports/controllers/providerCallbackController.js.
 *
 * Aggregator configs live in game_db.gameAggregator (read-only from sports).
 * All balance mutations target sports_db (via this.prisma).
 *
 * Sports products to use for each aggregator:
 *   TCGaming  → UG2 (productCode 151), IMSB (68), BTI (47), SBO (54), PANDA (131)
 *   GSC       → SBO (productCode "1012"), FB SPORT ("1183"), IBC-SABA ("1046")
 *   Goldgate  → vendorCode "sbo", "fb-sports", depends on Goldgate catalog
 */
const { getAggregator } = require('../../../shared/services/aggregators');
const logger             = require('../../../shared/services/logger');

// Default TC Gaming sports product (United Gaming / UG2)
const TC_SPORTS_PRODUCT = '151';

class SportsProviderService {
  /** @param {import('@prisma/client').PrismaClient} prisma  sports_db client */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Sports Lobby Launch URL ───────────────────────────────────────────────

  /**
   * Get a sports betting lobby URL for a user via the specified aggregator.
   *
   * @param {string} aggregatorCode  'GSC' | 'GOLDGATE' | 'TCGAMING'
   * @param {string} userId          sports_db user ID
   * @param {object} opts
   *   productCode   TC Gaming product code (default '151' = UG2 Sports)
   *                 GSC product code string (e.g. '1012' = SBO)
   *                 Goldgate vendorCode     (e.g. 'sbo', 'fb-sports')
   *   gameCode      Optional game code (empty = open lobby)
   *   platform      'h5' | 'web'
   *   ip            Player IP
   *   language      'vi' | 'en' | 'zh'
   *   password      (GSC only) player password
   *   nickname      (GSC only) player nickname
   */
  async getSportsLobbyUrl(aggregatorCode, userId, opts = {}) {
    const {
      productCode = TC_SPORTS_PRODUCT,
      gameCode    = '',
      platform    = 'h5',
      ip          = '127.0.0.1',
      language    = 'vi',
      password    = '',
      nickname    = '',
    } = opts;

    const svc = await getAggregator(aggregatorCode);

    switch (aggregatorCode.toUpperCase()) {
      case 'TCGAMING':
        return svc.getLaunchUrl({
          username:    String(userId),
          productCode,
          gameCode,
          platform,
          ip,
          language,
        });

      case 'GOLDGATE':
        // productCode doubles as vendorCode for Goldgate
        return svc.getLaunchUrl(userId, productCode, gameCode || 'lobby', { language });

      case 'GSC':
        return svc.getLaunchUrl({
          userId,
          password,
          nickname,
          productCode,
          gameCode,
          gameType:  'SPORTS',
          platform:  platform.toUpperCase(),
          ip,
          language,
        });

      default:
        throw new Error(`Unsupported sports aggregator: ${aggregatorCode}`);
    }
  }

  // ── Transfer-wallet Fund Operations (TC Gaming / GSC transfer) ────────────

  /**
   * Move funds from sports_db wallet → TC Gaming product wallet before betting.
   *
   * @param {string}       aggregatorCode  'TCGAMING' | 'GSC'
   * @param {string}       userId          sports_db user ID
   * @param {string}       productCode     TC Gaming product code (e.g. '151')
   * @param {number}       amount
   * @param {string}       referenceNo     Unique order ID
   */
  async transferInToAggregator(aggregatorCode, userId, productCode, amount, referenceNo) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, username: true, balance: true },
    });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    if (Number(user.balance) < amount) {
      throw Object.assign(new Error('Insufficient balance'), { status: 400 });
    }

    const svc = await getAggregator(aggregatorCode);

    // Deduct from sports_db wallet (freeze while transferring)
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data:  { balance: { decrement: amount }, frozen: { increment: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          type:          'aggregator_transfer_out',
          amount:        -amount,
          balanceBefore: Number(user.balance),
          balanceAfter:  Number(user.balance) - amount,
          referenceId:   referenceNo,
          referenceType: `${aggregatorCode.toLowerCase()}_transfer`,
          note:          `Transfer to ${aggregatorCode} product=${productCode}`,
        },
      }),
    ]);

    // Push to aggregator
    try {
      if (aggregatorCode.toUpperCase() === 'TCGAMING') {
        await svc.transferIn(String(userId), productCode, amount, referenceNo);
      }
      // GSC uses same seamless wallet — no explicit fund transfer needed for seamless
      // If using GSC transfer model, the fund push happens here
    } catch (err) {
      // Rollback on aggregator failure
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data:  { balance: { increment: amount }, frozen: { decrement: amount } },
        }),
        this.prisma.transaction.create({
          data: {
            userId,
            type:          'aggregator_transfer_rollback',
            amount,
            balanceBefore: Number(user.balance) - amount,
            balanceAfter:  Number(user.balance),
            referenceId:   referenceNo,
            referenceType: `${aggregatorCode.toLowerCase()}_transfer`,
            note:          `Rollback: ${err.message}`,
          },
        }),
      ]);
      throw err;
    }

    // Confirm: unfreeze (balance already decremented)
    await this.prisma.user.update({
      where: { id: userId },
      data:  { frozen: { decrement: amount } },
    });

    logger.info(`[SportsAggregator] transferIn userId=${userId} agg=${aggregatorCode} product=${productCode} amt=${amount}`);
    return { success: true, amount };
  }

  /**
   * Pull ALL funds back from TC Gaming product wallet → sports_db wallet.
   *
   * @param {string} aggregatorCode
   * @param {string} userId
   * @param {string} productCode
   * @param {string} referenceNo
   */
  async transferOutFromAggregator(aggregatorCode, userId, productCode, referenceNo) {
    const svc = await getAggregator(aggregatorCode);

    // Query current balance in product wallet
    let productBalance = 0;
    if (aggregatorCode.toUpperCase() === 'TCGAMING') {
      const result  = await svc.getProductBalance(String(userId), productCode);
      productBalance = Number(result?.balance || result?.credit || 0);
      if (productBalance <= 0) return { success: true, amount: 0, message: 'No funds in product wallet' };
      await svc.transferOutAll(String(userId), productCode, referenceNo);
    }
    // Goldgate / GSC seamless — no explicit fund pull (balance stays on our side)

    if (productBalance > 0) {
      // Read current balance to record balanceBefore/After accurately
      const cur = await this.prisma.user.findUnique({
        where:  { id: userId },
        select: { balance: true },
      });
      const balanceBefore = Number(cur?.balance ?? 0);

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data:  { balance: { increment: productBalance } },
        }),
        this.prisma.transaction.create({
          data: {
            userId,
            type:          'aggregator_transfer_in',
            amount:        productBalance,
            balanceBefore,
            balanceAfter:  balanceBefore + productBalance,
            referenceId:   referenceNo,
            referenceType: `${aggregatorCode.toLowerCase()}_transfer`,
            note:          `Transfer back from ${aggregatorCode} product=${productCode}`,
          },
        }),
      ]);
    }

    logger.info(`[SportsAggregator] transferOut userId=${userId} agg=${aggregatorCode} product=${productCode} amt=${productBalance}`);
    return { success: true, amount: productBalance };
  }

  // ── Sync Aggregator Odds → sports_db ─────────────────────────────────────

  /**
   * Upsert BetMarket + BetOdds from aggregator's live odds snapshot.
   * Called by admin or a cron job to keep sports_db odds in sync.
   *
   * @param {string}   aggregatorCode  'GSC' | 'GOLDGATE' | 'TCGAMING'
   * @param {string}   matchId         sports_db match ID
   * @param {object[]} oddsData        [{
   *   marketType, name, providerEventId,
   *   selections: [{ selection, label, odds, handicap?, lineValue? }]
   * }]
   */
  async syncAggregatorOdds(aggregatorCode, matchId, oddsData) {
    let synced = 0;
    for (const marketDef of oddsData) {
      const { marketType, name, providerEventId, selections = [] } = marketDef;

      const market = await this.prisma.betMarket.upsert({
        where:  { providerCode_providerEventId: { providerCode: aggregatorCode, providerEventId } },
        update: { name, providerData: marketDef, status: 'open', updatedAt: new Date() },
        create: { matchId, marketType, name, providerCode: aggregatorCode, providerEventId, providerData: marketDef, status: 'open' },
      });

      for (const sel of selections) {
        await this.prisma.betOdds.upsert({
          where:  { marketId_selection: { marketId: market.id, selection: sel.selection } },
          update: { odds: sel.odds, handicap: sel.handicap ?? null, lineValue: sel.lineValue ?? null, label: sel.label, status: 'active' },
          create: { marketId: market.id, selection: sel.selection, label: sel.label, odds: sel.odds, handicap: sel.handicap ?? null, lineValue: sel.lineValue ?? null, status: 'active' },
        });
      }
      synced++;
    }

    logger.info(`[SportsAggregator] syncOdds agg=${aggregatorCode} matchId=${matchId} markets=${synced}`);
    return { synced };
  }
}

module.exports = SportsProviderService;
