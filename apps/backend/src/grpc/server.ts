'use strict';
/**
 * apps/backend/src/grpc/server.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * gRPC server factory for LKVIP.
 *
 * Loads all proto files from apps/backend/proto/, registers service handlers,
 * and binds to GRPC_PORT (default 50051).
 *
 * Lifecycle:
 *   const grpcServer = createGrpcServer();
 *   await startGrpcServer(grpcServer);        // in server.ts bootstrap
 *   await stopGrpcServer(grpcServer);         // in graceful shutdown
 *
 * Interceptor order (applied to every call):
 *   1. metricsInterceptor — record call counts & latency
 *   2. authInterceptor    — JWT verification (skips PUBLIC_METHODS)
 *
 * NOTE: @grpc/grpc-js v1.x does not support the interceptors API on the
 * server side the same way as clients. We implement auth by wrapping handlers
 * directly and metrics via EventEmitter on the Server instance for simplicity
 * and compatibility. The interceptor modules exist for the logic and metrics
 * collection; they're applied manually inside each handler.
 */
const path         = require('path');
const grpc         = require('@grpc/grpc-js');
const protoLoader  = require('@grpc/proto-loader');
const logger       = require('../shared/services/core/logger');

// ── Handlers ─────────────────────────────────────────────────────────────────
const tradeHandler   = require('./handlers/tradeHandler');
const sportsHandler  = require('./handlers/sportsHandler');
const datingHandler  = require('./handlers/datingHandler');
const authHandler    = require('./handlers/authHandler');
const gameHandler    = require('./handlers/gameHandler');

// ── Proto loader options ──────────────────────────────────────────────────────
const PROTO_LOAD_OPTIONS = {
  keepCase:          true,
  longs:             String,
  enums:             String,
  defaults:          true,
  oneofs:            true,
};

// Proto files live at apps/backend/proto/ — resolve from both src/ and dist/src/ layouts.
// In dev (tsx):   __dirname = .../apps/backend/src/grpc   → ../../proto = apps/backend/proto ✓
// In prod (dist): __dirname = .../apps/backend/dist/src/grpc → ../../../../proto = apps/backend/proto ✓
function resolveProtoDir() {
  // Walk up until we find the proto/ directory
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'proto');
    if (require('fs').existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  // Fallback: relative to project root (apps/backend)
  return path.resolve(__dirname, '..', '..', '..', '..', 'proto');
}

const PROTO_DIR = resolveProtoDir();

/**
 * Load a proto file and return the gRPC package definition.
 * @param {string} filename
 */
function loadProto(filename) {
  const filePath = path.join(PROTO_DIR, filename);
  const packageDef = protoLoader.loadSync(filePath, PROTO_LOAD_OPTIONS);
  return grpc.loadPackageDefinition(packageDef);
}

/**
 * Create and configure the gRPC Server instance.
 * Services are registered but the server is not yet bound to a port.
 *
 * @returns {import('@grpc/grpc-js').Server}
 */
