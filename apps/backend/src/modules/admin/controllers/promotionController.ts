// @ts-nocheck
// backend/src/modules/admin/controllers/promotionController.ts
// Promotion management — full CRUD + participant management
//   GET    /api/admin/promotions                        — list promotions
//   GET    /api/admin/promotions/:id                   — promotion detail
//   POST   /api/admin/promotions                       — create promotion
//   PATCH  /api/admin/promotions/:id                   — update promotion
//   DELETE /api/admin/promotions/:id                   — delete/archive promotion
//   PATCH  /api/admin/promotions/:id/status            — toggle status
//   GET    /api/admin/promotions/:id/participants      — list participants
//   PATCH  /api/admin/promotions/participants/:pid/cancel — cancel participant
'use strict';
const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error, notFound, created, paginate } = require('../../../shared/utils/network/response');

// ── List promotions ──────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const db = getPrismaClient('admin');
    const { page = 1, limit = 20, type, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (type)   where.type   = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [promotions, total] = await Promise.all([
      db.promotion.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: { select: { participants: true } },
        },
      }),
      db.promotion.count({ where }),
    ]);

    return paginate(res, promotions, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Promotion detail ─────────────────────────────────────────────────────────
exports.getDetail = async (req, res) => {
  try {
    const db     = getPrismaClient('admin');
    const { id } = req.params;

    const promotion = await db.promotion.findUnique({
      where:   { id },
      include: {
        _count:       { select: { participants: true } },
        participants: {
          orderBy: { joinedAt: 'desc' },
          take:    10,
        },
      },
    });
    if (!promotion) return notFound(res, 'Promotion not found');

    return success(res, promotion);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Create promotion ─────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const db   = getPrismaClient('admin');
    const data = req.body;

    if (!data.title || !data.type || !data.startDate || !data.endDate)
      return error(res, 'title, type, startDate, endDate are required', 400);

    const promotion = await db.promotion.create({
      data: {
        title:          data.title,
        description:    data.description    || null,
        shortDesc:      data.shortDesc      || null,
        imageUrl:       data.imageUrl       || null,
        type:           data.type,
        valueType:      data.valueType      || 'FIXED',
        value:          Number(data.value   || 0),
        conditions:     data.conditions     || null,
        startDate:      new Date(data.startDate),
        endDate:        new Date(data.endDate),
        maxUses:        data.maxUses        ? Number(data.maxUses) : null,
        maxUsesPerUser: Number(data.maxUsesPerUser || 1),
        status:         data.status         || 'ACTIVE',
        sortOrder:      Number(data.sortOrder || 0),
      },
    });

    return created(res, promotion, 'Promotion created');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Update promotion ─────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const db     = getPrismaClient('admin');
    const { id } = req.params;
    const data   = req.body;

    const exists = await db.promotion.findUnique({ where: { id } });
    if (!exists) return notFound(res, 'Promotion not found');

    const patch = {};
    if (data.title         !== undefined) patch.title         = data.title;
    if (data.description   !== undefined) patch.description   = data.description;
    if (data.shortDesc     !== undefined) patch.shortDesc     = data.shortDesc;
    if (data.imageUrl      !== undefined) patch.imageUrl      = data.imageUrl;
    if (data.type          !== undefined) patch.type          = data.type;
    if (data.valueType     !== undefined) patch.valueType     = data.valueType;
    if (data.value         !== undefined) patch.value         = Number(data.value);
    if (data.conditions    !== undefined) patch.conditions    = data.conditions;
    if (data.startDate     !== undefined) patch.startDate     = new Date(data.startDate);
    if (data.endDate       !== undefined) patch.endDate       = new Date(data.endDate);
    if (data.maxUses       !== undefined) patch.maxUses       = data.maxUses ? Number(data.maxUses) : null;
    if (data.maxUsesPerUser!== undefined) patch.maxUsesPerUser = Number(data.maxUsesPerUser);
    if (data.status        !== undefined) patch.status        = data.status;
    if (data.sortOrder     !== undefined) patch.sortOrder     = Number(data.sortOrder);

    const promotion = await db.promotion.update({ where: { id }, data: patch });
    return success(res, promotion, 'Promotion updated');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Toggle promotion status ───────────────────────────────────────────────────
exports.toggleStatus = async (req, res) => {
  try {
    const db          = getPrismaClient('admin');
    const { id }      = req.params;
    const { status }  = req.body;

    const valid = ['ACTIVE', 'INACTIVE', 'EXPIRED', 'SCHEDULED'];
    if (!valid.includes(status))
      return error(res, `Status must be one of: ${valid.join(', ')}`, 400);

    const exists = await db.promotion.findUnique({ where: { id } });
    if (!exists) return notFound(res, 'Promotion not found');

    await db.promotion.update({ where: { id }, data: { status } });
    return success(res, { id, status }, `Status updated to ${status}`);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Delete promotion (soft: set status INACTIVE) ─────────────────────────────
exports.remove = async (req, res) => {
  try {
    const db     = getPrismaClient('admin');
    const { id } = req.params;

    const exists = await db.promotion.findUnique({ where: { id } });
    if (!exists) return notFound(res, 'Promotion not found');

    // Soft delete — mark INACTIVE so historical records remain
    await db.promotion.update({ where: { id }, data: { status: 'INACTIVE' } });
    return success(res, { id }, 'Promotion deactivated');
  } catch (e) { return error(res, e.message, 500); }
};

// ── List participants ─────────────────────────────────────────────────────────
exports.listParticipants = async (req, res) => {
  try {
    const db            = getPrismaClient('admin');
    const { id }        = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const skip          = (Number(page) - 1) * Number(limit);

    const where = { promotionId: id };
    if (status) where.status = status;

    const [participants, total] = await Promise.all([
      db.promotionParticipant.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { joinedAt: 'desc' },
      }),
      db.promotionParticipant.count({ where }),
    ]);

    return paginate(res, participants, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Cancel participant ────────────────────────────────────────────────────────
exports.cancelParticipant = async (req, res) => {
  try {
    const db          = getPrismaClient('admin');
    const { pid }     = req.params;

    const participant = await db.promotionParticipant.findUnique({ where: { id: pid } });
    if (!participant) return notFound(res, 'Participant not found');
    if (participant.status === 'CANCELLED') return error(res, 'Already cancelled', 400);

    await db.promotionParticipant.update({
      where: { id: pid },
      data:  { status: 'CANCELLED' },
    });
    return success(res, { id: pid }, 'Participant cancelled');
  } catch (e) { return error(res, e.message, 500); }
};
