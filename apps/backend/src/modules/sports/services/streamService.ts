// @ts-nocheck
'use strict';
/**
 * Stream Service (Sports)
 *
 * Manages live sports streaming sessions: start, end, viewer tracking,
 * and chat message persistence.
 */
const logger = require('../../../shared/services/logger');

class StreamService {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /** List live and scheduled streams. */
  async list({ page = 1, limit = 20, status } = {}) {
    const where = {};
    if (status) where.status = status;
    else        where.status = { in: ['live', 'scheduled'] };

    const skip = (page - 1) * limit;
    const include = {
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
    };

    const [data, total] = await Promise.all([
      this.prisma.liveStream.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: [{ status: 'desc' }, { viewers: 'desc' }, { startTime: 'desc' }],
        include,
      }),
      this.prisma.liveStream.count({ where }),
    ]);
    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  /** Get stream by id with full relations. */
  async getById(id) {
    return this.prisma.liveStream.findUnique({
      where:   { id: Number(id) },
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
  }

  /** Get chat messages for a stream (paginated, newest-first reversed). */
  async getChat(streamId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    const messages = await this.prisma.liveChat.findMany({
      where:   { streamId: Number(streamId) },
      skip,
      take:    Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
    });
    return messages.reverse();
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Start a new live stream for the given user.
   * Auto-creates a StreamerProfile if one doesn't exist.
   */
  async start(userId, { title, description, thumbnail, matchId, chatEnabled = true }) {
    if (!title) throw Object.assign(new Error('Title is required'), { status: 400 });

    // Ensure streamer profile exists
    let streamer = await this.prisma.streamerProfile.findUnique({ where: { userId } });
    if (!streamer) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true, username: true } });
      streamer = await this.prisma.streamerProfile.create({
        data: { userId, displayName: user?.fullName || user?.username || 'Streamer' },
      });
    }

    const stream = await this.prisma.liveStream.create({
      data: {
        streamerId:  streamer.id,
        matchId:     matchId ? Number(matchId) : null,
        title,
        description: description ?? null,
        thumbnail:   thumbnail   ?? null,
        status:      'live',
        startTime:   new Date(),
        chatEnabled,
      },
    });

    await this.prisma.streamerProfile.update({ where: { id: streamer.id }, data: { isLive: true } });
    logger.info(`[StreamService] Stream ${stream.id} started by user ${userId}`);
    return stream;
  }

  /**
   * End a live stream. Only the stream owner or an admin can end it.
   */
  async end(streamId, requestingUserId, isAdmin = false) {
    const stream = await this.prisma.liveStream.findUnique({
      where:   { id: Number(streamId) },
      include: { streamer: true },
    });
    if (!stream) throw Object.assign(new Error('Stream not found'), { status: 404 });
    if (stream.streamer.userId !== requestingUserId && !isAdmin) {
      throw Object.assign(new Error('Unauthorized'), { status: 403 });
    }

    await this.prisma.$transaction([
      this.prisma.liveStream.update({
        where: { id: stream.id },
        data:  { status: 'ended', endTime: new Date() },
      }),
      this.prisma.streamerProfile.update({
        where: { id: stream.streamerId },
        data:  { isLive: false },
      }),
    ]);

    logger.info(`[StreamService] Stream ${streamId} ended`);
    return { ended: true };
  }

  /** Increment viewer count when a user joins. */
  async join(streamId) {
    await this.prisma.liveStream.update({
      where: { id: Number(streamId) },
      data:  { viewers: { increment: 1 } },
    });
  }

  /** Decrement viewer count when a user leaves. */
  async leave(streamId) {
    await this.prisma.liveStream.update({
      where: { id: Number(streamId) },
      data:  { viewers: { decrement: 1 } },
    }).catch(() => {}); // Ignore if viewers already at 0
  }
}

module.exports = StreamService;
