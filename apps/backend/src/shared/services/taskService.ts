// @ts-nocheck
/**
 * taskService.ts — Engine 8: Task & Check-in Engine
 *
 * Manages missions, daily check-in streaks, and task rewards.
 * Task conditions are stored as JSON in ProjectConfig — fully admin-configurable.
 *
 * Task Types:
 *  - DAILY   — resets every midnight (check-in, daily bet)
 *  - WEEKLY  — resets every Monday
 *  - MONTHLY — resets on 1st of month
 *  - ONCE    — completed permanently (first deposit, profile complete)
 *
 * Reward Types:
 *  - money   — credit to user wallet via LedgerService
 *  - points  — credit loyalty points via LoyaltyService
 *  - vip     — grant VIP experience
 *
 * USAGE
 * ─────
 *   const taskSvc = new TaskService(prisma, 'game', adminPrisma);
 *
 *   // On user login — auto check-in
 *   await taskSvc.checkIn(userId);
 *
 *   // On deposit — trigger deposit task progress
 *   await taskSvc.trackEvent(userId, 'deposit', { amount: 100000 });
 *
 *   // List available tasks for a user
 *   const tasks = await taskSvc.getUserTasks(userId);
 *
 * Required Prisma models on project DB:
 *   Task, TaskLog (see admin schema additions below)
 */

'use strict';

const logger = require('./logger');
const cache  = require('./cacheService');

// Check-in streak rewards: day → bonus amount (VND)
const DEFAULT_CHECKIN_REWARDS = [
  { day: 1,  reward: 5_000,   type: 'money'  },
  { day: 2,  reward: 10_000,  type: 'money'  },
  { day: 3,  reward: 15_000,  type: 'money'  },
  { day: 4,  reward: 20_000,  type: 'money'  },
  { day: 5,  reward: 25_000,  type: 'money'  },
  { day: 6,  reward: 30_000,  type: 'money'  },
  { day: 7,  reward: 100_000, type: 'money'  }, // weekly bonus
];

class TaskService {
  private prisma:      any;
  private project:     string;
  private adminPrisma: any;

  constructor(prisma: any, project: string, adminPrisma: any = null) {
    this.prisma      = prisma;
    this.project     = project;
    this.adminPrisma = adminPrisma || prisma;
  }

  // ── DAILY CHECK-IN ────────────────────────────────────────────────────────

  /**
   * Process daily check-in for a user.
   * Returns { alreadyCheckedIn, streak, reward, rewardType }
   */
  async checkIn(userId: string): Promise<{
    alreadyCheckedIn: boolean;
    streak:    number;
    reward:    number;
    rewardType: string;
  }> {
    const todayKey = `checkin:${this.project}:${userId}:${new Date().toISOString().slice(0, 10)}`;

    // Idempotency check via Redis
    const alreadyDone = await cache.get(todayKey);
    if (alreadyDone) {
      return { alreadyCheckedIn: true, streak: alreadyDone.streak, reward: 0, rewardType: 'none' };
    }

    return this.prisma.$transaction(async (tx: any) => {
      // Get user's check-in streak
      const user = await tx.user.findUnique({
        where:  { id: userId },
        select: { lastDailyClaimAt: true },
      });

      const now      = new Date();
      const lastDate = user?.lastDailyClaimAt ? new Date(user.lastDailyClaimAt) : null;
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get current streak from cache or compute
      let streak = 1;
      const streakKey = `streak:${this.project}:${userId}`;
      const cachedStreak = await cache.get(streakKey);
      if (cachedStreak && lastDate && lastDate.toDateString() === yesterday.toDateString()) {
        streak = (cachedStreak as number) + 1;
      }
      if (streak > 7) streak = 1; // reset after weekly cycle

      // Determine reward
      const rewardConfig = DEFAULT_CHECKIN_REWARDS[(streak - 1) % 7];
      const reward     = rewardConfig.reward;
      const rewardType = rewardConfig.type;

      // Credit reward if money type
      if (rewardType === 'money' && reward > 0) {
        await tx.user.update({
          where: { id: userId },
          data:  { balance: { increment: reward }, lastDailyClaimAt: now },
        });
        await tx.transaction.create({
          data: {
            userId,
            type:        'checkin',
            amount:      reward,
            balanceAfter: 0,
            status:      'completed',
            note:        `Điểm danh ngày ${streak} — nhận ${reward.toLocaleString('vi-VN')}đ`,
          },
        });
      } else {
        await tx.user.update({ where: { id: userId }, data: { lastDailyClaimAt: now } });
      }

      // Cache results (expire at midnight)
      const secondsToMidnight = 86400 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
      await cache.set(todayKey, { streak }, secondsToMidnight);
      await cache.set(streakKey, streak, 8 * 24 * 3600); // 8 days

      return { alreadyCheckedIn: false, streak, reward, rewardType };
    });
  }

