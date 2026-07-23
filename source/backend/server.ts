import 'dotenv/config';

// ── Sentry error tracking (optional — requires SENTRY_DSN env var) ────────────
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sentry = require('@sentry/node');
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  }
} catch { /* @sentry/node not installed or SENTRY_DSN not set — skip */ }

import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression') as (options?: Record<string, unknown>) => import('express').RequestHandler;
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';

// ── Startup: fail-fast validation ─────────────────────────────────────────
// Validate critical env vars before loading any modules.
(function validateEnv() {
  const required = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'HUB_DATABASE_URL',
    'GAME_DATABASE_URL',
    'TRADE_DATABASE_URL',
    'DATING_DATABASE_URL',
    'SPORTS_DATABASE_URL',
    'ADMIN_DATABASE_URL',
    'REDIS_URL',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  // Secrets must be at least 32 chars
  const shortSecrets = ['JWT_SECRET', 'ENCRYPTION_KEY'].filter(
    (k) => (process.env[k]?.length ?? 0) < 32,
  );
  if (shortSecrets.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[FATAL] Secrets too short (min 32 chars): ${shortSecrets.join(', ')}`);
    process.exit(1);
  }
})();

// ── Infrastructure ────────────────────────────────────────────────────────
const { logger, cron, swagger: { mount: mountSwagger }, socket: socketStore } = require('./src/config');
const cache              = require('./src/shared/services/cacheService');
const { disconnectAll }  = require('./src/config/databases');
const { publicLimiter, authLimiter } = require('./src/shared/middlewares/rateLimiter');
const riskMiddleware     = require('./src/shared/middlewares/riskMiddleware');
const configResolver     = require('./src/shared/middlewares/configResolver');
const errorHandler       = require('./src/shared/middlewares/errorHandler');
const i18nMiddleware     = (() => {
  try {
    const i18next     = require('./src/config/i18n');
    const i18nMW      = require('i18next-http-middleware');
    return i18nMW.handle(i18next);
  } catch { return null; }
})();

const app: Application = express();
const server = http.createServer(app);

// ── CORS ──────────────────────────────────────────────────────────────────
// In production CORS_ORIGINS MUST be set — fail fast if missing.
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) {
  throw new Error('CORS_ORIGINS env var is required in production');
}
const allowedOrigins: string[] = (
  process.env.CORS_ORIGINS ||
  'http://localhost:5173,http://localhost:5174,http://localhost:5176,http://localhost:5177,http://localhost:5178,http://localhost:5180'
).split(',').map((s: string) => s.trim());

app.use(cors({
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) =>
    (!origin || allowedOrigins.includes(origin))
      ? cb(null, true)
      : cb(new Error(`CORS: origin ${origin} not allowed`)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Project'],
}));

// ── Compression (gzip API responses > 1KB) ───────────────────────────────
app.use(compression({ threshold: 1024 }));

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── HTTP request logging (Morgan → Winston) ───────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: logger.stream,
  skip: (_req: Request, res: Response) =>
    process.env.NODE_ENV === 'production' && res.statusCode < 400,
}));

// ── i18n ──────────────────────────────────────────────────────────────────
if (i18nMiddleware) app.use(i18nMiddleware);

// ── Rate limiting ──────────────────────────────────────────────────────────
app.use('/api', publicLimiter);
['hub', 'game', 'trade', 'dating', 'sports', 'admin'].forEach((p: string) => {
  app.use(`/api/${p}/auth`, authLimiter);
});

// ── Risk detection (DDoS / IP block / injection / bot / geo) ─────────────
app.use(riskMiddleware.ddosGuard());
app.use(riskMiddleware.ipBlockGuard());
app.use(riskMiddleware.injectionGuard());
app.use(riskMiddleware.botGuard());
app.use(riskMiddleware.geoGuard());

// ── Static uploads ─────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));

// ── Project resolver (sets req.project + req.prisma) ──────────────────────
app.use(require('./src/shared/middlewares/projectResolver'));

// ── Config resolver (sets req.configService) ──────────────────────────────
app.use(configResolver);

// ── Swagger docs ───────────────────────────────────────────────────────────
mountSwagger(app);

// ── Module routes ──────────────────────────────────────────────────────────
app.use('/api/auth',   require('./src/shared/routes/auth.routes').default || require('./src/shared/routes/auth.routes'));
app.use('/api/hub',    require('./src/modules/hub/routes/index'));
app.use('/api/game',   require('./src/modules/game/routes/index'));
app.use('/api/trade',  require('./src/modules/trade/routes/index'));
app.use('/api/dating', require('./src/modules/dating/routes/index'));
app.use('/api/sports', require('./src/modules/sports/routes/index'));
app.use('/api/admin',  require('./src/modules/admin/routes/index'));
app.use('/api/lkvip',  require('./src/modules/lkvip/routes/index'));

// ── /api/v1/game alias (GAME_LAUNCH_API.md spec URLs) ─────────────────────
const _gameRouter = require('./src/modules/game/routes/index');
app.use('/api/v1/game', _gameRouter);

// ── Health & metrics ─────────────────────────────────────────────────────
let requestCount = 0;
let errorCount   = 0;
app.use((_req: Request, _res: Response, next: NextFunction) => { requestCount++; next(); });

app.get('/health', async (_req: Request, res: Response) => {
  const mem     = process.memoryUsage();
  const redisOk = await cache.ping().catch(() => false);

  // Lightweight DB liveness: run SELECT 1 against each Prisma client (5s timeout)
  const DB_PROJECTS = ['hub', 'game', 'trade', 'dating', 'sports', 'admin'] as const;
  const { getPrismaClient: _getPC } = require('./src/config/databases');
  const dbChecks = await Promise.all(
    DB_PROJECTS.map(async (name) => {
      try {
        await Promise.race([
          _getPC(name).$queryRaw`SELECT 1`,
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5_000)),
        ]);
        return { name, status: 'up' };
      } catch {
        return { name, status: 'down' };
      }
    }),
  );
  const allDbUp = dbChecks.every((d) => d.status === 'up');

  const payload = {
    status:   allDbUp && redisOk ? 'healthy' : 'degraded',
    version:  '2.0.0',
    ts:       new Date().toISOString(),
    uptime:   `${Math.round(process.uptime())}s`,
    memory: {
      rss:  `${Math.round(mem.rss  / 1024 / 1024)}MB`,
      heap: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    },
    requests: requestCount,
    errors:   errorCount,
    redis:    redisOk ? 'connected' : 'unavailable',
    databases: dbChecks,
  };

  res.status(allDbUp ? 200 : 503).json(payload);
});

app.get('/health/ready', (_req: Request, res: Response) => res.json({ ready: true }));
app.get('/health/live',  (_req: Request, res: Response) => res.json({ alive: true }));

// ── Prometheus-compatible metrics (protected by METRICS_API_KEY) ─────────
app.get('/metrics', (req: Request, res: Response) => {
  const apiKey = process.env.METRICS_API_KEY;
  if (apiKey) {
    const provided = req.headers['x-metrics-key'] ?? req.query['key'];
    if (provided !== apiKey) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
  }
  // original metrics handler below
  ((_req: Request, _res: Response) => {
  const mem    = process.memoryUsage();
  const uptime = process.uptime();
  const lines: string[] = [
    '# HELP lkvip_requests_total Total number of HTTP requests received',
    '# TYPE lkvip_requests_total counter',
    `lkvip_requests_total ${requestCount}`,
    '',
    '# HELP lkvip_errors_total Total number of HTTP errors (5xx)',
    '# TYPE lkvip_errors_total counter',
    `lkvip_errors_total ${errorCount}`,
    '',
    '# HELP lkvip_process_uptime_seconds Process uptime in seconds',
    '# TYPE lkvip_process_uptime_seconds gauge',
    `lkvip_process_uptime_seconds ${Math.round(uptime)}`,
    '',
    '# HELP lkvip_memory_rss_bytes Resident set size in bytes',
    '# TYPE lkvip_memory_rss_bytes gauge',
    `lkvip_memory_rss_bytes ${mem.rss}`,
    '',
    '# HELP lkvip_memory_heap_used_bytes Heap used in bytes',
    '# TYPE lkvip_memory_heap_used_bytes gauge',
    `lkvip_memory_heap_used_bytes ${mem.heapUsed}`,
    '',
    '# HELP lkvip_memory_heap_total_bytes Heap total in bytes',
    '# TYPE lkvip_memory_heap_total_bytes gauge',
    `lkvip_memory_heap_total_bytes ${mem.heapTotal}`,
  ];
  _res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  _res.send(lines.join('\n') + '\n');
  })(req, res);
});

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler (shared errorHandler + errorCount tracking) ───────
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.status >= 500 || (!err.status && !err.statusCode)) {
    errorCount++;
    // Capture in Sentry when DSN is configured
    if (process.env.SENTRY_DSN) {
      try { require('@sentry/node').captureException(err); } catch { /* skip */ }
    }
  }
  errorHandler(err, req, res, next);
});

// ── Socket.IO ─────────────────────────────────────────────────────────────
const io = new SocketIOServer(server, {
  cors:              { origin: allowedOrigins, credentials: true },
  transports:        ['websocket', 'polling'],
  pingInterval:      25_000,
  pingTimeout:       20_000,
  maxHttpBufferSize: 1e6,
});

// Store io in the centralised singleton so services can call getIo() anywhere
socketStore.setIo(io);
app.set('io', io);
require('./src/shared/socket/handlers')(io);

// ── Cron jobs ──────────────────────────────────────────────────────────────
cron.register();

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info('🚀 Multi-Project API v2.0 started', {
    port:    PORT,
    env:     process.env.NODE_ENV || 'development',
    modules: 'hub | game | trade | dating | sports | admin',
    docs:    `http://localhost:${PORT}/api/docs`,
    health:  `http://localhost:${PORT}/health`,
  });
});

// ── Graceful shutdown ──────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal} — graceful shutdown`);
  server.close(async () => {
    try {
      await Promise.all([
        cache.disconnect?.(),
        disconnectAll(),       // close all Prisma DB connections
      ]);
    } catch { /* ignore */ }
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced exit after 30s timeout');
    process.exit(1);
  }, 30_000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

export { app, server, io };
