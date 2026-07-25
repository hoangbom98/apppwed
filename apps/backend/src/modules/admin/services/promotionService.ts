// @ts-nocheck
'use strict';
/**
 * PromotionService (Admin) — promotion/campaign lifecycle management.
 *
 * Reads/writes game_db: Promotion, PromotionClaim models.
 * BoYue equivalent: caipiao_activity / caipiao_huodong.
 *
 * Exposed methods:
 *   list({ skip, take, where })              — paginated promotion list
 *   getById(id)                              — single promotion with claim stats
 *   create(data)                             — create promotion
 *   update(id, data)                         — update promotion fields
 *   toggleStatus(id)                         — active ↔ inactive toggle
 *   getActivePromotions()                    — active promotions for user-facing APIs
 *   getClaims({ promotionId, skip, take })   — paginated claim records
 *   getStats()                               — promotion stats for admin dashboard
 */

const { getPrismaClient } = require('../../../config/databases');

const gameDb = () => getPrismaClient('game');

// ─────────────────────────────────────────────────────────────────────────────
// List
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paginated promotion list with claim counts.
 * @param {{ skip?, take?, where? }} opts
 */
async function list({ skip = 0, take = 20, where = {} } = {}) {
  const db = gameDb();
  const [data, total] = await Promise.all([
    db.promotion.findMany({
      where,
      skip,
      take,
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { claims: true } } },
    }),
    db.promotion.count({ where }),
  ]);
  return { data, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Get by ID
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Single promotion with claim stats.
 * @param {string} id
 */
async function getById(id) {
  const db   = gameDb();
  const promo = await db.promotion.findUnique({
    where:   { id },
    include: { _count: { select: { claims: true } } },
  });
  if (!promo) return null;

  const claimAgg = await db.promotionClaim.aggregate({
    where: { promotionId: id },
    _sum:  { bonusAmount: true },
  });

  return {
    ...promo,
    totalBonusAwarded: Number(claimAgg._sum.bonusAmount ?? 0),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new promotion.
 * @param {{ type, title, slug, bonusType, bonusValue, minDeposit?, maxBonus?, wagerMultiplier?, maxUses?, maxUsesPerUser?, status?, startDate?, endDate?, sortOrder?, description?, image? }} data
 */
async function create(data) {
  const {
    type, title, slug, bonusType, bonusValue,
    minDeposit = 0, maxBonus = null, wagerMultiplier = 1,
    maxUses = null, maxUsesPerUser = 1,
    status = 'active', startDate = null, endDate = null,
    sortOrder = 0, description = null, image = null,
  } = data;

  return gameDb().promotion.create({
    data: {
      type, title, slug, bonusType,
      bonusValue: +bonusValue,
      minDeposit:  +minDeposit,
      maxBonus:    maxBonus != null ? +maxBonus : null,
      wagerMultiplier: +wagerMultiplier,
      maxUses,
      maxUsesPerUser,
      status,
      startDate:   startDate ? new Date(startDate) : null,
      endDate:     endDate   ? new Date(endDate)   : null,
      sortOrder,
      description,
      image,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Update
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Partial update — only supplied fields are updated.
 * @param {string} id
 * @param {object} data
 */
async function update(id, data) {
  const allowed = [
    'title', 'description', 'image', 'bonusValue', 'minDeposit', 'maxBonus',
    'wagerMultiplier', 'maxUses', 'maxUsesPerUser', 'status',
    'startDate', 'endDate', 'sortOrder',
  ];
  const updateData = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updateData[key] = (key === 'startDate' || key === 'endDate')
        ? (data[key] ? new Date(data[key]) : null)
        : data[key];
    }
  }

  return gameDb().promotion.update({ where: { id }, data: updateData });
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toggle promotion status active ↔ inactive.
 * @param {string} id
 */
async function toggleStatus(id) {
  const promo = await gameDb().promotion.findUnique({ where: { id }, select: { status: true } });
  if (!promo) throw Object.assign(new Error('Promotion not found'), { code: 'RESOURCE_NOT_FOUND' });

  const newStatus = promo.status === 'active' ? 'inactive' : 'active';
  return gameDb().promotion.update({ where: { id }, data: { status: newStatus } });
}

// ─────────────────────────────────────────────────────────────────────────────
// Active promotions (user-facing)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all currently active and in-date promotions.
 */
async function getActivePromotions() {
  const now = new Date();
  return gameDb().promotion.findMany({
    where: {
      status: 'active',
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    },
    orderBy: { sortOrder: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Claims
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paginated claim records for a promotion.
 * @param {{ promotionId?, userId?, status?, skip?, take? }} opts
 */
async function getClaims({ promotionId, userId, status, skip = 0, take = 20 } = {}) {
  const db    = gameDb();
  const where = {};
  if (promotionId) where.promotionId = promotionId;
  if (userId)      where.userId      = userId;
  if (status)      where.status      = status;

  const [data, total] = await Promise.all([
    db.promotionClaim.findMany({
      where,
      skip,
      take,
      orderBy: { claimedAt: 'desc' },
      include: {
        user:      { select: { id: true, username: true, vipLevel: true } },
        promotion: { select: { id: true, title: true, type: true } },
      },
    }),
    db.promotionClaim.count({ where }),
  ]);

  return { data, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Promotion stats for admin dashboard.
 */
async function getStats() {
  const db = gameDb();

  const [activeCount, totalClaims, bonusAgg] = await Promise.all([
    db.promotion.count({ where: { status: 'active' } }),
    db.promotionClaim.count(),
    db.promotionClaim.aggregate({ _sum: { bonusAmount: true } }),
  ]);

  const todayClaims = await db.promotionClaim.count({
    where: { claimedAt: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
  });

  return {
    activePromotions:   activeCount,
    totalClaims,
    todayClaims,
    totalBonusAwarded: Number(bonusAgg._sum.bonusAmount ?? 0),
  };
}

module.exports = { list, getById, create, update, toggleStatus, getActivePromotions, getClaims, getStats };
