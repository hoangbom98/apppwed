// @ts-nocheck
'use strict';
/**
 * ChurnPredictor — identifies users at risk of churning based on activity signals.
 *
 * Now multi-project: accepts a projectClients map { game, hub, trade, dating, sports }
 * and scans each project's users independently.
 *
 * Risk levels:
 *   high   → needs immediate retention action
 *   medium → monitor / gentle nudge
 *   low    → healthy
 */
const logger = require('../../../../shared/services/logger');

const INACTIVE_HIGH   = 14;   // days
const INACTIVE_MEDIUM = 7;
const AVG_DAILY_LOW   = 1000; // VND
const WIN_RATE_LOW    = 0.10;
const MIN_SESSIONS    = 10;

class ChurnPredictor {
  /**
   * @param {object} projectClients  – map: { game: PrismaClient, hub: PrismaClient, ... }
   * @param {object} adminPrisma     – Prisma client for admin DB
   */
  constructor(projectClients, adminPrisma) {
    // Accept both old (single gamePrisma) and new (projectClients map) signature
    if (projectClients && typeof projectClients === 'object' && !projectClients.$connect) {
      this.projects = projectClients;
    } else {
      this.projects = { game: projectClients };
    }
    this.admin = adminPrisma;
  }

  // ── Assess a single user in a specific project ────────────────────────────
  async assess(userId, project = 'game') {
    const db  = this.projects[project];
    if (!db) return { risk: 'unknown', userId, project };

    // userId is a cuid string in all project schemas
    const uid  = String(userId);
    const now  = Date.now();
    const cut30= new Date(now - 30 * 86400000);

    const user = await db.user.findUnique({
      where:  { id: uid },
      // lastLogin field name varies: game=lastLogin, sports/dating=lastSeen, hub/trade=lastLogin
      select: { id: true, lastLogin: true, lastSeen: true, createdAt: true },
    }).catch(() => null);

    if (!user) return { risk: 'unknown', userId: uid, project };

    // Recency — field name differs per project schema
    const lastActive = user.lastLogin || user.lastSeen || user.createdAt;
    const daysInactive = (now - new Date(lastActive).getTime()) / 86400000;

    if (daysInactive > INACTIVE_HIGH) {
      return { risk: 'high', reason: 'inactive_14_days', daysInactive, userId: uid, project };
    }

    // Monetary trend (last 30 days) — only for projects with lkvipTransaction
    let avgDaily = 0;
    try {
      const txns = await db.lkvipTransaction.findMany({
          where:  { userId: uid, type: 'deposit', createdAt: { gte: cut30 } },
        select: { amount: true },
      }).catch(() => []);
      avgDaily = txns.reduce((s, t) => s + Number(t.amount), 0) / 30;
    } catch { /* model may not exist on this project */ }

    if (avgDaily < AVG_DAILY_LOW && daysInactive > INACTIVE_MEDIUM) {
      return { risk: 'medium', reason: 'low_activity', avgDaily, daysInactive, userId: uid, project };
    }

    // Win-rate proxy (safe fallback if table doesn't exist)
    let winRate = null;
    try {
      const [wins, total] = await Promise.all([
        db.gameRound.count({ where: { userId: uid, result: 'win' } }),
        db.gameRound.count({ where: { userId: uid } }),
      ]);
      if (total >= MIN_SESSIONS) {
        winRate = wins / total;
        if (winRate < WIN_RATE_LOW) {
          return { risk: 'medium', reason: 'low_win_rate', winRate, userId: uid, project };
        }
      }
    } catch { /* table may not exist on all DB schemas */ }

    // Composite score
    const riskScore = Math.min(
      1,
      daysInactive / 30 +
      (1 - Math.min(avgDaily, 10000) / 10000) +
      (winRate !== null ? 1 - winRate : 0)
    );

    return {
      risk:   riskScore > 0.6 ? 'high' : riskScore > 0.3 ? 'medium' : 'low',
      score:  riskScore,
      daysInactive,
      avgDaily,
      userId: uid,
      project,
    };
  }

  // ── Scan all users across all projects ────────────────────────────────────
  async scanAll({ limit = 1000 } = {}) {
    const allAtRisk = [];

    for (const [project, db] of Object.entries(this.projects)) {
      if (!db) continue;
      let users = [];
      try {
        users = await db.user.findMany({ select: { id: true }, take: limit });
      } catch (err) {
        logger.error(`[Churn] scanAll project=${project}: ${err.message}`);
        continue;
      }

      const atRisk = [];
      for (const u of users) {
        try {
          const result = await this.assess(u.id, project);
          if (result.risk === 'high' || result.risk === 'medium') {
            atRisk.push(result);
            await this.admin.opsChurnAlert.create({
              data: {
                project,
                userId:       result.userId,
                riskLevel:    result.risk,
                reason:       result.reason || 'composite_score',
                score:        result.score || 0,
                daysInactive: Math.round(result.daysInactive || 0),
              },
            }).catch(() => {});
          }
        } catch { /* individual failure shouldn't stop the scan */ }
      }

      logger.info(`[Churn] project=${project} — ${atRisk.length} at-risk out of ${users.length}`);
      allAtRisk.push(...atRisk);
    }

    logger.info(`[Churn] scanAll done — ${allAtRisk.length} total at-risk across all projects`);
    return allAtRisk;
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  async getSummary(project) {
    try {
      const since = new Date(Date.now() - 24 * 86400000);
      const where = project
        ? { riskLevel: undefined, project, createdAt: { gte: since } }
        : { createdAt: { gte: since } };

      const [high, medium] = await Promise.all([
        this.admin.opsChurnAlert.count({ where: { ...where, riskLevel: 'high' } }),
        this.admin.opsChurnAlert.count({ where: { ...where, riskLevel: 'medium' } }),
      ]);
      return { high, medium, total: high + medium };
    } catch {
      return { high: 0, medium: 0, total: 0 };
    }
  }
}

module.exports = ChurnPredictor;
