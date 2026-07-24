// @ts-nocheck
'use strict';
/**
 * MatchService — Sports module
 *
 * Uses CORRECT schema models:
 *   Match       (@@map "matches")
 *   LiveUpdate  (@@map "live_updates")  — NOT "matchLiveUpdate"
 *   Comment     (@@map "comments")
 *
 * All IDs are CUID strings — never coerce with Number().
 */

class MatchService {
  /** @param {import('@prisma/client').PrismaClient} prisma */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /** List matches with flexible filters. */
  async list({ page = 1, limit = 20, status, leagueId, teamId, date } = {}) {
    const where = {};
    if (status)   where.status   = status;
    if (leagueId) where.leagueId = leagueId;          // CUID string
    if (teamId)   where.OR       = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    if (date) {
      const d    = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.startTime = { gte: d, lt: next };
    }

    const skip    = (page - 1) * limit;
    const include = {
      league:   { select: { id: true, name: true, slug: true, logo: true } },
      homeTeam: { select: { id: true, name: true, slug: true, logo: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logo: true } },
    };

    const [data, total] = await Promise.all([
      this.prisma.match.findMany({ where, skip, take: Number(limit), orderBy: { startTime: 'asc' }, include }),
      this.prisma.match.count({ where }),
    ]);
    return { data, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
  }

  /** Return all currently-live matches with latest live updates. */
  async getLive() {
    return this.prisma.match.findMany({
      where:   { status: 'live' },
      orderBy: { startTime: 'asc' },
      include: {
        league:      { select: { id: true, name: true, slug: true, logo: true } },
        homeTeam:    { select: { id: true, name: true, slug: true, logo: true } },
        awayTeam:    { select: { id: true, name: true, slug: true, logo: true } },
        liveUpdates: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }

  /** Return all matches scheduled for today. */
  async getToday() {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end   = new Date(start);
    end.setDate(end.getDate() + 1);

    return this.prisma.match.findMany({
      where:   { startTime: { gte: start, lt: end } },
      orderBy: { startTime: 'asc' },
      include: {
        league:   { select: { id: true, name: true, slug: true, logo: true } },
        homeTeam: { select: { id: true, name: true, slug: true, logo: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logo: true } },
      },
    });
  }

  /** Get full match detail including live updates, highlights, and comments. */
  async getById(id) {
    return this.prisma.match.findUnique({
      where:   { id },                              // CUID string
      include: {
        league:      true,
        homeTeam:    true,
        awayTeam:    true,
        liveUpdates: { orderBy: { createdAt: 'asc' } },
        highlights:  { where: { status: 'active' }, orderBy: { sortOrder: 'asc' }, take: 10 },
        comments:    {
          where:   { status: 'active', parentId: null },
          orderBy: { createdAt: 'desc' },
          take:    20,
          include: { user: { select: { id: true, username: true, avatar: true } } },
        },
      },
    });
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Push a live update event for an ongoing match.
   * Uses LiveUpdate model (@@map "live_updates") — fields: type, team, player, time, description.
   */
  async addLiveUpdate(matchId, data) {
    const { type, team, player, time: eventTime, description, homeScore, awayScore } = data;

    const update = await this.prisma.liveUpdate.create({
      data: {
        matchId,                                    // CUID string
        type:        type || 'goal',
        team:        team        || null,
        player:      player      || null,
        time:        eventTime   || null,
        description: description || null,
      },
    });

    // Update scoreline if provided
    if (homeScore !== undefined || awayScore !== undefined) {
      await this.prisma.match.update({
        where: { id: matchId },
        data:  {
          ...(homeScore !== undefined && { homeScore: Number(homeScore) }),
          ...(awayScore !== undefined && { awayScore: Number(awayScore) }),
        },
      });
    }

    return update;
  }

  /** Transition a match to a new status. */
  async updateStatus(matchId, newStatus) {
    const valid = ['scheduled', 'live', 'halftime', 'finished', 'cancelled', 'postponed'];
    if (!valid.includes(newStatus)) {
      throw Object.assign(new Error(`Invalid status: ${newStatus}`), { status: 400 });
    }
    return this.prisma.match.update({
      where: { id: matchId },                       // CUID string
      data:  { status: newStatus },
    });
  }

  /** Add a comment to a match. parentId is optional (for threaded replies). */
  async addComment(userId, matchId, content, parentId = null) {
    if (!content?.trim()) {
      throw Object.assign(new Error('Nội dung bình luận không được trống'), { status: 400 });
    }
    return this.prisma.comment.create({
      data: {
        userId,
        matchId,                                    // CUID string
        content,
        parentId: parentId || null,                 // CUID string or null
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
  }
}

module.exports = MatchService;
