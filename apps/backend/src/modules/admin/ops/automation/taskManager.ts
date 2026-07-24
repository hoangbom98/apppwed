// @ts-nocheck
'use strict';
/**
 * TaskManager — auto-assign and balance tasks across employees (admin users).
 *
 * Task priorities:
 *   critical → withdraw > 10M VND
 *   high     → urgent support
 *   medium   → marketing
 *   low      → everything else
 */
const logger = require('../../../../shared/services/logger');
const notificationService = require('../../../../shared/services/notificationService');

const SKILL_MAP = {
  withdraw:  ['finance', 'support'],
  deposit:   ['finance'],
  kyc:       ['finance', 'kyc'],
  support:   ['support'],
  bug:       ['tech'],
  campaign:  ['marketing'],
  churn:     ['support', 'marketing'],
  report:    ['manager', 'finance'],
};

const MAX_ACTIVE_TASKS = 5;

class TaskManager {
  constructor(adminPrisma) {
    this.admin = adminPrisma;
  }

  // ── Auto-assign a task ────────────────────────────────────────────────────
  async autoAssign({ type, title, description, userId, metadata = {} }) {
    const requiredRoles = SKILL_MAP[type] || ['support'];
    const priority      = this._calcPriority(type, metadata);

    // Find available staff (admin users with matching roles, not overloaded)
    let staff = [];
    try {
      staff = await this.admin.adminUser.findMany({
        where:  { status: 'active', role: { in: requiredRoles } },
        select: { id: true, role: true, username: true, email: true },
      });
    } catch {
      // Fallback: any active admin
      staff = await this.admin.adminUser.findMany({
        where:  { status: 'active' },
        select: { id: true, role: true, username: true, email: true },
      }).catch(() => []);
    }

    if (!staff.length) {
      logger.warn(`[TaskMgr] No available staff for task type=${type}`);
      return null;
    }

    // Get active task counts
    const taskCounts = await this.admin.opsTask.groupBy({
      by:    ['assignedTo'],
      where: { status: { in: ['pending', 'in_progress'] } },
      _count: { id: true },
    }).catch(() => []);

    const loadMap = Object.fromEntries(taskCounts.map(r => [r.assignedTo, r._count.id]));

    // Pick least-loaded
    const best = staff.reduce((a, b) => {
      const la = loadMap[a.id] || 0;
      const lb = loadMap[b.id] || 0;
      return la <= lb ? a : b;
    });

    // Create task
    const task = await this.admin.opsTask.create({
      data: {
        type,
        title,
        description: description || '',
        userId:      userId ? parseInt(userId, 10) : null,
        assignedTo:  best.id,
        priority,
        status:      'pending',
        metadata:    JSON.stringify(metadata),
      },
    }).catch(() => null);

    if (task) {
      notificationService.sendToUser(best.id, 'ops:new_task', {
        taskId:   task.id,
        title,
        priority,
      });
      logger.info(`[TaskMgr] Task #${task.id} assigned to ${best.username}`);
    }

    return task;
  }

  // ── Rebalance: redistribute overloaded staff tasks ─────────────────────
  async rebalance() {
    const staff = await this.admin.adminUser.findMany({
      where:  { status: 'active' },
      select: { id: true },
    }).catch(() => []);

    const taskCounts = await this.admin.opsTask.groupBy({
      by:    ['assignedTo'],
      where: { status: 'pending' },
      _count: { id: true },
    }).catch(() => []);

    const loadMap = Object.fromEntries(taskCounts.map(r => [r.assignedTo, r._count.id]));
    let reassigned = 0;

    for (const emp of staff) {
      const load = loadMap[emp.id] || 0;
      if (load > MAX_ACTIVE_TASKS) {
        const excess = await this.admin.opsTask.findMany({
          where:   { assignedTo: emp.id, status: 'pending' },
          orderBy: { createdAt: 'asc' },
          take:    load - MAX_ACTIVE_TASKS,
          select:  { id: true },
        }).catch(() => []);

        const others = staff.filter(s => s.id !== emp.id && (loadMap[s.id] || 0) < MAX_ACTIVE_TASKS);
        if (!others.length) continue;

        for (const task of excess) {
          const target = others[reassigned % others.length];
          await this.admin.opsTask.update({
            where: { id: task.id },
            data:  { assignedTo: target.id },
          }).catch(() => {});
          reassigned++;
        }
      }
    }

    logger.info(`[TaskMgr] rebalance: ${reassigned} tasks moved`);
    return reassigned;
  }

  // ── Complete a task ───────────────────────────────────────────────────────
  async complete(taskId, agentId) {
    return this.admin.opsTask.update({
      where: { id: parseInt(taskId, 10) },
      data:  {
        status:      'completed',
        completedAt: new Date(),
        completedBy: parseInt(agentId, 10),
      },
    }).catch(() => null);
  }

  // ── List tasks with filters ───────────────────────────────────────────────
  async list({ status, assignedTo, type, page = 1, limit = 20 } = {}) {
    const where = {};
    if (status)     where.status     = status;
    if (assignedTo) where.assignedTo = parseInt(assignedTo, 10);
    if (type)       where.type       = type;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [tasks, total] = await Promise.all([
      this.admin.opsTask.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.admin.opsTask.count({ where }),
    ]).catch(() => [[], 0]);

    return { tasks, total, page: Number(page), pages: Math.ceil(total / take) };
  }

  // ── Priority calculation ─────────────────────────────────────────────────
  _calcPriority(type, meta) {
    if (type === 'withdraw' && Number(meta.amount) > 10000000) return 'critical';
    if (type === 'support'  && meta.urgency === 'high')        return 'high';
    if (type === 'campaign' || type === 'churn')               return 'medium';
    return 'low';
  }
}

module.exports = TaskManager;
