// @ts-nocheck
'use strict';
/**
 * apps/backend/src/grpc/handlers/gameHandler.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * gRPC service implementation for GameService (proto/game.proto).
 *
 * WatchJackpot     — Server Streaming. Pushes jackpot pool updates from
 *                    GameBroadcaster (emitted by BullMQ lottery workers).
 *
 * WatchRounds      — Server Streaming. Pushes settled round results.
 *
 * WatchLeaderboard — Server Streaming. Pushes leaderboard changes.
 */
const grpc = require('@grpc/grpc-js');
const GameBroadcaster = require('../broadcasters/GameBroadcaster');
const { getPrismaClient } = require('../../config/databases');
const logger = require('../../shared/services/core/logger');

// ── WatchJackpot — Server Streaming ──────────────────────────────────────────

function watchJackpot(call) {
  const requestedGameIds = new Set(call.request.game_ids || []);

  // Push current jackpot state immediately on connect
  const prisma = getPrismaClient('game');
  prisma.lotteryConfig
    .findMany({ where: { status: 'active' }, take: 50 })
    .then((configs) => {
      for (const cfg of configs) {
        if (call.cancelled) break;
        if (requestedGameIds.size && !requestedGameIds.has(String(cfg.id))) continue;
        try {
          call.write({
            draw_id:      '',
            game_id:      String(cfg.id),
            game_name:    cfg.name   || cfg.id,
            jackpot:      parseFloat(cfg.jackpot || cfg.prize || 0),
            total_bets:   0,
            player_count: 0,
            status:       'open',
            timestamp_ms: Date.now(),
          });
        } catch { /* client disconnected */ }
      }
    })
    .catch((err) => logger.warn('[gRPC Game] WatchJackpot initial fetch failed:', err.message));

  function onJackpotUpdate(update) {
    if (call.cancelled) return;
    if (requestedGameIds.size && !requestedGameIds.has(String(update.game_id))) return;
    try { call.write(update); } catch { /* client disconnected */ }
  }

  GameBroadcaster.on('jackpot:update', onJackpotUpdate);
  call.on('cancelled', () => GameBroadcaster.off('jackpot:update', onJackpotUpdate));
  call.on('error',     () => GameBroadcaster.off('jackpot:update', onJackpotUpdate));
  call.on('close',     () => GameBroadcaster.off('jackpot:update', onJackpotUpdate));
}

// ── WatchRounds — Server Streaming ───────────────────────────────────────────

function watchRounds(call) {
  const requestedGameIds = new Set(call.request.game_ids || []);

  function onRoundResult(result) {
    if (call.cancelled) return;
    if (requestedGameIds.size && !requestedGameIds.has(String(result.game_id))) return;
    try { call.write(result); } catch { /* client disconnected */ }
  }

  GameBroadcaster.on('round:result', onRoundResult);
  call.on('cancelled', () => GameBroadcaster.off('round:result', onRoundResult));
  call.on('error',     () => GameBroadcaster.off('round:result', onRoundResult));
  call.on('close',     () => GameBroadcaster.off('round:result', onRoundResult));
}

// ── WatchLeaderboard — Server Streaming ───────────────────────────────────────

function watchLeaderboard(call) {
  const { game_id, period = 'daily' } = call.request;

  // Push current leaderboard immediately on connect
  const prisma = getPrismaClient('game');
  prisma.leaderboardEntry
    .findMany({
      where:   game_id ? { gameId: game_id, period } : { period },
      orderBy: { amount: 'desc' },
      take:    10,
      include: { user: { select: { id: true, username: true, avatar: true } } },
    })
    .then((entries) => {
      if (!entries.length || call.cancelled) return;
      call.write({
        game_id:     game_id || '',
        period,
        entries:     entries.map((e, i) => ({
          user_id:  String(e.userId),
          username: e.user?.username || '',
          avatar:   e.user?.avatar   || '',
          amount:   parseFloat(e.amount || 0),
          rank:     i + 1,
        })),
        timestamp_ms: Date.now(),
      });
    })
    .catch((err) => logger.warn('[gRPC Game] WatchLeaderboard initial fetch failed:', err.message));

  function onLeaderboardUpdate(update) {
    if (call.cancelled) return;
    if (game_id && update.game_id !== game_id) return;
    if (update.period !== period) return;
    try { call.write(update); } catch { /* client disconnected */ }
  }

  GameBroadcaster.on('leaderboard:update', onLeaderboardUpdate);
  call.on('cancelled', () => GameBroadcaster.off('leaderboard:update', onLeaderboardUpdate));
  call.on('error',     () => GameBroadcaster.off('leaderboard:update', onLeaderboardUpdate));
  call.on('close',     () => GameBroadcaster.off('leaderboard:update', onLeaderboardUpdate));
}

module.exports = { watchJackpot, watchRounds, watchLeaderboard };
