// @ts-nocheck
'use strict';
/**
 * RiskScorer — central risk orchestrator.
 *
 * Calculates a composite risk score (0–100) for a user by aggregating:
 *   • Open risk alerts count
 *   • Failed login attempts
 *   • KYC status
 *   • Account suspension history
 *   • AML alerts
 *   • Recent security events
 *
 * Thresholds:
 *   score > 70 → critical  (auto-lock user + notify)
 *   score > 40 → high      (create risk alert + notify)
 *   score > 20 → medium    (log only)
 *   else       → low
 *
 * Usage:
 *   const scorer = new RiskScorer(adminPrisma);
 *   const result = await scorer.calculate(userId);
 *   // { score: 75, level: 'critical', actions: ['auto_locked'] }
 */
const logger      = require('../shared/services/logger');
const alertHelper = require('./alertHelper');

const SCORE_CRITICAL = 70;
const SCORE_HIGH     = 40;
const SCORE_MEDIUM   = 20;

class RiskScorer {
  constructor(prisma) {
    this.prisma = prisma; // admin prisma
  }

  /**
   * Calculate risk score for a user and apply automatic interventions.
   */
  async calculate(userId) {
    try {
      const [user, openAlerts, amlAlerts, secLogs] = await Promise.all([
        this.prisma.user.findUnique({
          where:  { id: userId },
          select: { status: true, kycLevel: true },
        }),
        this.prisma.riskAlert.count({
          where: { userId, status: { in: ['new', 'reviewed'] } },
        }),
        this.prisma.amlAlert.count({
          where: { userId, status: { in: ['new', 'escalated'] } },
        }).catch(() => 0),
        this.prisma.securityLog.count({
          where: {
            userId,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            severity: { in: ['high', 'critical'] },
          },
        }).catch(() => 0),
      ]);

      if (!user) return { score: 0, level: 'low', actions: [] };

      let score = 0;

      // Each open alert: +10
      score += openAlerts * 10;

      // AML alerts: +15 each
      score += amlAlerts * 15;

      // Recent high/critical security events: +8 each
      score += secLogs * 8;

      // KYC unverified: +20
      if (!['level1', 'level2', 'verified'].includes(user.kycLevel)) {
        score += 20;
      }

      // Already suspended/banned: +15
      if (user.status === 'suspended' || user.status === 'banned') {
        score += 15;
      }

      score = Math.min(100, score);

      const level   = this._scoreToLevel(score);
      const actions = [];

      // ── Auto-interventions ───────────────────────────────────────
      if (level === 'critical' && user.status === 'active') {
        await this._autoLock(userId, score);
        actions.push('auto_locked');
        await alertHelper.sendAlert(
          `🔒 [AUTO-LOCK] User \`${userId}\` khóa tự động — risk score: ${score}/100`,
          'critical'
        );
      } else if (level === 'high') {
        await this._ensureRiskAlert(userId, score, openAlerts);
        actions.push('risk_alert_created');
        await alertHelper.sendAlert(
          `⚠️ [HIGH RISK] User \`${userId}\` — score: ${score}/100`,
          'high'
        );
      }

      // Persist snapshot to RiskScore table
      await this.prisma.riskScore.upsert({
        where:  { id: userId }, // using userId as the effective lookup key below
        create: { userId, score, level, reason: { openAlerts, amlAlerts, secLogs } },
        update: { score, level, reason: { openAlerts, amlAlerts, secLogs }, updatedAt: new Date() },
      }).catch(async () => {
        // upsert by userId instead if no id-based unique index
        await this.prisma.riskScore.create({
          data: { userId, score, level, reason: { openAlerts, amlAlerts, secLogs } },
        }).catch(() => {});
      });

      logger.info(`[RiskScorer] userId=${userId} score=${score} level=${level}`);
      return { score, level, actions };
    } catch (err) {
      logger.error('[RiskScorer] calculate error', { err: err.message });
      return { score: 0, level: 'low', actions: [] };
    }
  }

  _scoreToLevel(score) {
    if (score >= SCORE_CRITICAL) return 'critical';
    if (score >= SCORE_HIGH)     return 'high';
    if (score >= SCORE_MEDIUM)   return 'medium';
    return 'low';
  }

  async _autoLock(userId, score) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data:  { status: 'banned' },
      });

      const rule = await this._getOrCreateRule('auto_lock', 'Automatic lock due to critical risk score');
      await this.prisma.riskAlert.create({
        data: {
          userId,
          ruleId:  rule.id,
          details: { reason: 'high_risk_score', score },
          status:  'resolved',
        },
      });
    } catch (err) {
      logger.error('[RiskScorer] _autoLock error', { err: err.message });
    }
  }

  async _ensureRiskAlert(userId, score, existingAlerts) {
    if (existingAlerts > 0) return; // already flagged
    try {
      const rule = await this._getOrCreateRule('risk_score_high', 'High composite risk score alert');
      await this.prisma.riskAlert.create({
        data: {
          userId,
          ruleId:  rule.id,
          details: { score, reason: 'composite_score' },
          status:  'new',
        },
      });
    } catch (err) {
      logger.error('[RiskScorer] _ensureRiskAlert error', { err: err.message });
    }
  }

  async _getOrCreateRule(name, description) {
    let rule = await this.prisma.riskRule.findFirst({ where: { name } });
    if (!rule) {
      rule = await this.prisma.riskRule.create({
        data: { name, description, action: 'auto_response', status: 'active' },
      });
    }
    return rule;
  }

  /**
   * Batch recalculation for all users — called by cron.
   */
  async runBatch(limit = 1000) {
    try {
      const users = await this.prisma.user.findMany({
        where:  { status: { in: ['active', 'suspended'] } },
        select: { id: true },
        take:   limit,
      });

      let processed = 0;
      for (const u of users) {
        await this.calculate(u.id);
        processed++;
      }
      logger.info(`[RiskScorer] batch complete — processed ${processed} users`);
      return processed;
    } catch (err) {
      logger.error('[RiskScorer] runBatch error', { err: err.message });
      return 0;
    }
  }
}

module.exports = RiskScorer;
