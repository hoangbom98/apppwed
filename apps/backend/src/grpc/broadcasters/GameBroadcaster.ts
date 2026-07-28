'use strict';
/**
 * apps/backend/src/grpc/broadcasters/GameBroadcaster.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Singleton EventEmitter bridging Game services → gRPC WatchJackpot /
 * WatchRounds / WatchLeaderboard streams.
 *
 * Game workers (BullMQ) or lottery services can call publish() methods to push
 * real-time updates to all subscribed gRPC streaming clients.
 */
const EventEmitter = require('events');

class GameBroadcasterClass extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0);
  }

  /** Push a jackpot pool change to WatchJackpot subscribers. */
  publishJackpot(update) {
    this.emit('jackpot:update', update);
  }

  /** Push a settled round result to WatchRounds subscribers. */
  publishRound(result) {
    this.emit('round:result', result);
  }

  /** Push a leaderboard change to WatchLeaderboard subscribers. */
  publishLeaderboard(update) {
    this.emit('leaderboard:update', update);
  }
}

/** @type {GameBroadcasterClass} */
const GameBroadcaster = new GameBroadcasterClass();

module.exports = GameBroadcaster;
