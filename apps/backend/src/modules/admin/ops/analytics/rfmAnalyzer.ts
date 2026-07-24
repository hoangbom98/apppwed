// @ts-nocheck
'use strict';
/**
 * RFMAnalyzer — Recency / Frequency / Monetary segmentation.
 *
 * Now multi-project: accepts a projectClients map { game, hub, trade, dating, sports }
 * and analyzes each project's users independently.
 *
 * Segment ladder:
 *   champion  → R≥4 F≥4 M≥4
 *   gold      → R≥3 F≥3 M≥3
 *   silver    → R≥2 F≥2
 *   at_risk   → R≤2 F≤2 M≤2
 *   bronze    → everything else
 */
const logger = require('../../../../shared/services/logger');

class RFMAnalyzer {
  /**
   * @param {object} projectClients  – map: { game: PrismaClient, hub: PrismaClient, ... }
   * @param {object} adminPrisma     – Prisma client for admin DB
   */
  constructor(projectClients, adminPrisma) {
    // Accept both old (single gamePrisma) and new (projectClients map) signature
    if (projectClients && typeof projectClients === 'object' && !projectClients.$connect) {
      this.projects = projectClients;
    } else {
      // Legacy: single prisma client passed as first arg (game only)
      this.projects = { game: projectClients };
    }
    this.admin = adminPrisma;
  }

  // ── Public: analyze one user in a specific project ───────────────────────
  async analyze(userId, project = 'game') {
    const db  = this.projects[project];
    if (!db) return null;

    // userId is a cuid string in all project schemas
    const uid = String(userId);

    const transactions = await db.lkvipTransaction.findMany({
      where:   { userId: uid },
      orderBy: { createdAt: 'desc' },
      select:  { createdAt: true, amount: true, type: true },
    }).catch(() => []);

    const deposits = transactions.filter(t => t.type === 'deposit');

    // ── Recency (days since last deposit) ────────────────────────────────
    const lastTx  = deposits[0];
    const recency = lastTx
      ? (Date.now() - new Date(lastTx.createdAt).getTime()) / 86400000
      : 999;

    // ── Frequency (deposits in last 30 days) ────────────────────────────
    const cutoff30  = new Date(Date.now() - 30 * 86400000);
    const last30    = deposits.filter(t => new Date(t.createdAt) > cutoff30);
    const frequency = last30.length;

    // ── Monetary (total deposited in last 30 days) ───────────────────────
    const monetary  = last30.reduce((s, t) => s + Number(t.amount), 0);

    // ── Score each dimension 1–5 ──────────────────────────────────────────
    const rScore = recency  < 1  ? 5 : recency  < 3  ? 4 : recency  < 7  ? 3 : recency  < 14 ? 2 : 1;
    const fScore = frequency > 10 ? 5 : frequency > 5  ? 4 : frequency > 2  ? 3 : frequency > 0  ? 2 : 1;
    const mScore = monetary > 10000000 ? 5 : monetary > 5000000 ? 4 : monetary > 1000000 ? 3 : monetary > 500000 ? 2 : 1;

    // ── Segment ───────────────────────────────────────────────────────────
    let segment = 'bronze';
    if (rScore >= 4 && fScore >= 4 && mScore >= 4)       segment = 'champion';
    else if (rScore >= 3 && fScore >= 3 && mScore >= 3)  segment = 'gold';
    else if (rScore >= 2 && fScore >= 2)                 segment = 'silver';
    else if (rScore <= 2 && fScore <= 2 && mScore <= 2)  segment = 'at_risk';

    // ── Persist ───────────────────────────────────────────────────────────
    // OpsUserSegment userId is Int in admin schema — hash cuid to consistent int via modulo
    const adminUid = uid.split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) | 0, 0);
    const safeUid  = Math.abs(adminUid);
    try {
      await this.admin.opsUserSegment.upsert({
        where:  { project_userId: { project, userId: safeUid } },
        create: { project, userId: safeUid, segment, rScore, fScore, mScore, recencyDays: recency, frequency, monetary },
        update: { segment, rScore, fScore, mScore, recencyDays: recency, frequency, monetary, updatedAt: new Date() },
      });
    } catch (err) {
      logger.warn(`[RFM] upsert failed project=${project} uid=${uid}: ${err.message}`);
    }

    return { project, userId: uid, recency, frequency, monetary, rScore, fScore, mScore, segment };
  }

  // ── Public: update all active users across all configured projects ────────
  async updateAll() {
    let totalUpdated = 0;

    for (const [project, db] of Object.entries(this.projects)) {
      if (!db) continue;
      let users = [];
      try {
        users = await db.user.findMany({ select: { id: true }, take: 500 });
      } catch (err) {
        logger.error(`[RFM] updateAll user fetch project=${project}: ${err.message}`);
        continue;
      }

      let updated = 0;
      for (const u of users) {
        try {
          await this.analyze(u.id, project);
          updated++;
        } catch (err) {
          logger.warn(`[RFM] analyze project=${project} uid=${u.id}: ${err.message}`);
        }
      }
      logger.info(`[RFM] project=${project} done — ${updated}/${users.length}`);
      totalUpdated += updated;
    }

    logger.info(`[RFM] updateAll done — total ${totalUpdated} across ${Object.keys(this.projects).length} projects`);
    return totalUpdated;
  }

  // ── Public: distribution summary per project ──────────────────────────────
  async getDistribution(project) {
    try {
      const where = project ? { project } : {};
      const rows = await this.admin.opsUserSegment.groupBy({
        by:     ['segment'],
        where,
        _count: { segment: true },
      });
      const out = {};
      for (const r of rows) out[r.segment] = r._count.segment;
      return out;
    } catch {
      return {};
    }
  }
}

module.exports = RFMAnalyzer;