function createGrpcServer() {
  const server = new grpc.Server({
    // Max message size: 4 MB (default 4MB)
    'grpc.max_send_message_length':    4 * 1024 * 1024,
    'grpc.max_receive_message_length': 4 * 1024 * 1024,
    // Keep-alive: ping idle connections every 60s, timeout after 20s
    'grpc.keepalive_time_ms':          60_000,
    'grpc.keepalive_timeout_ms':       20_000,
    'grpc.keepalive_permit_without_calls': 1,
  });

  // ── Trade Service ──────────────────────────────────────────────────────────
  try {
    const tradePkg = loadProto('trade.proto');
    server.addService(tradePkg.lkvip.trade.TradeService.service, {
      watchPrices:  tradeHandler.watchPrices,
      placeOrder:   tradeHandler.placeOrder,
      cancelOrder:  tradeHandler.cancelOrder,
      getPairs:     tradeHandler.getPairs,
      getWallet:    tradeHandler.getWallet,
    });
    logger.info('[gRPC] TradeService registered');
  } catch (err) {
    logger.error('[gRPC] Failed to register TradeService:', err.message);
  }

  // ── Sports Service ────────────────────────────────────────────────────────
  try {
    const sportsPkg = loadProto('sports.proto');
    server.addService(sportsPkg.lkvip.sports.SportsService.service, {
      watchMatches:   sportsHandler.watchMatches,
      watchStream:    sportsHandler.watchStream,
      getLiveMatches: sportsHandler.getLiveMatches,
    });
    logger.info('[gRPC] SportsService registered');
  } catch (err) {
    logger.error('[gRPC] Failed to register SportsService:', err.message);
  }

  // ── Dating Service ────────────────────────────────────────────────────────
  try {
    const datingPkg = loadProto('dating.proto');
    server.addService(datingPkg.lkvip.dating.DatingService.service, {
      chat:          datingHandler.chat,
      joinRoom:      datingHandler.joinRoom,
      getRooms:      datingHandler.getRooms,
      getMessages:   datingHandler.getMessages,
      recallMessage: datingHandler.recallMessage,
    });
    logger.info('[gRPC] DatingService registered');
  } catch (err) {
    logger.error('[gRPC] Failed to register DatingService:', err.message);
  }

  // ── Auth Service ──────────────────────────────────────────────────────────
  try {
    const authPkg = loadProto('auth.proto');
    server.addService(authPkg.lkvip.auth.AuthService.service, {
      login:    authHandler.login,
      register: authHandler.register,
      refresh:  authHandler.refresh,
      logout:   authHandler.logout,
      me:       authHandler.me,
    });
    logger.info('[gRPC] AuthService registered');
  } catch (err) {
    logger.error('[gRPC] Failed to register AuthService:', err.message);
  }

  // ── Game Service ──────────────────────────────────────────────────────────
  try {
    const gamePkg = loadProto('game.proto');
    server.addService(gamePkg.lkvip.game.GameService.service, {
      watchJackpot:     gameHandler.watchJackpot,
      watchRounds:      gameHandler.watchRounds,
      watchLeaderboard: gameHandler.watchLeaderboard,
    });
    logger.info('[gRPC] GameService registered');
  } catch (err) {
    logger.error('[gRPC] Failed to register GameService:', err.message);
  }

  return server;
}

/**
 * Bind the gRPC server to the configured port and start listening.
 *
 * @param {import('@grpc/grpc-js').Server} server
 * @returns {Promise<number>} the bound port number
 */
function startGrpcServer(server) {
  const GRPC_PORT    = process.env.GRPC_PORT || '50051';
  const GRPC_HOST    = process.env.GRPC_HOST || '0.0.0.0';
  const GRPC_ADDR    = `${GRPC_HOST}:${GRPC_PORT}`;

  // Use TLS in production when certs are configured; insecure otherwise.
  let credentials;
  if (
    process.env.GRPC_TLS_KEY_PATH &&
    process.env.GRPC_TLS_CERT_PATH &&
    process.env.GRPC_TLS_CA_PATH
  ) {
    const fs   = require('fs');
    const key  = fs.readFileSync(process.env.GRPC_TLS_KEY_PATH);
    const cert = fs.readFileSync(process.env.GRPC_TLS_CERT_PATH);
    const ca   = fs.readFileSync(process.env.GRPC_TLS_CA_PATH);
    credentials = grpc.ServerCredentials.createSsl(ca, [{ private_key: key, cert_chain: cert }], false);
    logger.info('[gRPC] TLS credentials loaded');
  } else {
    credentials = grpc.ServerCredentials.createInsecure();
    if (process.env.NODE_ENV === 'production') {
      logger.warn('[gRPC] Running without TLS — set GRPC_TLS_KEY_PATH/CERT_PATH/CA_PATH in production');
    }
  }

  return new Promise((resolve, reject) => {
    server.bindAsync(GRPC_ADDR, credentials, (err, port) => {
      if (err) {
        logger.error(`[gRPC] Failed to bind on ${GRPC_ADDR}: ${err.message}`);
        return reject(err);
      }
      server.start();
      logger.info(`[gRPC] Server listening on ${GRPC_ADDR} (port ${port})`);
      resolve(port);
    });
  });
}

/**
 * Gracefully stop the gRPC server (drain active calls, then force close).
 *
 * @param {import('@grpc/grpc-js').Server} server
 * @returns {Promise<void>}
 */
function stopGrpcServer(server) {
  return new Promise((resolve) => {
    server.tryShutdown((err) => {
      if (err) {
        logger.warn('[gRPC] Graceful shutdown failed — forcing close:', err.message);
        server.forceShutdown();
      } else {
        logger.info('[gRPC] Server stopped gracefully');
      }
      resolve(undefined);
    });
  });
}

module.exports = { createGrpcServer, startGrpcServer, stopGrpcServer };
