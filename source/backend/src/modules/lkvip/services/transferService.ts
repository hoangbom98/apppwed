// @ts-nocheck
/* eslint-disable */

import { PrismaClient } from '@prisma/client';
// decimal.js installed lazily — fallback to native if missing
let Decimal: any;
try { Decimal = require('decimal.js'); } catch { Decimal = Number; }

interface BankInfo {
  accountNumber: string;
  bankName: string;
  bankBin?: string;
  accountHolder: string;
}

class TransferService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create withdrawal request (freeze user balance)
  async createWithdrawal(userId: string, amount: Decimal, bankInfo: BankInfo, _description: string = 'Rút tiền') {
    // Check user balance
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user || new Decimal(user.balance).lt(amount)) {
      throw new Error('Insufficient balance or user not found');
    }

    // Atomic: create withdrawal AND freeze balance in a single transaction
    const withdrawal = await this.prisma.$transaction(async (tx) => {
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
        data:  { 
            balance: { decrement: amount }, 
            frozen: { increment: amount } 
        },
      });
      return created;
    });

    return withdrawal;
  }

  // Admin approves withdrawal
  async approveWithdrawal(withdrawalId: string, _adminId: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId, status: 'pending' },
      include: { user: true },
    });

    if (!withdrawal) {
      throw new Error('Withdrawal request not found or already processed');
    }

    // Process in transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Update withdrawal
      const updated = await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: 'completed',
          processedAt: new Date(),
          transferId: `TRF_${Date.now()}`,
        },
      });

      // 2. Unfreeze balance (it was already deducted in createWithdrawal)
      const user = await prisma.user.update({
        where: { id: withdrawal.userId },
        data: {
          frozen: { decrement: withdrawal.amount },
        },
      });

      // 3. Create transaction
      const transaction = await prisma.lkvipTransaction.create({
        data: {
          userId: withdrawal.userId,
          type: 'withdraw',
          amount: withdrawal.amount.negated(),
          balanceBefore: new Decimal(user.balance).add(withdrawal.amount),
          balanceAfter: new Decimal(user.balance),
          referenceType: 'withdrawal',
          referenceId: withdrawal.id,
          description: `Rút tiền về ${withdrawal.bankName} ${withdrawal.bankAccountNumber}`,
          status: 'completed',
        },
      });

      return { withdrawal: updated, transaction, user };
    });

    return result;
  }

  // Reject withdrawal
  async rejectWithdrawal(withdrawalId: string, reason: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId, status: 'pending' },
    });

    if (!withdrawal) {
      throw new Error('Withdrawal request not found or already processed');
    }

    // Process in transaction: refund balance
    const result = await this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: 'rejected',
          rejectionReason: reason,
          processedAt: new Date(),
        },
      });

      // Refund: increase balance, decrease frozen
      await prisma.user.update({
        where: { id: withdrawal.userId },
        data: {
          balance: { increment: withdrawal.amount },
          frozen: { decrement: withdrawal.amount },
        },
      });

      return updated;
    });

    return result;
  }
}

export default TransferService;
