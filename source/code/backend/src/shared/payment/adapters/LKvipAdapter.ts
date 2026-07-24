'use strict';
/**
 * LKvipAdapter — Bank-transfer style deposit via Virtual Account (VA).
 *
 * Uses the existing VirtualAccountService from the lkvip module so no
 * business logic is duplicated.  The lkvip module still owns the VA table;
 * this adapter is just a thin orchestrator.
 */
const BasePaymentAdapter = require('../BasePaymentAdapter');

class LKvipAdapter extends BasePaymentAdapter {
  constructor(gateway, prisma) {
    super(gateway, prisma);
    // Lazy-load to avoid circular dependency issues at module init time
    this._vaServicePath = '../../../modules/lkvip/services/virtualAccountService';
  }

  get vaService() {
    if (!this._vaService) {
      const VirtualAccountService = require(this._vaServicePath);
      this._vaService = new VirtualAccountService(this.prisma);
    }
    return this._vaService;
  }

  // ── createDeposit ─────────────────────────────────────────────────────────
  async createDeposit(order) {
    this.validateAmount(Number(order.amount));

    // Reuse existing VA service to generate a unique virtual account number
    const va = await this.vaService.createVirtualAccount(order.userId, order.amount);

    return this.formatDepositResponse({
      type:  'bank_transfer',
      title: 'Chuyển khoản ngân hàng nội địa',
      fields: [
        { label: 'Ngân hàng',         value: this.cfg.bankName    ?? 'Sacombank', copyable: false },
        { label: 'Số tài khoản',      value: va.vaNumber,                         copyable: true  },
        { label: 'Chủ tài khoản',     value: this.cfg.accountName ?? 'Công ty',   copyable: false },
        { label: 'Số tiền (VND)',      value: Number(order.amount).toLocaleString('vi-VN'), copyable: false },
        { label: 'Nội dung chuyển khoản', value: `NAP ${order.id}`, copyable: true },
      ],
      expiresAt: va.expiredAt?.toISOString?.() ?? null,
    });
  }

  // ── verifyPayment (webhook) ───────────────────────────────────────────────
  async verifyPayment(payload, _sig) {
    const { vaNumber, amount, transactionRef, bankCode } = payload;
    if (!vaNumber || !amount) {
      return { success: false, error: 'Missing vaNumber or amount in payload' };
    }
    const result = await this.vaService.confirmDeposit(vaNumber, amount, transactionRef, bankCode);
    return {
      success:  result.success,
      amount:   Number(amount),
      txId:     transactionRef,
      orderId:  result.orderId ?? null,
    };
  }

  // ── processWithdraw ───────────────────────────────────────────────────────
  async processWithdraw(request) {
    this.validateAmount(Number(request.amount));
    const transferService = require('../../../modules/lkvip/services/transferService');
    return transferService.approveWithdrawal(request.id, request.processedBy ?? null);
  }

  // ── checkStatus ───────────────────────────────────────────────────────────
  async checkStatus(transactionId) {
    const va = await this.prisma.virtualAccount.findFirst({
      where: { OR: [{ id: transactionId }, { vaNumber: transactionId }] },
    });
    if (!va) return { status: 'not_found' };
    return { status: va.status, amount: Number(va.expectedAmount), txId: va.txRef ?? null };
  }
}

module.exports = LKvipAdapter;