  // ── TASK TRACKING ─────────────────────────────────────────────────────────

  /**
   * Track a user action and auto-complete matching tasks.
   *
   * @param userId   user performing the action
   * @param event    action type: 'deposit' | 'bet' | 'login' | 'profile' | 'referral' | etc.
   * @param context  additional data (e.g. { amount: 100000 })
   */
  async trackEvent(userId: string, event: string, context: Record<string, any> = {}): Promise<void> {
    // Skip if task model doesn't exist on this project
    if (!this.prisma.task) return;

    try {
      // Get active tasks matching this event
      const tasks = await this.prisma.task.findMany({
        where: { isActive: true, eventType: event },
      });
      if (!tasks.length) return;

      for (const task of tasks) {
        const condition = task.condition as any;

        // Check if condition is met (e.g. amount >= minAmount)
        let conditionMet = true;
        if (condition?.minAmount && context.amount) {
          conditionMet = Number(context.amount) >= Number(condition.minAmount);
        }
        if (!conditionMet) continue;

        // Check if already completed (for ONCE tasks)
        if (task.taskType === 'ONCE') {
          const existing = await this.prisma.taskLog.findFirst({
            where: { userId, taskId: task.id, isCompleted: true },
          });
          if (existing) continue;
        }

        // Get or create TaskLog
        const period = this._getPeriodKey(task.taskType);
        let taskLog = await this.prisma.taskLog.findFirst({
          where: { userId, taskId: task.id, period },
        });

        if (!taskLog) {
          taskLog = await this.prisma.taskLog.create({
            data: { userId, taskId: task.id, period, progress: 0, isCompleted: false },
          });
        }
        if (taskLog.isCompleted) continue;

        // Update progress
        const newProgress = Math.min(taskLog.progress + (context.amount ?? 1), task.targetAmount ?? 1);
        const completed   = newProgress >= (task.targetAmount ?? 1);

        await this.prisma.taskLog.update({
          where: { id: taskLog.id },
          data:  { progress: newProgress, isCompleted: completed, completedAt: completed ? new Date() : null },
        });

        // Grant reward on completion
        if (completed && task.rewardAmount > 0) {
          await this._grantTaskReward(userId, task);
        }
      }
    } catch (err: any) {
      logger.warn(`[Task] trackEvent failed userId=${userId} event=${event}: ${err.message}`);
    }
  }

  /**
   * Get all tasks for a user with their current progress.
   */
  async getUserTasks(userId: string, taskType?: string) {
    if (!this.prisma.task) return [];

    const where: any = { isActive: true };
    if (taskType) where.taskType = taskType;

    const tasks    = await this.prisma.task.findMany({ where });
    const period   = taskType ? this._getPeriodKey(taskType) : undefined;
    const logWhere: any = { userId };
    if (period) logWhere.period = period;

    const logs = await this.prisma.taskLog.findMany({ where: logWhere });
    const logMap = Object.fromEntries(logs.map((l: any) => [l.taskId, l]));

    return tasks.map((task: any) => ({
      ...task,
      rewardAmount: Number(task.rewardAmount),
      targetAmount: Number(task.targetAmount ?? 1),
      log: logMap[task.id] ?? null,
      progress: logMap[task.id]?.progress ?? 0,
      isCompleted: logMap[task.id]?.isCompleted ?? false,
    }));
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _getPeriodKey(taskType: string): string {
    const now = new Date();
    if (taskType === 'DAILY')   return now.toISOString().slice(0, 10);          // 2025-01-15
    if (taskType === 'WEEKLY')  return `${now.getFullYear()}-W${this._weekNum(now)}`;
    if (taskType === 'MONTHLY') return now.toISOString().slice(0, 7);           // 2025-01
    return 'once';
  }

  private _weekNum(d: Date): number {
    const oneJan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  }

  private async _grantTaskReward(userId: string, task: any): Promise<void> {
    const reward = Number(task.rewardAmount);
    if (task.rewardType === 'money') {
      await this.prisma.user.update({
        where: { id: userId },
        data:  { balance: { increment: reward } },
      });
      await this.prisma.transaction.create({
        data: {
          userId, type: 'reward', amount: reward,
          balanceAfter: 0, status: 'completed',
          note: `Hoàn thành nhiệm vụ: ${task.name}`,
        },
      });
      logger.info(`[Task] Reward granted userId=${userId} task="${task.name}" amount=${reward}`);
    }
  }
}

module.exports = TaskService;
