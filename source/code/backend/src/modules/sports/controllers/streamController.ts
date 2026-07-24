// @ts-nocheck
'use strict';
const { success, created, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');

exports.list = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, 20);
    const where = {};

    if (req.query.status) where.status = req.query.status;
    else where.status = { in: ['live', 'scheduled'] };

    const [streams, total] = await Promise.all([
      req.prisma.liveStream.findMany({
        where,
        skip,
        take,
        orderBy: [{ status: 'desc' }, { viewers: 'desc' }, { startTime: 'desc' }],
        include: {
          streamer: {
            include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
          },
          match: {
            select: {
              id: true,
              homeTeam: { select: { name: true, logo: true } },
              awayTeam: { select: { name: true, logo: true } },
            },
          },
        },
      }),
      req.prisma.liveStream.count({ where }),
    ]);

    return res.json({ success: true, streams, meta: { total, page, limit } });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.get = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — no coercion
    const stream = await req.prisma.liveStream.findUnique({
      where: { id },
      include: {
        streamer: {
          include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
        },
        match: {
          include: {
            league:   { select: { name: true, logo: true } },
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    });

    if (!stream) return notFound(res);
    return success(res, stream);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.getChat = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — no coercion
    const { skip, take } = paginate(req.query.page, 50);
    const messages = await req.prisma.liveChat.findMany({
      where:   { streamId: id },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
    });

    return success(res, { messages: messages.reverse() });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.start = async (req, res) => {
  try {
    const { title, description, thumbnail, matchId, chatEnabled = true } = req.body;
    if (!title) return error(res, 'Title is required');

    // Find or create streamer profile
    let streamer = await req.prisma.streamerProfile.findUnique({ where: { userId: req.user.id } });
    if (!streamer) {
      streamer = await req.prisma.streamerProfile.create({
        data: {
          userId:      req.user.id,
          displayName: req.user.fullName || req.user.username || 'Streamer',
        },
      });
    }

    const stream = await req.prisma.liveStream.create({
      data: {
        streamerId:  streamer.id,
        matchId:     matchId || null, // CUID string — no coercion
        title,
        description,
        thumbnail,
        status:      'live',
        startTime:   new Date(),
        chatEnabled,
      },
    });

    await req.prisma.streamerProfile.update({
      where: { id: streamer.id },
      data:  { isLive: true },
    });

    return created(res, stream);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.end = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — no coercion
    const stream = await req.prisma.liveStream.findUnique({
      where:   { id },
      include: { streamer: true },
    });

    if (!stream) return notFound(res);
    if (stream.streamer.userId !== req.user.id && req.user.role !== 'admin') {
      return error(res, 'Unauthorized', 403);
    }

    await req.prisma.$transaction([
      req.prisma.liveStream.update({
        where: { id: stream.id },
        data:  { status: 'ended', endTime: new Date() },
      }),
      req.prisma.streamerProfile.update({
        where: { id: stream.streamerId },
        data:  { isLive: false },
      }),
    ]);

    return success(res, null, 'Stream ended');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.join = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — no coercion
    await req.prisma.liveStream.update({
      where: { id },
      data:  { viewers: { increment: 1 } },
    });
    return success(res, null);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.leave = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — no coercion
    await req.prisma.liveStream.update({
      where: { id },
      data:  { viewers: { decrement: 1 } },
    });
    return success(res, null);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
