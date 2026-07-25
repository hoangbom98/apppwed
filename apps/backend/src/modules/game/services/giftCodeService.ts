// @ts-nocheck
'use strict';
/**
 * GiftCodeService — gift code creation, redemption, and management.
 *
 * Reads/writes game_db: GiftCode, GiftCodeRedemption, User, Transaction.
 * BoYue equivalent: caipiao_giftcode / caipiao_cdkey.
 *
 * Exposed methods:
 *   create(data)                   — admin: create gift code
 *   update(id, data)               — admin: update gift code
 *   list({ skip, take, where })    — admin: paginated list
 *   getRedemptions(giftCodeId)     — admin: who redeemed
 *   redeem(userId, code)           — user: redeem a gift code (atomic)
 *   getUserRedemptions(userId)     — user: their redemption history
 */

const { getPrismaClient } = require('../../../config/databases');

const gameDb = () => getPrismaClient('game');

// ─────────────────────────────────────────────────────────────────────────────
// Admin: Create
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new gift code.
 * @param {{ code, rewardType, rewardAmount, maxUses?, maxPerUser?, minVipLevel?, startDate?, endDate?, note? }} data
 */
async function create(data) {
  const {
    code, rewardType, rewardAmount,
    maxUses = null, maxPerUser = 1, minVipLevel = 0,
    startDate = null, endDate = null, note = null,
  } = data;

  if (!code || !rewardType || rewardAmount == null) {
    throw Object.assign(new Error('code, rewardType, and rewardAmount are required'), { code: 'VALIDATION_ERROR' });
  }

  return gameDb().giftCode.create({
    data: {
      code:         code.toUpperCase().trim(),
      rewardType,
      rewardAmount: +rewardAmount,
      maxUses,
      maxPerUser:   +maxPerUser,
      minVipLevel:  +minVipLevel,
      startDate:    startDate ? new Date(startDate) : null,
      endDate:      endDate   ? new Date(endDate)   : null,
      note,
      status:       'active',
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin: Update
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update gift code fields.
 * @param {string} id
 * @param {object} data
 */
async function update(id, data) {
  const allowed = ['rewardAmount', 'maxUses', 'maxPerUser', 'minVipLevel', 'startDate', 'endDate', 'note', 'status'];
  const updateData = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updateData[key] = (key === 'startDate' || key === 'endDate')
        ? (data[key] ? new Date(data[key]) : null)
        : data[key];
    }
  }
  return gameDb().giftCode.update({ where: { id }, data: updateData });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin: List
// ─────────────────────────────────────────────────────────────────────────────

async function list({ skip = 0, take = 20, where = {} } = {}) {
  const db = gameDb();
  const [data, total] = await Promise.all([
    db.giftCode.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { redemptions: true } } },
    }),
    db.giftCode.count({ where }),
  ]);
  return { data, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin: Redemptions
// ─────────────────────────────────────────────────────────────────────────────

async function getRedemptions(giftCodeId, { skip = 0, take = 50 } = {}) {
  const db = gameDb();
  const [data, total] = await Promise.all([
    db.giftCodeRedemption.findMany({
      where:   { giftCodeId },
      skip,
      take,
      orderBy: { redeemedAt: 'desc' },
    }),
    db.giftCodeRedemption.count({ where: { giftCodeId } }),
  ]);
  return { data, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// User: Redeem
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Redeem a gift code for a user.
 * Validates: exists, active, not expired, not depleted, VIP requirement, per-user limit.
 * Atomically: credits balance + creates redemption record + updates usedCount.
 *
 * @param {string} userId
 * @param {string} code   alphanumeric code (case-insensitive)
 * @returns {Promise<{ rewardType: string, rewardAmount: number }>}
 */
async function redeem(userId, code) {
  const db         = gameDb();
  const normalCode = code.toUpperCase().trim();

  const giftCode = await db.giftCode.findUnique({ where: { code: normalCode } });

  if (!giftCode) {
    throw Object.assign(new Error('Gift code not found'), { code: 'GIFTCODE_NOT_FOUND' });
  }

  const now = new Date();

  // Validity checks
  if (giftCode.status !== 'active') {
    throw Object.assign(new Error('Gift code is inactive or depleted'), { code: 'GIFTCODE_DEPLETED' });
  }
  if (giftCode.endDate && giftCode.endDate < now) {
    throw Object.assign(new Error('Gift code has expired'), { code: 'GIFTCODE_EXPIRED' });
  }
  if (giftCode.startDate && giftCode.startDate > now) {
    throw Object.assign(new Error('Gift code is not active yet'), { code: 'GIFTCODE_NOT_FOUND' });
  }
  if (giftCode.maxUses !== null && giftCode.usedCount >= giftCode.maxUses) {
    throw Object.assign(new Error('Gift code has been fully redeemed'), { code: 'GIFTCODE_DEPLETED' });
  }

  // Per-user limit
  const userRedemptionCount = await db.giftCodeRedemption.count({
    where: { giftCodeId: giftCode.id, userId },
  });
  if (userRedemptionCount >= giftCode.maxPerUser) {
    throw Object.assign(new Error('You have already redeemed this gift code'), { code: 'GIFTCODE_ALREADY_USED' });
  }

  // VIP requirement
  if (giftCode.minVipLevel > 0) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { vipLevel: true } });
    if (!user || user.vipLevel < giftCode.minVipLevel) {
      throw Object.assign(
        new Error(`VIP level ${giftCode.minVipLevel} required`),
        { code: 'GIFTCODE_VIP_REQUIRED' }
      );
    }
  }

  // Atomic redemption
  await db.$transaction(async (tx) => {
    // 1. Create redemption record (will throw unique constraint if duplicate — safety net)
    await tx.giftCodeRedemption.create({
      data: { giftCodeId: giftCode.id, userId, rewardAmount: giftCode.rewardAmount },
    });

    // 2. Increment usedCount + auto-mark depleted if maxUses hit
    const newUsedCount = giftCode.usedCount + 1;
    await tx.giftCode.update({
      where: { id: giftCode.id },
      data:  {
        usedCount: newUsedCount,
        status:    (giftCode.maxUses !== null && newUsedCount >= giftCode.maxUses)
          ? 'depleted'
          : giftCode.status,
      },
    });

    // 3. Credit user balance
    const updated = await tx.user.update({
      where:  { id: userId },
      data:   { balance: { increment: giftCode.rewardAmount } },
      select: { balance: true },
    });

    // 4. Transaction record
    await tx.transaction.create({
      data: {
        userId,
        type:          'giftcode',
        amount:        giftCode.rewardAmount,
        balanceBefore: +updated.balance - +giftCode.rewardAmount,
        balanceAfter:  +updated.balance,
        referenceId:   giftCode.id,
        referenceType: 'gift_code',
        note:          `Gift code redeemed: ${normalCode}`,
      },
    });
  });

  return { rewardType: giftCode.rewardType, rewardAmount: Number(giftCode.rewardAmount) };
}

// ─────────────────────────────────────────────────────────────────────────────
// User: Redemption history
// ─────────────────────────────────────────────────────────────────────────────

async function getUserRedemptions(userId) {
  return gameDb().giftCodeRedemption.findMany({
    where:   { userId },
    orderBy: { redeemedAt: 'desc' },
    include: { giftCode: { select: { code: true, rewardType: true } } },
  });
}

module.exports = { create, update, list, getRedemptions, redeem, getUserRedemptions };
