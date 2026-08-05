'use strict';
/**
 * AmlService — Anti-Money Laundering checks.
 *
 * Lưu ý: AmlAlert ở admin_db, không phải lkvip_db.
 * Prisma client được truyền qua constructor để dùng đúng DB.
 *
 * Các trường dailyDepositLimit / totalDepositToday KHÔNG có trong User schema.
 * Thay bằng cách aggregate trực tiếp từ bảng transactions trong 24h gần nhất.
 */
// decimal.js installed lazily — fallback to native if missing
let Decimal: any;
try { Decimal = require('decimal.js'); } catch { Decimal = Number; }

const logger = require('../../../shared/services/logger');

// AML thresholds (VND)
const NEW_USER_BIG_DEPOSIT_THRESHOLD = 10_000_000;  // 10 triệu
const KYC_UNVERIFIED_THRESHOLD       = 20_000_000;  // 20 triệu
const DAILY_DEPOSIT_LIMIT_DEFAULT    = 50_000_000;  // 50 triệu (nếu chưa cấu hình)
const DAILY_WITHDRAW_LIMIT_DEFAULT   = 30_000_000;  // 30 triệu

class AmlService {
  private projectPrisma: any;  // game/lkvip prisma — đọc transactions, users
  private adminPrisma: any;    // admin prisma — ghi AmlAlert

  /**
   * @param projectPrisma  – prisma client của project (game, lkvip, trade…)
   * @param adminPrisma    – prisma client của admin DB (chứa AmlAlert)
   *                         Nếu không truyền, cố load từ getPrismaClient('admin').
   */
  constructor(projectPrisma: any, adminPrisma?: any) {
    this.projectPrisma = projectPrisma;
    if (adminPrisma) {
      this.adminPrisma = adminPrisma;
    } else {
      try {
        const { getPrismaClient } = require('../../../config/databases');
        this.adminPrisma = getPrismaClient('admin');
      } catch {
        this.adminPrisma = null;
      }
    }
  }

  /**
   * Kiểm tra AML khi user nạp tiền.
   * Aggregate giao dịch 24h để tính tổng nạp hôm nay thay vì query field ảo.
   */
  async checkDeposit(userId: string, amount: any) {
    const amt = new Decimal(amount);
    const alerts: Array<{ rule: string; type: string; details: Record<string, any> }> = [];

    const user = await this.projectPrisma.user.findUnique({
      where:  { id: userId },
      select: { createdAt: true, kycLevel: true, kycVerified: true, status: true },
    }).catch(() => null);

    if (!user) return alerts;

    // Tính tổng nạp trong 24h gần nhất từ bảng transactions
    const since24h   = new Date(Date.now() - 86_400_000);
    const depositAgg = await this.projectPrisma.transaction.aggregate({
      where: {
        userId,
        type:      { in: ['deposit', 'virtual_account'] },
        createdAt: { gte: since24h },
      },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } }));

    const totalToday = new Decimal(depositAgg._sum?.amount ?? 0);

    // Rule 1: User mới (< 24h) nạp lớn hơn 10 triệu
    const userAge = Date.now() - user.createdAt.getTime();
    if (userAge < 86_400_000 && amt.gt(NEW_USER_BIG_DEPOSIT_THRESHOLD)) {
      alerts.push({
        rule:    'new_user_big_deposit',
        type:    'large_deposit',
        details: { amount: amt.toString(), ageMs: userAge },
      });
    }

    // Rule 2: Tổng nạp 24h vượt giới hạn hàng ngày
    const dailyLimit = new Decimal(DAILY_DEPOSIT_LIMIT_DEFAULT);
    if (totalToday.add(amt).gt(dailyLimit)) {
      alerts.push({
        rule:    'daily_limit_exceeded',
        type:    'large_deposit',
        details: {
          limit:     dailyLimit.toString(),
          today:     totalToday.toString(),
          requested: amt.toString(),
        },
      });
    }

    // Rule 3: KYC chưa xác minh mà nạp > 20 triệu
    const kycVerified = user.kycVerified === true || user.kycLevel === 'verified';
    if (!kycVerified && amt.gt(KYC_UNVERIFIED_THRESHOLD)) {
      alerts.push({
        rule:    'unverified_kyc_large_deposit',
        type:    'large_deposit',
        details: { amount: amt.toString(), kycVerified },
      });
    }

    await this._saveAlerts(userId, alerts);
    return alerts;
  }

  /**
   * Kiểm tra AML khi user rút tiền.
   */
  async checkWithdrawal(userId: string, amount: any) {
    const amt    = new Decimal(amount);
    const alerts: Array<{ rule: string; type: string; details: Record<string, any> }> = [];

    // Tính tổng rút trong 24h
    const since24h      = new Date(Date.now() - 86_400_000);
    const withdrawAgg   = await this.projectPrisma.transaction.aggregate({
      where: {
        userId,
        type:      { in: ['withdraw', 'withdrawal'] },
        createdAt: { gte: since24h },
      },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } }));

    const totalToday     = new Decimal(Math.abs(Number(withdrawAgg._sum?.amount ?? 0)));
    const dailyLimit     = new Decimal(DAILY_WITHDRAW_LIMIT_DEFAULT);

    if (totalToday.add(amt).gt(dailyLimit)) {
      alerts.push({
        rule:    'withdraw_limit_exceeded',
        type:    'rapid_turnover',
        details: {
          limit:     dailyLimit.toString(),
          today:     totalToday.toString(),
          requested: amt.toString(),
        },
      });
    }

    await this._saveAlerts(userId, alerts);
    return alerts;
  }

  /**
   * Xử lý / đóng AML alert (dùng bởi admin controller).
   */
  async resolveAlert(alertId: string, adminId: string, resolution: string) {
    if (!this.adminPrisma) throw new Error('Admin prisma client not configured');
    const alert = await this.adminPrisma.amlAlert.findUnique({ where: { id: alertId } });
    if (!alert) throw new Error('Alert not found');

    const existingDetails = typeof alert.details === 'string'
      ? JSON.parse(alert.details)
      : (alert.details ?? {});

    return this.adminPrisma.amlAlert.update({
      where: { id: alertId },
      data: {
        status:     'resolved',
        resolvedBy: adminId,
        resolvedAt: new Date(),
        details:    { ...existingDetails, resolution },
      },
    });
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private async _saveAlerts(userId: string, alerts: Array<{ rule: string; type: string; details: Record<string, any> }>) {
    if (!alerts.length || !this.adminPrisma) return;
    try {
      await this.adminPrisma.amlAlert.createMany({
        data: alerts.map(a => ({
          userId,
          type:       a.type,
          severity:   a.rule.includes('big') ? 'high' : 'medium',
          details:    a.details,
          status:     'open',
        })),
        skipDuplicates: true,
      });
    } catch (err: any) {
      logger.error(`[AmlService] Failed to save alerts: ${err.message}`);
    }
  }
}

export default AmlService;
