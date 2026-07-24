// @ts-nocheck
// backend/src/modules/admin/controllers/imController.js
// Admin IM / Chat Panel — học từ ImController.php + IMService.php của Boyue
// Quản lý: conversations, broadcast message, mute/unmute user
'use strict';

const { getPrismaClient } = require('../../../shared/config/databases');
const { success, error, paginate } = require('../../../shared/utils/response');

const adminDb = () => getPrismaClient('admin');
const safe    = async (fn) => { try { return await fn(); } catch { return null; } };

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/im/rooms?page=1&limit=20&type=support
 * Danh sách phòng chat (support rooms)
 */
exports.listRooms = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const where = type ? { type } : {};
    const prisma = adminDb();

    const [rooms, total] = await Promise.all([
      prisma.supportRoom.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          _count:    { select: { messages: true, participants: true } },
          tickets:   { take: 1, orderBy: { createdAt: 'desc' }, select: { status: true, subject: true } },
        },
      }),
      prisma.supportRoom.count({ where }),
    ]);

    return paginate(res, rooms, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /admin/im/rooms/:id/messages?page=1&limit=30
 * Tin nhắn trong 1 phòng
 */
exports.getRoomMessages = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const prisma = adminDb();

    const room = await prisma.supportRoom.findUnique({ where: { id: req.params.id } });
    if (!room) return error(res, 'Phòng không tồn tại', 404);

    const [messages, total] = await Promise.all([
      prisma.supportMessage.findMany({
        where:   { roomId: req.params.id, isDeleted: false },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supportMessage.count({ where: { roomId: req.params.id, isDeleted: false } }),
    ]);

    return paginate(res, messages, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * POST /admin/im/rooms/:id/messages
 * Admin gửi tin nhắn vào phòng
 * Body: { content, type? }
 */
exports.sendMessage = async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;
    if (!content?.trim()) return error(res, 'content bắt buộc', 400);

    const prisma   = adminDb();
    const adminId  = String(req.user?.id || 'admin');

    const message = await prisma.supportMessage.create({
      data: {
        roomId:   req.params.id,
        senderId: adminId,
        type,
        content:  content.trim(),
      },
    });

    // Cập nhật lastMessage của room
    await prisma.supportRoom.update({
      where: { id: req.params.id },
      data:  { lastMessage: content.slice(0, 200), lastMessageAt: new Date() },
    });

    return success(res, message, 'Đã gửi', 201);
  } catch (e) { return error(res, e.message, 500); }
};

// ─────────────────────────────────────────────────────────────────────────────
// BROADCAST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /admin/im/broadcast
 * Gửi thông báo hàng loạt tới nhiều phòng / segment
 * Body: { content, roomIds?: string[], segment?: 'all'|'vip'|'new', project? }
 */
exports.broadcast = async (req, res) => {
  try {
    const { content, roomIds, segment = 'all' } = req.body;
    if (!content?.trim()) return error(res, 'content bắt buộc', 400);

    const prisma   = adminDb();
    const adminId  = String(req.user?.id || 'admin');

    let targetRooms = roomIds;
    if (!targetRooms?.length) {
      // Lấy tất cả support rooms đang active
      const rooms = await prisma.supportRoom.findMany({
        select: { id: true },
        take:   500,
        orderBy: { lastMessageAt: 'desc' },
      });
      targetRooms = rooms.map(r => r.id);
    }

    // Gửi tin vào tất cả rooms
    let sentCount = 0;
    for (const roomId of targetRooms) {
      await safe(() => prisma.supportMessage.create({
        data: { roomId, senderId: adminId, type: 'text', content: content.trim() },
      }));
      sentCount++;
    }

    // Cập nhật lastMessage
    if (targetRooms.length > 0) {
      await safe(() => prisma.supportRoom.updateMany({
        where: { id: { in: targetRooms } },
        data:  { lastMessage: content.slice(0, 200), lastMessageAt: new Date() },
      }));
    }

    return success(res, { sentCount, segment });
  } catch (e) { return error(res, e.message, 500); }
};

// ─────────────────────────────────────────────────────────────────────────────
// MUTE / UNMUTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /admin/im/users/:userId/mute
 * Cấm user chat trong N phút
 * Body: { durationMinutes: 60, reason }
 */
exports.muteUser = async (req, res) => {
  try {
    const { durationMinutes = 60, reason = 'Vi phạm nội quy' } = req.body;
    const { userId } = req.params;

    const muteUntil = new Date(Date.now() + Number(durationMinutes) * 60_000);

    // Ghi vào admin DB — lưu trong SecurityLog (tái sử dụng model có sẵn)
    await adminDb().securityLog.create({
      data: {
        userId:  null,
        event:   'im_mute',
        severity:'medium',
        ip:      req.ip || null,
        details: { mutedUserId: userId, muteUntil: muteUntil.toISOString(), reason, by: req.user?.id },
      },
    });

    // Cập nhật lockedUntil nếu user ở admin DB
    await safe(() => adminDb().user.update({
      where: { id: userId },
      data:  { lockedUntil: muteUntil },
    }));

    return success(res, { userId, muteUntil, reason, durationMinutes });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * DELETE /admin/im/users/:userId/mute
 * Bỏ mute user
 */
exports.unmuteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await safe(() => adminDb().user.update({
      where: { id: userId },
      data:  { lockedUntil: null },
    }));
    return success(res, { userId, status: 'unmuted' });
  } catch (e) { return error(res, e.message, 500); }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPPORT TICKETS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/im/tickets?status=open&page=1&limit=20
 */
exports.listTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, priority } = req.query;
    const where = {};
    if (status)   where.status   = status;
    if (priority) where.priority = priority;

    const prisma = adminDb();
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        include: { _count: { select: { replies: true } } },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return paginate(res, tickets, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * PATCH /admin/im/tickets/:id
 * Cập nhật status / assignedTo
 * Body: { status?, assignedTo?, priority? }
 */
exports.updateTicket = async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.body;
    const data = {};
    if (status     !== undefined) data.status     = status;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;
    if (priority   !== undefined) data.priority   = priority;
    if (status === 'resolved') data.resolvedAt = new Date();
    if (status === 'closed')   data.closedAt   = new Date();

    const ticket = await adminDb().supportTicket.update({
      where: { id: req.params.id },
      data,
    });
    return success(res, ticket);
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * POST /admin/im/tickets/:id/reply
 * Admin trả lời ticket
 * Body: { content, isInternal? }
 */
exports.replyTicket = async (req, res) => {
  try {
    const { content, isInternal = false } = req.body;
    if (!content?.trim()) return error(res, 'content bắt buộc', 400);

    const reply = await adminDb().supportTicketReply.create({
      data: {
        ticketId:   req.params.id,
        senderId:   String(req.user?.id || 'admin'),
        content:    content.trim(),
        isInternal: Boolean(isInternal),
      },
    });
    return success(res, reply, 'Đã trả lời', 201);
  } catch (e) { return error(res, e.message, 500); }
};
