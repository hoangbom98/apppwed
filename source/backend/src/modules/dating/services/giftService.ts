'use strict';
/**
 * dating/services/giftService.js
 *
 * Business logic for sending gifts.
 * DB models: Gift, GiftSend
 * Wallet: User.coins (Decimal column on users table — no separate wallet model in dating schema)
 */
const BaseService = require('../../../shared/services/BaseService');

class GiftService extends BaseService {
  constructor(prisma) {
    super(prisma, 'gift');
  }

  async getActiveGifts() {
    return this.prisma.gift.findMany({
      where:   { status: 'active' },
      orderBy: [{ sortOrder: 'asc' }, { category: 'asc' }],
    });
  }

  /**
   * Send a gift from senderId → receiverId.
   * Deducts coinCost × quantity from sender's User.coins.
   */
  async sendGift(senderId, receiverId, giftId, quantity = 1, liveStreamId = null) {
    return this.prisma.$transaction(async (tx) => {
      const gift = await tx.gift.findUnique({ where: { id: giftId } });
      if (!gift || gift.status !== 'active') throw new Error('Gift not found or inactive');

      const totalCost = Number(gift.coinCost) * quantity;

      const sender = await tx.user.findUnique({ where: { id: senderId } });
      if (!sender) throw new Error('Sender not found');
      if (Number(sender.coins) < totalCost) throw new Error('Insufficient coins');

      // Deduct coins from sender
      await tx.user.update({
        where: { id: senderId },
        data:  { coins: { decrement: totalCost } },
      });

      // Credit coins to receiver (platform keeps a cut via separate settlement if needed)
      await tx.user.update({
        where: { id: receiverId },
        data:  { coins: { increment: totalCost } },
      });

      // Record the gift send
      const giftSend = await tx.giftSend.create({
        data: { giftId, senderId, receiverId, quantity, coinValue: totalCost, liveStreamId },
      });

      return giftSend;
    });
  }
}

module.exports = GiftService;
