// @ts-nocheck
'use strict';
/**
 * apps/backend/src/grpc/handlers/sportsHandler.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * gRPC service implementation for SportsService (proto/sports.proto).
 *
 * WatchMatches   — Server Streaming. Subscribes to ScoreBroadcaster events and
 *                  pushes score updates. Replaces cron 60s polling.
 *
 * WatchStream    — Server Streaming. Pushes live stream viewer count updates.
 *
 * GetLiveMatches — Unary. Returns currently live matches (public).
 */
const grpc             = require('@grpc/grpc-js');
const ScoreBroadcaster = require('../broadcasters/ScoreBroadcaster');
const { getUserFromCall } = require('../interceptors/authInterceptor');
const { getPrismaClient } = require('../../config/databases');
const logger = require('../../shared/services/core/logger');

// ── WatchMatches — Server Streaming ──────────────────────────────────────────

function watchMatches(call) {
  const requestedIds = new Set(
    (call.request.match_ids || []).map((id) => Number(id)),
  );

  // Push the current state of live matches immediately on connect
  const prisma = getPrismaClient('sports');
  prisma.match
    .findMany({
      where:   { status: { in: ['1H', '2H', 'HT', 'ET', 'NS'] } },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
      take: 200,
    })
    .then((matches) => {
      for (const m of matches) {
        if (call.cancelled) break;
        if (requestedIds.size && !requestedIds.has(m.id)) continue;
        try {
          call.write({
            match_id:     m.id,
            home_team:    m.homeTeam?.name  || '',
            away_team:    m.awayTeam?.name  || '',
            home_score:   m.homeScore   ?? 0,
            away_score:   m.awayScore   ?? 0,
            status:       m.status      || 'NS',
            elapsed:      m.elapsed     ?? 0,
            half_home:    m.halfHome    ?? 0,
            half_away:    m.halfAway    ?? 0,
            timestamp_ms: m.updatedAt ? m.updatedAt.getTime() : Date.now(),
          });
        } catch { /* client disconnected */ }
      }
    })
    .catch((err) => logger.warn('[gRPC Sports] WatchMatches initial fetch failed:', err.message));

  // Subscribe to live score changes from ScoreBroadcaster
  function onScoreUpdate(update) {
    if (call.cancelled) return;
    if (requestedIds.size && !requestedIds.has(Number(update.matchId))) return;
    try {
      call.write({
        match_id:     update.matchId,
        home_team:    update.homeTeam  || '',
        away_team:    update.awayTeam  || '',
        home_score:   update.homeScore ?? 0,
        away_score:   update.awayScore ?? 0,
        status:       update.status    || 'NS',
        elapsed:      update.elapsed   ?? 0,
        half_home:    update.halfHome  ?? 0,
        half_away:    update.halfAway  ?? 0,
        timestamp_ms: Date.now(),
      });
    } catch { /* client disconnected */ }
  }

  ScoreBroadcaster.on('score:update', onScoreUpdate);

  call.on('cancelled', () => ScoreBroadcaster.off('score:update', onScoreUpdate));
  call.on('error',     () => ScoreBroadcaster.off('score:update', onScoreUpdate));
  call.on('close',     () => ScoreBroadcaster.off('score:update', onScoreUpdate));
}

// ── WatchStream — Server Streaming ───────────────────────────────────────────

function watchStream(call) {
  const streamId = Number(call.request.stream_id);
  if (!streamId) {
    call.end();
    return;
  }

  const prisma = getPrismaClient('sports');

  // Push current viewer count immediately
  prisma.liveStream.findUnique({ where: { id: streamId } })
    .then((stream) => {
      if (stream && !call.cancelled) {
        call.write({
          stream_id:    stream.id,
          viewer_count: stream.viewers ?? 0,
          status:       stream.status  || 'live',
          timestamp_ms: Date.now(),
        });
      }
    })
    .catch(() => {});

  // Poll viewer count every 10 seconds
  const pollInterval = setInterval(async () => {
    if (call.cancelled) {
      clearInterval(pollInterval);
      return;
    }
    try {
      const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
      if (!stream) { clearInterval(pollInterval); call.end(); return; }
      call.write({
        stream_id:    stream.id,
        viewer_count: stream.viewers ?? 0,
        status:       stream.status  || 'live',
        timestamp_ms: Date.now(),
      });
      if (stream.status === 'ended') { clearInterval(pollInterval); call.end(); }
    } catch { clearInterval(pollInterval); }
  }, 10_000);

  call.on('cancelled', () => clearInterval(pollInterval));
  call.on('error',     () => clearInterval(pollInterval));
  call.on('close',     () => clearInterval(pollInterval));
}

// ── GetLiveMatches — Unary (public) ──────────────────────────────────────────

async function getLiveMatches(call, callback) {
  const { page = 1, limit = 50 } = call.request;
  try {
    const prisma = getPrismaClient('sports');
    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where:   { status: { in: ['1H', '2H', 'HT', 'ET', 'P'] } },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { startTime: 'asc' },
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
          league:   { select: { name: true } },
        },
      }),
      prisma.match.count({ where: { status: { in: ['1H', '2H', 'HT', 'ET', 'P'] } } }),
    ]);

    callback(null, {
      matches: matches.map((m) => ({
        id:          m.id,
        home_team:   m.homeTeam?.name  || '',
        away_team:   m.awayTeam?.name  || '',
        home_score:  m.homeScore  ?? 0,
        away_score:  m.awayScore  ?? 0,
        status:      m.status     || 'NS',
        elapsed:     m.elapsed    ?? 0,
        league_name: m.league?.name || '',
        start_time:  m.startTime?.toISOString() || '',
      })),
      total,
    });
  } catch (err) {
    logger.error('[gRPC Sports] getLiveMatches error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

module.exports = { watchMatches, watchStream, getLiveMatches };
