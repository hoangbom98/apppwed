// @ts-nocheck
'use strict';
/**
 * dating/controllers/liveController.js
 * Manages LiveStream sessions in dating_db.
 * Models: LiveStream (@@map "live_streams"), GiftSend (@@map "gift_sends")
 */
const { success, created, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');
const notifSvc = require('../../../shared/services/notificationService');

// ── GET /dating/live/streams — list active/recent streams ────────────────────
exports.getStreams = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    else where.status = 'live'; // default: only live streams

    const [data, total] = await Promise.all([
      req.prisma.liveStream.findMany({
        where, skip, take,
        orderBy: { startedAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, avatar: true, isVerified: true } },
        },
      }),
      req.prisma.liveStream.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/live/:id — stream detail ─────────────────────────────────────
exports.getStream = async (req, res) => {
  try {
    const stream = await req.prisma.liveStream.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, fullName: true, avatar: true, isVerified: true } },
        gifts: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { id: true, fullName: true, avatar: true } }, gift: true },
        },
      },
    });
    if (!stream) return notFound(res);
    return success(res, stream);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/live/start ───────────────────────────────────────────────────
exports.startStream = async (req, res) => {
  try {
    const { title, thumbnail } = req.body;
    if (!title) return error(res, 'Tiêu đề stream là bắt buộc', 400);

    // End any existing live stream for this user
    await req.prisma.liveStream.updateMany({
      where: { userId: req.user.id, status: 'live' },
      data:  { status: 'ended', endedAt: new Date() },
    });

    const streamKey = `sk_${req.user.id}_${Date.now()}`;
    const stream = await req.prisma.liveStream.create({
      data: {
        userId:    req.user.id,
        title:     title.trim(),
        thumbnail: thumbnail || null,
        streamKey,
        status:    'live',
        startedAt: new Date(),
      },
    });

    // Notify followers via Socket.IO
    if (notifSvc._io) {
      notifSvc._io.emit('live:started', {
        streamId: stream.id,
        userId:   req.user.id,
        title:    stream.title,
      });
    }

    return created(res, stream, 'Stream bắt đầu');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/live/:id/end ─────────────────────────────────────────────────
exports.endStream = async (req, res) => {
  try {
    const stream = await req.prisma.liveStream.findUnique({ where: { id: req.params.id } });
    if (!stream) return notFound(res);
    if (stream.userId !== req.user.id) return error(res, 'Không có quyền', 403);
    if (stream.status === 'ended') return error(res, 'Stream đã kết thúc', 400);

    const updated = await req.prisma.liveStream.update({
      where: { id: req.params.id },
      data:  { status: 'ended', endedAt: new Date() },
    });

    if (notifSvc._io) {
      notifSvc._io.to(`live_${req.params.id}`).emit('live:ended', { streamId: req.params.id });
    }

    return success(res, updated, 'Stream kết thúc');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/live/:id/join ────────────────────────────────────────────────
exports.joinStream = async (req, res) => {
  try {
    const stream = await req.prisma.liveStream.findUnique({ where: { id: req.params.id } });
    if (!stream) return notFound(res);
    if (stream.status !== 'live') return error(res, 'Stream không hoạt động', 400);

    // Increment viewer count
    const updated = await req.prisma.liveStream.update({
      where: { id: req.params.id },
      data:  {
        viewerCount: { increment: 1 },
        peakViewers: { increment: stream.viewerCount + 1 > stream.peakViewers ? 1 : 0 },
      },
    });

    if (notifSvc._io) {
      notifSvc._io.to(`live_${req.params.id}`).emit('live:viewer_joined', {
        streamId:    req.params.id,
        viewerCount: updated.viewerCount,
      });
    }

    return success(res, { streamId: stream.id, viewerCount: updated.viewerCount });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/live/:id/leave ───────────────────────────────────────────────
exports.leaveStream = async (req, res) => {
  try {
    const stream = await req.prisma.liveStream.findUnique({ where: { id: req.params.id } });
    if (!stream || stream.status !== 'live') return success(res, null);

    const newCount = Math.max(0, stream.viewerCount - 1);
    await req.prisma.liveStream.update({
      where: { id: req.params.id },
      data:  { viewerCount: newCount },
    });

    if (notifSvc._io) {
      notifSvc._io.to(`live_${req.params.id}`).emit('live:viewer_left', {
        streamId:    req.params.id,
        viewerCount: newCount,
      });
    }

    return success(res, null);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/live/gift — send a gift to a live stream ─────────────────────
// GiftSend schema: { senderId, receiverId, giftId, liveStreamId?, quantity, coinValue }
// Gift schema uses `coinCost` not `price`
exports.sendGift = async (req, res) => {
  try {
    const { streamId, giftId, quantity = 1 } = req.body;
    if (!streamId || !giftId) return error(res, 'streamId và giftId là bắt buộc', 400);

    const [stream, gift] = await Promise.all([
      req.prisma.liveStream.findUnique({ where: { id: streamId } }),
      req.prisma.gift.findUnique({ where: { id: giftId } }),
    ]);
    if (!stream || stream.status !== 'live') return error(res, 'Stream không tồn tại hoặc đã kết thúc', 400);
    if (!gift) return error(res, 'Quà không tồn tại', 400);

    // Gift.coinCost is the correct field name (not price)
    const totalCost = parseFloat(gift.coinCost) * parseInt(quantity);

    // Check sender balance
    const sender = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (parseFloat(sender.coins) < totalCost) return error(res, 'Số dư không đủ', 400);

    // Deduct coins from sender, credit streamer, create gift record — atomic
    // GiftSend fields: liveStreamId (not streamId), coinValue (not totalCoins)
    await req.prisma.$transaction([
      req.prisma.user.update({
        where: { id: req.user.id },
        data:  { coins: { decrement: totalCost } },
      }),
      req.prisma.user.update({
        where: { id: stream.userId },
        data:  { coins: { increment: totalCost } },
      }),
      req.prisma.liveStream.update({
        where: { id: streamId },
        data:  { coinsEarned: { increment: totalCost } },
      }),
      req.prisma.giftSend.create({
        data: {
          senderId:     req.user.id,
          receiverId:   stream.userId,
          giftId,
          liveStreamId: streamId,
          quantity:     parseInt(quantity),
          coinValue:    totalCost,
        },
      }),
    ]);

    // Real-time broadcast to stream room
    if (notifSvc._io) {
      notifSvc._io.to(`live_${streamId}`).emit('live:gift_received', {
        streamId,
        senderId:   req.user.id,
        senderName: sender.fullName,
        giftName:   gift.name,
        giftIcon:   gift.icon,
        quantity:   parseInt(quantity),
        totalCost,
      });
    }

    return success(res, { sent: true, totalCost }, 'Gửi quà thành công');
  } catch (e) { return error(res, e.message, 500); }
};
