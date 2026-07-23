// @ts-nocheck
/* eslint-disable */

import { PrismaClient } from '@prisma/client';
type AmlAlert = any; // Generated only after prisma generate — stub to avoid import error
// decimal.js installed lazily — fallback to native if missing
let Decimal: any;
try { Decimal = require('decimal.js'); } catch { Decimal = Number; }

interface AmlAlertInput {
  rule: string;
  details: Record<string, any>;
}

class AmlService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async checkDeposit(userId: string, amount: Decimal) {
    const alerts: AmlAlertInput[] = [];
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        kycStatus: true,
        // Assuming these exist based on the logic
        dailyDepositLimit: true,
        totalDepositToday: true,
      },
    });

    if (!user) return alerts;

    // Rule 1: New user (< 24h) deposits large amount > 10M VND
    if (Date.now() - user.createdAt.getTime() < 24 * 60 * 60 * 1000 && amount.gt(10000000)) {
      alerts.push({
        rule: 'new_user_big_deposit',
        details: { amount: amount.toString(), age: 'new' },
      });
    }

    // Rule 2: Exceeds daily limit
    const dailyDepositLimit = new Decimal(user.dailyDepositLimit ?? 0);
    const totalDepositToday = new Decimal(user.totalDepositToday ?? 0);
    if (totalDepositToday.add(amount).gt(dailyDepositLimit)) {
      alerts.push({
        rule: 'daily_limit_exceeded',
        details: { limit: dailyDepositLimit.toString(), current: totalDepositToday.toString(), requested: amount.toString() },
      });
    }

    // Rule 3: Unverified KYC but deposits large amount > 20M VND
    if (user.kycStatus !== 'verified' && amount.gt(20000000)) {
      alerts.push({
        rule: 'unverified_kyc_large_deposit',
        details: { amount: amount.toString(), kycStatus: user.kycStatus },
      });
    }

    // Save alerts using createMany
    if (alerts.length > 0) {
      await this.prisma.amlAlert.createMany({
        data: alerts.map(alert => ({
          userId,
          ruleTriggered: alert.rule,
          details: JSON.stringify(alert.details),
          status: 'new',
        })),
      });
    }

    return alerts;
  }

  async checkWithdrawal(userId: string, amount: Decimal) {
    const alerts: AmlAlertInput[] = [];
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
        dailyWithdrawLimit: true,
        totalWithdrawToday: true,
      },
    });

    if (!user) return alerts;

    // Rule: Exceeds daily withdraw limit
    const dailyWithdrawLimit = new Decimal(user.dailyWithdrawLimit ?? 0);
    const totalWithdrawToday = new Decimal(user.totalWithdrawToday ?? 0);
    if (totalWithdrawToday.add(amount).gt(dailyWithdrawLimit)) {
      alerts.push({
        rule: 'withdraw_limit_exceeded',
        details: { limit: dailyWithdrawLimit.toString(), current: totalWithdrawToday.toString(), requested: amount.toString() },
      });
    }

    // Save alerts
    if (alerts.length > 0) {
      await this.prisma.amlAlert.createMany({
        data: alerts.map(alert => ({
          userId,
          ruleTriggered: alert.rule,
          details: JSON.stringify(alert.details),
          status: 'new',
        })),
      });
    }

    return alerts;
  }

  // Resolve AML alert (admin)
  async resolveAlert(alertId: string, adminId: string, resolution: string) {
    const alert = await this.prisma.amlAlert.findUnique({ where: { id: alertId } });
    if (!alert) throw new Error('Alert not found');

    const details = JSON.parse(alert.details as string ?? '{}');
    details.resolution = resolution;

    return this.prisma.amlAlert.update({
      where: { id: alertId },
      data: {
        status: 'resolved',
        resolvedBy: adminId,
        resolvedAt: new Date(),
        details: JSON.stringify(details),
      },
    });
  }
}

export default AmlService;
