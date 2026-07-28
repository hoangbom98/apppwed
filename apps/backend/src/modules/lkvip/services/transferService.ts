/**
 * transferService.ts
 * Handles withdrawal lifecycle: create → approve / reject with atomic balance management.
 */

// decimal.js installed lazily — fallback to Number if missing
let Decimal: new (v: number | string) => { lt: (n: unknown) => boolean; add: (n: unknown) => { toNumber: () => number }; negated: () => unknown; toNumber: () => number };
try { Decimal = require('decimal.js'); } catch { Decimal = Number as any; }

interface BankInfo {
  accountNumber: string;
  bankName:      string;
  bankBin?:      string;
  accountHolder: string;
}

class TransferService {
  private prisma: any;

  constructor(prisma: any) {
    this.prisma = prisma;
  }

  /** Create withdrawal request and freeze user balance atomically. */
  async createWithdrawal(
    userId:       string,
    amount:       number,
    bankInfo:     BankInfo,
    _description: string = 'Rút tiền',
  ): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { balance: true },
    });

    if (!user || new Decimal(user.balance).lt(amount)) {
      throw new Error('Insufficient balance or user not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.withdrawalRequest.create({
        data: {
          userId,
          amount,
          bankAccountNumber: bankInfo.accountNumber,
          bankName:          bankInfo.bankName,
          bankBin:           bankInfo.bankBin,
          accountHolder:     bankInfo.accountHolder,
          status:            'pending',
        },
      });
      await tx.user.update({
        where: { id: userId },
        data:  { balance: { decrement: amount }, frozen: { increment: amount } },
      });
      return created;
    });
  }

  /** Admin approves withdrawal — unfreeze and record transaction. */
  async approveWithdrawal(withdrawalId: string, _adminId: string): Promise<unknown> {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where:   { id: withdrawalId, status: 'pending' },
      include: { user: true },
    });

    if (!withdrawal) {
      throw new Error('Withdrawal request not found or already processed');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data:  {
          status:      'completed',
          processedAt: new Date(),
          transferId:  `TRF_${Date.now()}`,
        },
      });

      const user = await tx.user.update({
        where: { id: withdrawal.userId },
        data:  { frozen: { decrement: withdrawal.amount } },
      });

      const transaction = await tx.lkvipTransaction.create({
        data: {
          userId:        withdrawal.userId,
          type:          'withdraw',
          amount:        new Decimal(withdrawal.amount).negated(),
          balanceBefore: new Decimal(user.balance).add(withdrawal.amount),
          balanceAfter:  new Decimal(user.balance),
          referenceType: 'withdrawal',
          referenceId:   withdrawal.id,
          description:   `Rút tiền về ${withdrawal.bankName} ${withdrawal.bankAccountNumber}`,
          status:        'completed',
        },
      });

      return { withdrawal: updated, transaction, user };
    });
  }

  /** Admin rejects withdrawal — refund balance from frozen. */
  async rejectWithdrawal(withdrawalId: string, reason: string): Promise<unknown> {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId, status: 'pending' },
    });

    if (!withdrawal) {
      throw new Error('Withdrawal request not found or already processed');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data:  {
          status:          'rejected',
          rejectionReason: reason,
          processedAt:     new Date(),
        },
      });

      await tx.user.update({
        where: { id: withdrawal.userId },
        data:  { balance: { increment: withdrawal.amount }, frozen: { decrement: withdrawal.amount } },
      });

      return updated;
    });
  }
}

export default TransferService;
