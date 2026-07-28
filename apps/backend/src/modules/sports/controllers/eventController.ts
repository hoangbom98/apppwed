// @ts-nocheck
'use strict';
/**
 * sports/controllers/eventController.js
 *
 * NOTE: The sports schema has NO "Sport" or "SportEvent" model.
 * Betting markets live in BetMarket (@@map "bet_markets"), linked to Match.
 * This controller is repurposed to serve "upcoming events" (matches with open bet markets)
 * which is what the frontend needs.
 */
const { success, error, notFound } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

/**
 * GET /sports/events
 * Returns matches that have at least one open BetMarket.
 * Used as the main "betting events" listing.
 */
exports.getEvents = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = {
      betMarkets: { some: { status: 'open' } },
    };
    if (req.query.status) where.status = req.query.status;
    else where.status = { in: ['scheduled', 'live'] };

    const [data, total] = await Promise.all([
      req.prisma.match.findMany({
        where, skip, take,
        orderBy: { startTime: 'asc' },
        include: {
          homeTeam:   { select: { id: true, name: true, logo: true } },
          awayTeam:   { select: { id: true, name: true, logo: true } },
          league:     { select: { id: true, name: true, logo: true } },
          betMarkets: { where: { status: 'open' }, take: 5,
            include: { odds: { where: { status: 'active' }, orderBy: { selection: 'asc' } } } },
        },
      }),
      req.prisma.match.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /sports/events/live
 * Returns currently live matches with open markets.
 */
exports.getLiveEvents = async (req, res) => {
  try {
    const data = await req.prisma.match.findMany({
      where: { status: 'live' },
      orderBy: { startTime: 'asc' },
      include: {
        homeTeam:   { select: { id: true, name: true, logo: true } },
        awayTeam:   { select: { id: true, name: true, logo: true } },
        league:     { select: { id: true, name: true, logo: true } },
        betMarkets: { where: { status: 'open' },
          include: { odds: { where: { status: 'active' } } } },
        liveUpdates: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /sports/events/:id
 * Returns a single match (with all bet markets and odds).
 */
exports.getEventById = async (req, res) => {
  try {
    const event = await req.prisma.match.findUnique({
      where: { id: req.params.id },         // CUID string
      include: {
        homeTeam:    true,
        awayTeam:    true,
        league:      true,
        liveUpdates: { orderBy: { createdAt: 'desc' }, take: 20 },
        betMarkets:  {
          include: {
            odds: { where: { status: 'active' }, orderBy: { selection: 'asc' } },
          },
        },
      },
    });
    if (!event) return notFound(res);
    return success(res, event);
  } catch (e) { return error(res, e.message, 500); }
};

/**
 * GET /sports/events/market/:id
 * Returns a single BetMarket with its odds.
 */
exports.getMarket = async (req, res) => {
  try {
    const market = await req.prisma.betMarket.findUnique({
      where:   { id: req.params.id },       // CUID string
      include: {
        match: {
          include: {
            homeTeam: { select: { id: true, name: true, logo: true } },
            awayTeam: { select: { id: true, name: true, logo: true } },
            league:   { select: { id: true, name: true } },
          },
        },
        odds: { where: { status: 'active' }, orderBy: { selection: 'asc' } },
      },
    });
    if (!market) return notFound(res);
    return success(res, market);
  } catch (e) { return error(res, e.message, 500); }
};
