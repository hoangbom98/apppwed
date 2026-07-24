'use strict';
/**
 * OKPayAdapter — Third-party e-wallet gateway (redirect flow).
 *
 * Uses OKPay REST API:
 *   POST {endpoint}/deposit → returns { paymentUrl }
 *   POST {endpoint}/withdraw → submits withdrawal
 *   Webhook: POST /api/payment/webhook/okpay
 */
const BasePaymentAdapter = require('../BasePaymentAdapter');

class OKPayAdapter extends BasePaymentAdapter {
  constructor(gateway, prisma) {
    super(gateway, prisma);
    this.apiKey   = this.cfg.apiKey   ?? '';
    this.endpoint = this.cfg.endpoint ?? 'https://api.okpay.com/v1';
    this.secret   = this.cfg.secret   ?? '';
  }

  get _axios() {
    // Lazy-load axios to avoid top-level cost if adapter is never used
    if (!this.__axios) this.__axios = require('axios');
    return this.__axios;
  }

  _headers() {
    return { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' };
  }

  // ── createDeposit ─────────────────────────────────────────────────────────
  async createDeposit(order) {
    this.validateAmount(Number(order.amount));

    const callbackUrl = `${process.env.API_BASE_URL ?? 'http://localhost:5000'}/api/payment/webhook/okpay`;

    const response = await this._axios.post(
      `${this.endpoint}/deposit`,
      {
        amount:    Number(order.amount),
        currency:  order.currency ?? 'VND',
        orderId:   order.id,
        callbackUrl,
        returnUrl: `${process.env.FRONTEND_URL ?? ''}/wallet?status=deposit`,
      },
      { headers: this._headers() }
    );

    const paymentUrl = response.data?.paymentUrl ?? response.data?.pay_url;
    if (!paymentUrl) throw new Error('OKPay did not return a payment URL');

    return this.formatDepositResponse({
      type:        'redirect',
      title:       'Thanh toán qua OKPay',
      fields:      [],
      redirectUrl: paymentUrl,
    });
  }

  // ── verifyPayment (webhook) ───────────────────────────────────────────────
  async verifyPayment(payload, sig) {
    // Verify HMAC signature if secret is configured
    if (this.secret && sig) {
      const crypto = require('crypto');
      const body   = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expected = crypto.createHmac('sha256', this.secret).update(body).digest('hex');
      if (expected !== sig) {
        return { success: false, error: 'Invalid signature' };
      }
    }

    const { orderId, amount, status, txId } = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const success = status === 'completed' || status === 'success' || status === 'paid';

    return { success, amount: Number(amount), txId: txId ?? null, orderId: orderId ?? null };
  }

  // ── processWithdraw ───────────────────────────────────────────────────────
  async processWithdraw(request) {
    this.validateAmount(Number(request.amount));

    const response = await this._axios.post(
      `${this.endpoint}/withdraw`,
      {
        amount:    Number(request.amount),
        currency:  request.currency ?? 'VND',
        orderId:   request.id,
        address:   request.address,
        bankInfo:  request.bankInfo ?? null,
      },
      { headers: this._headers() }
    );

    return {
      success: response.data?.success ?? true,
      txId:    response.data?.txId ?? null,
    };
  }

  // ── checkStatus ───────────────────────────────────────────────────────────
  async checkStatus(transactionId) {
    try {
      const res = await this._axios.get(
        `${this.endpoint}/status/${transactionId}`,
        { headers: this._headers() }
      );
      return { status: res.data.status ?? 'unknown', txId: transactionId };
    } catch {
      return { status: 'unknown', txId: transactionId };
    }
  }
}

module.exports = OKPayAdapter;
