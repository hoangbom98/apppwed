'use strict';
/**
 * apps/backend/src/grpc/interceptors/authInterceptor.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * gRPC server-side auth interceptor.
 *
 * Reuses the same JWT verification logic as the Express auth middleware
 * (shared/middlewares/auth.ts). Token is passed via gRPC metadata header
 * `authorization: Bearer <token>`.
 *
 * PUBLIC methods (no auth required):
 *   - AuthService.Login
 *   - AuthService.Register
 *   - TradeService.GetPairs      (public market data)
 *   - SportsService.GetLiveMatches (public data)
 *
 * Attaches decoded user to call.user for downstream handlers.
 *
 * Usage (in gRPC server):
 *   const { makeAuthInterceptor } = require('./interceptors/authInterceptor');
 *   server.addInterceptor(makeAuthInterceptor());
 */
const grpc   = require('@grpc/grpc-js');
const jwt    = require('jsonwebtoken');
const logger = require('../../shared/services/core/logger');

/** gRPC methods that are publicly accessible — skip auth check. */
const PUBLIC_METHODS = new Set([
  '/lkvip.auth.AuthService/Login',
  '/lkvip.auth.AuthService/Register',
  '/lkvip.trade.TradeService/GetPairs',
  '/lkvip.sports.SportsService/GetLiveMatches',
]);

const JWT_SECRET = process.env.JWT_SECRET || 'dev_only_secret_change_me_64chars';

/**
 * Extracts and verifies the Bearer JWT from gRPC metadata.
 * Returns decoded payload or null if missing/invalid.
 *
 * @param {import('@grpc/grpc-js').Metadata} metadata
 * @returns {{ id: string|number, email: string|null, role: string, project: string }|null}
 */
function extractUser(metadata) {
  const authValues = metadata.get('authorization');
  if (!authValues || authValues.length === 0) return null;

  const raw = String(authValues[0]);
  if (!raw.startsWith('Bearer ')) return null;

  const token = raw.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    logger.warn('[gRPC Auth] Token verification failed', { error: err.message });
    return null;
  }
}

/**
 * Build a gRPC server interceptor function that:
 *  1. Skips auth for PUBLIC_METHODS.
 *  2. Rejects with UNAUTHENTICATED when no/invalid token.
 *  3. Attaches decoded user to call.user.
 *
 * @returns {Function} grpc server interceptor
 */
function makeAuthInterceptor() {
  return function authInterceptor(methodDescriptor, call) {
    const method = methodDescriptor.path; // e.g. "/lkvip.trade.TradeService/WatchPrices"

    if (PUBLIC_METHODS.has(method)) {
      // Public — pass through without auth
      return call;
    }

    // Wrap the call to inject auth check before the handler runs.
    // We use a lightweight listener-wrapper pattern compatible with
    // @grpc/grpc-js v1.x interceptor API.
    const listener = {
      onReceiveMetadata(metadata, next) {
        const decoded = extractUser(metadata);
        if (!decoded) {
          call.sendUnaryMessage(
            { code: grpc.status.UNAUTHENTICATED, message: 'Missing or invalid Bearer token' },
            () => {},
            null,
            new grpc.Metadata(),
          );
          // Emit error to abort the call cleanly
          call.emit('error', {
            code:    grpc.status.UNAUTHENTICATED,
            message: 'Missing or invalid Bearer token',
          });
          return;
        }
        // Attach user so handlers can read call.metadata.user
        metadata.set('x-user-id',      String(decoded.id));
        metadata.set('x-user-role',    decoded.role || 'user');
        metadata.set('x-user-project', decoded.project || '');
        next(metadata);
      },
      onReceiveMessage: (message, next) => next(message),
      onReceiveStatus:  (status,  next) => next(status),
    };

    return { listener };
  };
}

/**
 * Helper: extract the authenticated user from gRPC call metadata.
 * Returns null if the method was public and no token was provided.
 *
 * @param {import('@grpc/grpc-js').ServerUnaryCall<any,any>|import('@grpc/grpc-js').ServerWritableStream<any,any>} call
 * @returns {{ id: string, role: string, project: string }|null}
 */
function getUserFromCall(call) {
  const meta = call.metadata;
  const id = meta.get('x-user-id')[0];
  if (!id) return null;
  return {
    id:      String(id),
    role:    String(meta.get('x-user-role')[0]  || 'user'),
    project: String(meta.get('x-user-project')[0] || ''),
  };
}

module.exports = { makeAuthInterceptor, getUserFromCall, extractUser };
