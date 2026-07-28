// @ts-nocheck
/**
 * analyticsService.ts — Tầng 6: Shared Analytics Service
 *
 * Cross-project aggregation and reporting.
 * All reads use getReadClient() (replica-safe) with Redis caching.
 *
 * USAGE
 * ─────
 *   const analytics = require('./analyticsService');
 *
 *   // Platform-wide overview (admin dashboard)
 *   const overview = await analytics.getPlatformOverview();
 *
 *   // Per-project revenue for a date range
 *   const revenue = await analytics.getProjectRevenue('game', startDate, endDate);
 *
 *   // User retention metrics
 *   const retention = await analytics.getUserRetention('game', 7); // last 7 days
 */

'use strict';

const cache  = require('../cacheService');
const logger = require('../logger');

let _getReadClient: any;
function getReadClient(project: string) {
  if (!_getReadClient) {
    try {
      _getReadClient = require('../../../config/prismaReplica').getReadClient;
    } catch {
      // Fallback if replica not configured
      _getReadClient = require('../../../config/databases').getPrismaClient;
    }
  }
  return _getReadClient(project);
}

// ── Cache TTLs ─────────────────────────────────────────────────────────────
const TTL_OVERVIEW = 300;    // 5 min — platform overview
const TTL_REVENUE  = 600;    // 10 min — revenue charts
const TTL_DAU      = 1800;   // 30 min — daily active users (heavy query)

// ── Platform Overview ──────────────────────────────────────────────────────

/**
 * Returns aggregate user counts, deposit totals, and active sessions
 * across all 5 sub-projects. Cached 5 minutes.
 */
export async function getPlatformOverview() {
  return cache.remember('analytics:platform:overview', TTL_OVERVIEW, async () => {
    const projects = ['hub', 'game', 'trade', 'dating', 'sports'] as const;

    const results = await Promise.allSettled(
      projects.map(async (project) => {
        const prisma = getReadClient(project);
        const [userCount, activeCount] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { status: 'active' } }),
        ]);
        return { project, userCount, activeCount };
      }),
    );

    const projectStats = results
      .filter((r) => r.status === 'fulfilled')
      .map((r: any) => r.value);

    const totalUsers  = projectStats.reduce((s: number, p: any) => s + p.userCount,  0);
    const totalActive = projectStats.reduce((s: number, p: any) => s + p.activeCount, 0);

    return { projectStats, totalUsers, totalActive, generatedAt: new Date().toISOString() };
  });
}

// ── Revenue ────────────────────────────────────────────────────────────────

/**
 * Returns daily deposit totals for a project over a date range.
 * @param project  e.g. 'game'
 * @param startDate
 * @param endDate
 */
export async function getProjectRevenue(
  project: string,
  startDate: Date,
  endDate: Date,
): Promise<Array<{ date: string; total: number; count: number }>> {
  const cacheKey = `analytics:revenue:${project}:${startDate.toISOString().slice(0, 10)}:${endDate.toISOString().slice(0, 10)}`;

  return cache.remember(cacheKey, TTL_REVENUE, async () => {
    const prisma = getReadClient(project);
    try {
      const rows: any[] = await prisma.$queryRaw`
        SELECT
          DATE(created_at)  AS date,
          SUM(amount)       AS total,
          COUNT(*)          AS count
        FROM transactions
        WHERE type = 'deposit'
          AND status = 'completed'
          AND created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      return rows.map((r: any) => ({
        date:  String(r.date),
        total: Number(r.total),
        count: Number(r.count),
      }));
    } catch (err: any) {
      logger.warn(`[Analytics] getProjectRevenue(${project}) failed: ${err.message}`);
      return [];
    }
  });
}

// ── User Retention ─────────────────────────────────────────────────────────

/**
 * Returns daily active user (DAU) counts for the last N days.
 * @param project  e.g. 'game'
 * @param days     number of days to look back (default 7)
 */
export async function getUserRetention(
  project: string,
  days = 7,
): Promise<Array<{ date: string; dau: number }>> {
  const cacheKey = `analytics:dau:${project}:${days}d`;

  return cache.remember(cacheKey, TTL_DAU, async () => {
    const prisma   = getReadClient(project);
    const cutoff   = new Date(Date.now() - days * 86_400_000);
    try {
      const rows: any[] = await prisma.$queryRaw`
        SELECT
          DATE(last_login)  AS date,
          COUNT(DISTINCT id) AS dau
        FROM users
        WHERE last_login >= ${cutoff}
        GROUP BY DATE(last_login)
        ORDER BY date ASC
      `;
      return rows.map((r: any) => ({ date: String(r.date), dau: Number(r.dau) }));
    } catch (err: any) {
      logger.warn(`[Analytics] getUserRetention(${project}) failed: ${err.message}`);
      return [];
    }
  });
}

// ── Top Users ──────────────────────────────────────────────────────────────

/**
 * Returns top N users by total deposit for a project.
 * @param project
 * @param limit   default 10
 */
export async function getTopUsers(
  project: string,
  limit = 10,
): Promise<Array<{ userId: string; totalDeposit: number }>> {
  const cacheKey = `analytics:top-users:${project}:${limit}`;
  return cache.remember(cacheKey, TTL_DAU, async () => {
    const prisma = getReadClient(project);
    try {
      const rows: any[] = await prisma.$queryRaw`
        SELECT user_id AS userId, SUM(amount) AS totalDeposit
        FROM transactions
        WHERE type = 'deposit' AND status = 'completed'
        GROUP BY user_id
        ORDER BY totalDeposit DESC
        LIMIT ${limit}
      `;
      return rows.map((r: any) => ({ userId: r.userId, totalDeposit: Number(r.totalDeposit) }));
    } catch (err: any) {
      logger.warn(`[Analytics] getTopUsers(${project}) failed: ${err.message}`);
      return [];
    }
  });
}

module.exports = {
  getPlatformOverview,
  getProjectRevenue,
  getUserRetention,
  getTopUsers,
};
