'use strict';
/**
 * apps/backend/src/grpc/broadcasters/ScoreBroadcaster.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Singleton EventEmitter bridging SportsDataSyncService → gRPC WatchMatches.
 *
 * SportsDataSyncService.syncLiveScores() already pushes 'score:update' via
 * Socket.IO.  We extend it to also fire on this broadcaster so gRPC handlers
 * can subscribe.
 *
 * Usage:
 *   // In gRPC handler (WatchMatches):
 *   ScoreBroadcaster.on('score:update', handler);
 *   ScoreBroadcaster.off('score:update', handler);
 *
 *   // In SportsDataSyncService.syncLiveScores() after DB update:
 *   ScoreBroadcaster.publish({ matchId, homeScore, awayScore, ... });
 */
const EventEmitter = require('events');

class ScoreBroadcasterClass extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0);
  }

  /**
   * Emit a score update to all subscribed gRPC streams.
   * @param {{ matchId: number, homeScore: number, awayScore: number, halfHome: number, halfAway: number, status: string, elapsed: number, homeTeam?: string, awayTeam?: string }} update
   */
  publish(update) {
    this.emit('score:update', update);
  }
}

/** @type {ScoreBroadcasterClass} */
const ScoreBroadcaster = new ScoreBroadcasterClass();

module.exports = ScoreBroadcaster;
