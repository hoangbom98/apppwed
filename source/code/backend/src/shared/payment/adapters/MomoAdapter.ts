'use strict';
/**
 * MomoAdapter — MoMo e-wallet payment gateway (redirect / deep-link flow).
 *
 * Wraps the existing paymentService.createMomoPayment() so all MoMo-specific
 * signing/request logic stays in one place.
 */
const BasePaymentAdapter = require('../BasePaymentAdapter');

class MomoAdapter extends BasePaymentAdapter {
  constructor(gateway, prisma) {
    super(gateway, prisma);
    this.partnerCode = this.cfg.partnerCode ?? process.env.MOMO_PARTNER_CODE ?? '';
    this.accessKey   = this.cfg.accessKey   ?? process.env.MOMO_ACCESS_KEY   ?? '';
    this.secretKey   = this.cfg.secretKey   ?? process.env.MOMO_SECRET_KEY   ?? '';
    this.endpoint    = this.cfg.endpoint    ?? process.env.MOMO_ENDPOINT     ?? 'https://payment.momo.vn/v2/gateway/api/create';
  }

  // ── createDeposit ─────────────────────────────────────────────────────────
  async createDeposit(order) {
    this.validateAmount(Number(order.amount));

    // Delegate to paymentService (existing MoMo integration)
    const paymentService = require('../../services/paymentService');
    const result = await paymentService.createMomoPayment(
      order.id,
      Math.round(Number(order.amount)),
      `Nạp tiền đơn #${order.id}`
    );

    return this.formatDepositResponse({
      type:        'redirect',
      title:       'Thanh toán qua MoMo',
      fields:      [],
      redirectUrl: result.payUrl ?? result.pay_url ?? null,
      qrDataUrl:   result.qrCodeUrl ?? null,
      expiresAt:   new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  }

  // ── verifyPayment (webhook) ───────────────────────────────────────────────
  async verifyPayment(payload, _sig) {
    // MoMo sends: { orderId, amount, resultCode, transId, message }
    const { orderId, amount, resultCode, transId } = payload;
    const success = resultCode === 0 || resultCode === '0';

    return {
      success,
      amount:  Number(amount),
      txId:    String(transId ?? ''),
      orderId: orderId ?? null,
    };
  }

  // ── processWithdraw ───────────────────────────────────────────────────────
  async processWithdraw(_request) {
    // MoMo disburse API (requires separate merchant agreement)
    return {
      success: false,
      error:   'Withdraw qua MoMo chưa được kích hoạt. Liên hệ admin.',
    };
  }

  // ── checkStatus ───────────────────────────────────────────────────────────
  async checkStatus(transactionId) {
    return { status: 'unknown', txId: transactionId, note: 'MoMo status check via IPN only' };
  }
}

module.exports = MomoAdapter;
