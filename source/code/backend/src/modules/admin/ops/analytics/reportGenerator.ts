// @ts-nocheck
'use strict';
/**
 * ReportGenerator — produces daily operational snapshots across all 5 projects.
 *
 * Report is stored in admin DB (opsDailyReport) and can be
 * forwarded to Telegram if BOT_TOKEN / CHAT_ID are configured.
 */
const logger = require('../../../../shared/services/logger');

const safeCount = async (model, where = {}) => {
  try { return await model.count({ where }); } catch { return 0; }
};

const _safeSum = async (model, field, where = {}) => {
  try {
    const r = await model.aggregate({ _sum: { [field]: true }, where });
    return Number(r._sum?.[field] || 0);
  } catch { return 0; }
};

class ReportGenerator {
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

  // ── Generate + persist daily report ──────────────────────────────────────
  async generateDaily() {
    const now       = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    const todayStr  = now.toISOString().slice(0, 10);

    // ── Per-project user stats ────────────────────────────────────────────
    const projectStats = {};
    let totalUsers = 0, totalNewUsers = 0;

    for (const [project, db] of Object.entries(this.projects)) {
      if (!db) continue;
      const [users, newUsers] = await Promise.all([
        safeCount(db.user),
        safeCount(db.user, { createdAt: { gte: yesterday } }),
      ]);
      projectStats[project] = { users, newUsers };
      totalUsers    += users;
      totalNewUsers += newUsers;
    }

    // ── Financial stats (game DB — transaction ledger) ─────────────────
    const gameDb = this.projects.game;
    let depositAmt = 0, depositCount = 0, withdrawAmt = 0, withdrawCount = 0;
    if (gameDb) {
      const [deposits, withdrawals] = await Promise.all([
        gameDb.transaction.aggregate({
          where: { type: 'deposit',  createdAt: { gte: yesterday } },
          _count: true, _sum: { amount: true },
        }).catch(() => ({ _count: 0, _sum: { amount: 0 } })),
        gameDb.transaction.aggregate({
          where: { type: 'withdraw', createdAt: { gte: yesterday } },
          _count: true, _sum: { amount: true },
        }).catch(() => ({ _count: 0, _sum: { amount: 0 } })),
      ]);
      depositAmt    = Math.abs(Number(deposits._sum?.amount   || 0));
      withdrawAmt   = Math.abs(Number(withdrawals._sum?.amount || 0));
      depositCount  = Number(deposits._count  || 0);
      withdrawCount = Number(withdrawals._count || 0);
    }

    // ── Admin ops stats ────────────────────────────────────────────────────
    const [ticketsCreated, ticketsResolved, tasksCompleted, campaignsSent] = await Promise.all([
      safeCount(this.admin.supportTicket, { createdAt: { gte: yesterday } }),
      safeCount(this.admin.supportTicket, { status: 'closed', updatedAt: { gte: yesterday } }),
      safeCount(this.admin.opsTask,       { status: 'completed', completedAt: { gte: yesterday } }),
      safeCount(this.admin.opsCampaignLog, { createdAt: { gte: yesterday } }),
    ]);

    const report = {
      date: todayStr,
      summary: {
        totalUsers,
        totalNewUsers,
        byProject: projectStats,
      },
      financial: {
        depositAmount:   depositAmt,
        depositCount,
        withdrawAmount:  withdrawAmt,
        withdrawCount,
        netRevenue:      depositAmt - withdrawAmt,
      },
      operations: {
        ticketsCreated,
        ticketsResolved,
        tasksCompleted,
        campaignsSent,
      },
    };

    // Persist
    try {
      await this.admin.opsDailyReport.upsert({
        where:  { date: todayStr },
        create: { date: todayStr, payload: JSON.stringify(report) },
        update: { payload: JSON.stringify(report), updatedAt: new Date() },
      });
    } catch (err) {
      logger.warn(`[Report] persist failed: ${err.message}`);
    }

    // Optional Telegram
    await this._sendTelegram(report);

    logger.info(`[Report] daily report generated for ${todayStr} (${Object.keys(this.projects).join(', ')})`);
    return report;
  }

  // ── Fetch last N days of reports ──────────────────────────────────────────
  async getRecent(days = 7) {
    try {
      const rows = await this.admin.opsDailyReport.findMany({
        orderBy: { date: 'desc' },
        take:    days,
      });
      return rows.map(r => ({
        date:    r.date,
        ...JSON.parse(r.payload || '{}'),
      }));
    } catch {
      return [];
    }
  }

  // ── Telegram summary ──────────────────────────────────────────────────────
  async _sendTelegram(report) {
    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    const fmt = n => Number(n || 0).toLocaleString('vi-VN');

    // Per-project summary lines
    const projectLines = Object.entries(report.summary.byProject || {})
      .map(([p, s]) => ` • ${p}: ${fmt(s.users)} users (+${fmt(s.newUsers)} mới)`)
      .join('\n');

    const msg = `
📊 *Báo cáo ngày ${report.date}*

👤 *Người dùng (tổng):* ${fmt(report.summary.totalUsers)} | Mới ${fmt(report.summary.totalNewUsers)}
${projectLines}

💰 *Tài chính (game):*
 • Nạp: ${fmt(report.financial.depositAmount)}đ (${fmt(report.financial.depositCount)} GD)
 • Rút: ${fmt(report.financial.withdrawAmount)}đ (${fmt(report.financial.withdrawCount)} GD)
 • Net: ${fmt(report.financial.netRevenue)}đ

🛠 *Vận hành:*
 • Ticket: ${fmt(report.operations.ticketsCreated)} mới / ${fmt(report.operations.ticketsResolved)} giải quyết
 • Task hoàn thành: ${fmt(report.operations.tasksCompleted)}
 • Campaign đã gửi: ${fmt(report.operations.campaignsSent)}
    `.trim();

    try {
      const https = require('https');
      const body  = JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' });
      await new Promise((res, rej) => {
        const req = https.request(
          `https://api.telegram.org/bot${token}/sendMessage`,
          { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
          (r) => { r.resume(); res(); }
        );
        req.on('error', rej);
        req.write(body);
        req.end();
      });
    } catch (err) {
      logger.warn(`[Report] Telegram send failed: ${err.message}`);
    }
  }
}

module.exports = ReportGenerator;
