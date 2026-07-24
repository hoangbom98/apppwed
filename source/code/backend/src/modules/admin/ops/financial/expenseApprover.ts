// @ts-nocheck
'use strict';
/**
 * ExpenseApprover — tiered auto-approval logic for expense requests.
 *
 * Approval tiers (amount in VND):
 *   ≤ 100k    → auto-approve
 *   ≤ 1M      → needs manager
 *   ≤ 5M      → needs finance + manager
 *   > 5M      → needs CEO / board
 */
const logger = require('../../../../shared/services/logger');

const TIERS = [
  { maxAmount: 100000,    autoApprove: true,  approvers: ['manager'],            requireNote: false },
  { maxAmount: 1000000,   autoApprove: false, approvers: ['manager'],            requireNote: false },
  { maxAmount: 5000000,   autoApprove: false, approvers: ['finance', 'manager'], requireNote: true  },
  { maxAmount: Infinity,  autoApprove: false, approvers: ['superadmin'],         requireNote: true  },
];

class ExpenseApprover {
  constructor(adminPrisma) {
    this.admin = adminPrisma;
  }

  // ── Evaluate an expense request ───────────────────────────────────────────
  async evaluate({ id, amount, category, note, _requestedBy }) {
    const tier = TIERS.find(t => Number(amount) <= t.maxAmount);

    if (!tier) {
      return { approved: false, reason: 'no_matching_tier' };
    }

    // Justification required but missing
    if (tier.requireNote && !note) {
      return { approved: false, reason: 'note_required', approvers: tier.approvers };
    }

    if (tier.autoApprove) {
      await this._approve(id, null, 'auto');
      logger.info(`[Expense] Auto-approved #${id} amount=${amount}`);
      return { approved: true, reason: 'auto_approved' };
    }

    // Create approval task for the relevant approver role
    await this._createApprovalTask({ expenseId: id, approvers: tier.approvers, amount, category });
    return { approved: false, reason: 'pending_approval', approvers: tier.approvers };
  }

  // ── Mark approved ─────────────────────────────────────────────────────────
  async _approve(expenseId, approverId, method = 'manual') {
    try {
      await this.admin.opsExpenseRequest.update({
        where: { id: parseInt(expenseId, 10) },
        data:  { status: 'approved', approvedBy: approverId, approvedAt: new Date(), approvalMethod: method },
      });
    } catch (err) {
      logger.warn(`[Expense] _approve failed: ${err.message}`);
    }
  }

  // ── Create approval workflow task ─────────────────────────────────────────
  async _createApprovalTask({ expenseId, approvers, amount, category }) {
    try {
      // Find first available approver
      const admin = await this.admin.adminUser.findFirst({
        where: { role: { in: approvers }, status: 'active' },
      });

      await this.admin.opsTask.create({
        data: {
          type:        'expense_approval',
          title:       `Duyệt chi tiêu #${expenseId} — ${Number(amount).toLocaleString('vi-VN')}đ`,
          description: `Danh mục: ${category}. Cần phê duyệt.`,
          assignedTo:  admin?.id || null,
          priority:    Number(amount) > 5000000 ? 'high' : 'medium',
          status:      'pending',
          metadata:    JSON.stringify({ expenseId, amount, category }),
        },
      });
    } catch (err) {
      logger.warn(`[Expense] createApprovalTask failed: ${err.message}`);
    }
  }

  // ── List expense requests ─────────────────────────────────────────────────
  async list({ status, page = 1, limit = 20 } = {}) {
    const where = {};
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [rows, total] = await Promise.all([
      this.admin.opsExpenseRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
      this.admin.opsExpenseRequest.count({ where }),
    ]).catch(() => [[], 0]);

    return { rows, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
  }
}

module.exports = ExpenseApprover;
