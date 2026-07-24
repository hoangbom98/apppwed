// @ts-nocheck
'use strict';
/**
 * hub/controllers/eventController.js
 * DB model: Event, EventRegistration (all CUID string IDs)
 * Event fields: id, title, slug, description, image, startAt, endAt, location, maxAttendees, status
 * EventRegistration fields: id, eventId, userId, name, email, phone, status
 */
const { success, created, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');

exports.list = async (req, res) => {
  try {
    const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
    const where = { status: 'upcoming' };
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      req.prisma.event.findMany({ where, skip, take, orderBy: { startAt: 'asc' } }),
      req.prisma.event.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.get = async (req, res) => {
  try {
    const item = await req.prisma.event.findUnique({ where: { slug: req.params.slug } });
    if (!item) return notFound(res);
    return success(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.register = async (req, res) => {
  try {
    const eventId = req.params.id;              // CUID string
    const userId  = req.user.id;
    const { name, email, phone } = req.body;

    if (!name || !email) return error(res, 'name và email là bắt buộc', 400);

    const event = await req.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return notFound(res, 'Sự kiện không tồn tại');

    const existing = await req.prisma.eventRegistration.findFirst({
      where: { userId, eventId },
    });
    if (existing) return error(res, 'Bạn đã đăng ký sự kiện này rồi', 409);

    if (event.maxAttendees) {
      const count = await req.prisma.eventRegistration.count({ where: { eventId } });
      if (count >= event.maxAttendees) return error(res, 'Sự kiện đã hết chỗ', 400);
    }

    const reg = await req.prisma.eventRegistration.create({
      data: { userId, eventId, name, email, phone: phone || null },
    });
    return created(res, reg, 'Đăng ký thành công');
  } catch (e) { return error(res, e.message, 500); }
};

exports.myEvents = async (req, res) => {
  try {
    const regs = await req.prisma.eventRegistration.findMany({
      where:   { userId: req.user.id },
      include: { event: true },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, regs);
  } catch (e) { return error(res, e.message, 500); }
};

exports.create = async (req, res) => {
  try {
    const { title, slug, description, image, startAt, endAt, location, maxAttendees } = req.body;
    if (!title || !slug || !startAt || !endAt) return error(res, 'title, slug, startAt and endAt are required', 400);
    const item = await req.prisma.event.create({
      data: { title, slug, description, image, startAt: new Date(startAt), endAt: new Date(endAt), location, maxAttendees },
    });
    return created(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.update = async (req, res) => {
  try {
    const { title, slug, description, image, startAt, endAt, location, maxAttendees, status } = req.body;
    const data = { title, slug, description, image, location, maxAttendees, status };
    if (startAt) data.startAt = new Date(startAt);
    if (endAt)   data.endAt   = new Date(endAt);
    const item = await req.prisma.event.update({
      where: { id: req.params.id },        // CUID string
      data,
    });
    return success(res, item);
  } catch (e) { return error(res, e.message, 500); }
};
