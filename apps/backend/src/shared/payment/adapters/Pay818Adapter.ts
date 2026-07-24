// @ts-nocheck
'use strict';
/**
 * Pay818Adapter — 818PAY gateway (QR code + redirect flow).
 *
 * 818PAY API flow:
 *   POST {endpoint}/create  → returns { order_id, qr_code, redirect_url }
 *   Webhook: POST /api/payment/webhook/818pay
 *   Status:  POST {endpoint}/query  { merchant_id, order_id }
 */
const BasePaymentAdapter = require('../BasePaymentAdapter');
const crypto = require('crypto');

class Pay818Adapter extends BasePaymentAdapter {
  constructor(gateway, prisma) {
    super(gateway, prisma);
    this.merchantId  = this.cfg.merchantId  ?? '';
    this.apiKey      = this.cfg.apiKey      ?? '';
    this.secretKey   = this.cfg.secretKey   ?? '';
    this.endpoint    = this.cfg.endpoint    ?? 'https://api.818pay.com/v2';
  }

  get _axios() {
    if (!this.__axios) this.__axios = require('axios');
    return this.__axios;
  }

  // ── MD5 signature (common in Asian payment gateways) ──────────────────────
  _sign(params) {
    const sorted = Object.keys(params).sort()
      .filter(k => params[k] !== '' && params[k] !== null && k !== 'sign')
      .map(k => `${k}=${params[k]}`)
      .join('&');
    const raw = sorted + `&key=${this.secretKey}`;
    return crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
  }

  // ── createDeposit ──────────────────────────────────────────────────────────
  async createDeposit(order) {
    this.validateAmount(Number(order.amount));

    const callbackUrl = `${process.env.API_BASE_URL ?? 'http://localhost:5000'}/api/payment/webhook/818pay`;
    const payload = {
      merchant_id:  this.merchantId,
      order_id:     order.id,
      amount:       Number(order.amount),
      currency:     order.currency ?? 'VND',
      notify_url:   callbackUrl,
      return_url:   `${process.env.FRONTEND_URL ?? ''}/wallet?status=deposit`,
      timestamp:    Date.now(),
    };
    payload.sign = this._sign(payload);

    const response = await this._axios.post(`${this.endpoint}/create`, payload, {
      headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
    });

    const qrCode  = response.data?.qr_code    ?? response.data?.qr_url;
    const payUrl  = response.data?.redirect_url ?? response.data?.pay_url;
    const orderId = response.data?.order_id    ?? order.id;

    // Generate base64 QR image if raw URL is returned
    let qrDataUrl = null;
    if (qrCode) {
      try {
        const QRCode = require('qrcode');
        qrDataUrl = await QRCode.toDataURL(qrCode, { width: 200, margin: 1 });
      } catch { qrDataUrl = null; }
    }

    return this.formatDepositResponse({
      type:        payUrl  ? 'redirect' : 'qr_code',
      title:       'Thanh toán qua 818PAY',
      fields:      [{ label: 'Mã giao dịch', value: orderId, copyable: true }],
      qrDataUrl,
      redirectUrl: payUrl ?? null,
    });
  }

  // ── verifyPayment (webhook) ────────────────────────────────────────────────
  async verifyPayment(payload, _sig) {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const { sign, ...rest } = data;

    if (sign && this._sign(rest) !== sign) {
      return { success: false, error: 'Invalid 818PAY signature' };
    }

    const statusRaw = (data.status ?? data.pay_status ?? '').toLowerCase();
    const success   = ['success', 'paid', 'completed', '1', 'ok'].includes(statusRaw);

    return {
      success,
      amount:  Number(data.amount ?? 0),
      txId:    data.tx_id   ?? data.transaction_id ?? null,
      orderId: data.order_id ?? null,
    };
  }

  // ── processWithdraw ────────────────────────────────────────────────────────
  async processWithdraw(request) {
    this.validateAmount(Number(request.amount));

    const payload = {
      merchant_id: this.merchantId,
      order_id:    request.id,
      amount:      Number(request.amount),
      currency:    request.currency ?? 'VND',
      to_account:  request.address ?? '',
      bank_info:   JSON.stringify(request.bankInfo ?? {}),
      timestamp:   Date.now(),
    };
    payload.sign = this._sign(payload);

    const response = await this._axios.post(`${this.endpoint}/withdraw`, payload, {
      headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
    });

    return {
      success: response.data?.success ?? true,
      txId:    response.data?.tx_id ?? null,
    };
  }

  // ── checkStatus ────────────────────────────────────────────────────────────
  async checkStatus(transactionId) {
    try {
      const payload = { merchant_id: this.merchantId, order_id: transactionId };
      payload.sign = this._sign(payload);
      const res = await this._axios.post(`${this.endpoint}/query`, payload, {
        headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
      });
      return { status: res.data.status ?? 'unknown', txId: transactionId };
    } catch {
      return { status: 'unknown', txId: transactionId };
    }
  }
}

module.exports = Pay818Adapter;
