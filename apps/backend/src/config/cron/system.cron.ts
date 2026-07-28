/**
 * config/cron/system.cron.ts — System-level maintenance jobs.
 *
 * Jobs:
 *   keep-alive          every 14 min    ping APP_URL/health/live (prod only)
 *   clear-expired-cache every 5 min     flush expired in-memory cache entries
 *   health-snapshot     every 10 min    log RSS/heap/uptime
 *   reset-daily-flags   daily 00:00     clear daily:* cache keys at midnight
 *   clean-audit-logs    daily 03:00     delete audit rows >90 days (info level)
 *   clean-security-logs daily 04:00     delete security rows >30 days (low/medium)
 *   purge-ip-blacklist  every 6 h       remove expired IP blacklist entries
 */

import { logger } from '../../shared/services/core/logger';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cache = require('../../shared/services/core/cacheService') as {
  flush: (mode?: string) => Promise<void>;
  del:   (key: string) => Promise<void>;
  getMetrics?: () => Record<string, unknown>;
  [k: string]: unknown;
};
import { getPrismaClient } from '../databases';

export async function clearExpiredCache(): Promise<void> {
  await cache.flush('expired');
}

export async function resetDailyFlags(): Promise<void> {
  await cache.del('daily:*');
  logger.info('Daily flags reset');
}

export async function healthSnapshot(): Promise<void> {
  const mem = process.memoryUsage();
  const cacheMetrics = cache.getMetrics ? cache.getMetrics() : {};
  logger.info('health_snapshot', {
    rss:    `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heap:   `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    uptime: `${Math.round(process.uptime())}s`,
    cache:  cacheMetrics,
  });
}

export async function cleanAuditLogs(): Promise<void> {
  try {
    const prisma  = getPrismaClient('admin');
    const cutoff  = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const { count } = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff }, status: { in: ['info', 'success'] } },
    });
    if (count > 0) logger.info(`Cleaned ${count} old audit logs`);
  } catch (err: any) {
    logger.error('cleanAuditLogs failed', { err: err.message });
  }
}

export async function cleanSecurityLogs(): Promise<void> {
  try {
    const prisma  = getPrismaClient('admin');
    const cutoff  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { count } = await prisma.securityLog.deleteMany({
      where: { createdAt: { lt: cutoff }, severity: { in: ['low', 'medium'] } },
    });
    if (count > 0) logger.info(`[RiskCron] cleaned ${count} old security logs`);
  } catch (err: any) {
    logger.error('cleanSecurityLogs failed', { err: err.message });
  }
}

export async function purgeExpiredIpBlacklist(): Promise<void> {
  try {
    const prisma = getPrismaClient('admin');
    const { count } = await prisma.ipBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) logger.info(`Purged ${count} expired IP blacklist entries`);
  } catch (err: any) {
    logger.error('purgeExpiredIpBlacklist failed', { err: err.message });
  }
}

export async function keepAlive(): Promise<void> {
  const appUrl = process.env.APP_URL;
  if (!appUrl || process.env.NODE_ENV !== 'production') return;
  try {
    const res = await fetch(`${appUrl}/health/live`, { signal: AbortSignal.timeout(5000) });
    logger.debug(`[KeepAlive] ping → ${res.status}`);
  } catch (err: any) {
    logger.warn(`[KeepAlive] ping failed: ${err.message}`);
  }
}
