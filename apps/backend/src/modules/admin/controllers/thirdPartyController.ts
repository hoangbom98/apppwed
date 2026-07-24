// backend/src/modules/admin/controllers/thirdPartyController.ts
// ─────────────────────────────────────────────────────────────────────────────
// Admin API for Third-Party Service Layer management.
//
// Routes (all require auth + adminGuard):
//   GET    /api/admin/third-party/providers           — list all registered providers + status
//   GET    /api/admin/third-party/providers/:code     — provider detail + services
//   POST   /api/admin/third-party/providers/:code/reload  — hot-reload a provider from DB
//   GET    /api/admin/third-party/health              — poll health of all providers
//   POST   /api/admin/third-party/providers/:code/rtp — set RTP (Goldgate only)
//   GET    /api/admin/third-party/calls               — paginated call log
//   GET    /api/admin/third-party/calls/stats         — success rate, avg latency per provider
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { ServiceRegistry }    = require('../../../third-parties/core/ServiceRegistry');
const { ConnectionManager }  = require('../../../third-parties/managers/ConnectionManager');
const { GoldgateProvider }   = require('../../../third-parties/providers/Goldgate/GoldgateProvider');
const { getPrismaClient }    = require('../../../shared/config/databases');
const { success, error, notFound, paginate } = require('../../../shared/utils/response');

// ── List providers ────────────────────────────────────────────────────────────

exports.listProviders = async (req, res) => {
  try {
    const registry = ServiceRegistry.getInstance();
    await registry.ensureLoaded();

    const codes    = registry.getProviderCodes();
    const providers = await Promise.all(codes.map(async (code) => {
      const provider = registry.getProvider(code);
      const services = await provider.getServices();
      return {
        code,
        name:     provider.name,
        scopes:   provider.scopes,
        services: services.map((s) => ({ type: s.type, name: s.name })),
      };
    }));

    return success(res, { providers, total: providers.length });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Provider detail ───────────────────────────────────────────────────────────

exports.getProvider = async (req, res) => {
  try {
    const registry = ServiceRegistry.getInstance();
    const provider = registry.getProvider(req.params.code);
    if (!provider) return notFound(res, `Provider "${req.params.code}" not registered`);

    const services = await provider.getServices();

    // Pull live config from game_db (sans secret)
    const gamePrisma = getPrismaClient('game');
    const cfg = await gamePrisma.gameAggregator.findFirst({
      where:  { code: req.params.code.toUpperCase() },
      select: { id: true, name: true, code: true, baseUrl: true, status: true, config: true, sortOrder: true, updatedAt: true },
    }).catch(() => null);

    return success(res, {
      code:    provider.name,
      scopes:  provider.scopes,
      config:  cfg,
      services: services.map((s) => ({ type: s.type, name: s.name, providerName: s.providerName })),
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Reload provider ───────────────────────────────────────────────────────────

exports.reloadProvider = async (req, res) => {
  try {
    const registry = ServiceRegistry.getInstance();
    await registry.reloadProvider(req.params.code);
    // Invalidate health cache for the reloaded provider
    ConnectionManager.getInstance().invalidate(req.params.code);
    return success(res, { reloaded: req.params.code.toUpperCase() });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Health status ─────────────────────────────────────────────────────────────

exports.healthStatus = async (req, res) => {
  try {
    const registry = ServiceRegistry.getInstance();
    const cm       = ConnectionManager.getInstance();
    const codes    = registry.getProviderCodes();

    const results = await Promise.all(codes.map(async (code) => {
      const provider = registry.getProvider(code);
      const t0       = Date.now();
      const healthy  = await cm.checkHealth(provider);
      return { code, healthy, latencyMs: Date.now() - t0 };
    }));

    return success(res, { providers: results, checkedAt: new Date().toISOString() });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Set RTP (Goldgate only) ───────────────────────────────────────────────────

exports.setRTP = async (req, res) => {
  try {
    const { gameId, rtp } = req.body;
    if (!gameId || rtp == null) return error(res, 'gameId and rtp are required', 400);
    if (rtp < 50 || rtp > 99) return error(res, 'rtp must be between 50 and 99', 400);

    const registry = ServiceRegistry.getInstance();
    const provider = registry.getProvider(req.params.code ?? 'GOLDGATE');
    if (!provider) return notFound(res, `Provider "${req.params.code}" not registered`);
    if (!(provider instanceof GoldgateProvider)) {
      return error(res, `Provider "${provider.name}" does not support RTP adjustment`, 400);
    }

    const result = await provider.setRTP(gameId, Number(rtp));
    return success(res, { provider: provider.name, gameId, rtp, result });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Call log ──────────────────────────────────────────────────────────────────

exports.listCallLogs = async (req, res) => {
  try {
    const adminPrisma = getPrismaClient('admin');
    const { page = 1, limit = 50, provider, project, success: successParam, from, to } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (provider) where['providerCode'] = provider.toString().toUpperCase();
    if (project)  where['project']      = project;
    if (successParam !== undefined) where['success'] = successParam === 'true';
    if (from || to) {
      where['createdAt'] = {};
      if (from) (where['createdAt'] as Record<string, unknown>)['gte'] = new Date(String(from));
      if (to)   (where['createdAt'] as Record<string, unknown>)['lte'] = new Date(String(to));
    }

    const [logs, total] = await Promise.all([
      adminPrisma.thirdPartyCallLog.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      adminPrisma.thirdPartyCallLog.count({ where }),
    ]);

    return paginate(res, logs, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Call log stats ────────────────────────────────────────────────────────────

exports.callLogStats = async (req, res) => {
  try {
    const adminPrisma = getPrismaClient('admin');
    const since = req.query.since ? new Date(String(req.query.since)) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [total, failures, byProvider] = await Promise.all([
      adminPrisma.thirdPartyCallLog.count({ where: { createdAt: { gte: since } } }),
      adminPrisma.thirdPartyCallLog.count({ where: { success: false, createdAt: { gte: since } } }),
      adminPrisma.thirdPartyCallLog.groupBy({
        by: ['providerCode'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        _avg:   { durationMs: true },
      }),
    ]);

    return success(res, {
      since:       since.toISOString(),
      total,
      failures,
      successRate: total > 0 ? `${(((total - failures) / total) * 100).toFixed(1)}%` : '—',
      byProvider:  byProvider.map((r) => ({
        provider:      r.providerCode,
        calls:         r._count.id,
        avgLatencyMs:  Math.round(r._avg.durationMs ?? 0),
      })),
    });
  } catch (e) { return error(res, e.message, 500); }
};
