import { BasePaymentAdapter } from '../BasePaymentAdapter';
import { DepositOrder, PaymentInstructions, VerifyResult, WithdrawResult, StatusResult } from '../types';
import axios from 'axios';
import crypto from 'crypto';

export class GoPayAdapter extends BasePaymentAdapter {
  private appId: string;
  private secretKey: string;
  private endpoint: string;
  private merchantId: string;

  constructor(gateway: any, prisma: any) {
    super(gateway, prisma);
    this.appId       = this.cfg.appId       ?? '';
    this.secretKey   = this.cfg.secretKey   ?? '';
    this.endpoint    = this.cfg.endpoint    ?? 'https://api.gopay.vn/v1';
    this.merchantId  = this.cfg.merchantId  ?? '';
  }

  // ── HMAC-SHA256 signature ───────────────────────────────────────────────────
  private _sign(params: Record<string, any>): string {
    const sorted = Object.keys(params).sort()
      .filter(k => k !== 'sign')
      .map(k => `${k}=${params[k]}`)
      .join('&');
    return crypto.createHmac('sha256', this.secretKey).update(sorted).digest('hex');
  }

  private _verify(params: Record<string, any>, sign: string): boolean {
    return this._sign(params) === sign;
  }

  // ── createDeposit ──────────────────────────────────────────────────────────
  async createDeposit(order: DepositOrder): Promise<PaymentInstructions> {
    this.validateAmount(Number(order.amount));

    const callbackUrl = `${process.env.API_BASE_URL ?? 'http://localhost:5000'}/api/payment/webhook/gopay`;
    const payload: Record<string, any> = {
      app_id:       this.appId,
      merchant_id:  this.merchantId,
      out_trade_no: order.id,
      total_amount: Number(order.amount),
      currency:     order.currency ?? 'VND',
      notify_url:   callbackUrl,
      return_url:   `${process.env.FRONTEND_URL ?? ''}/wallet?status=deposit`,
      timestamp:    Math.floor(Date.now() / 1000),
    };
    payload.sign = this._sign(payload);

    const response = await axios.post(`${this.endpoint}/pay`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const payUrl = response.data?.pay_url ?? response.data?.payUrl;
    if (!payUrl) throw new Error('GoPay did not return a payment URL');

    return this.formatDepositResponse({
      type:        'redirect',
      title:       'Thanh toán qua GoPay',
      fields:      [{ label: 'Mã đơn hàng', value: order.id, copyable: true }],
      redirectUrl: payUrl,
    });
  }

  // ── verifyPayment (webhook) ────────────────────────────────────────────────
  async verifyPayment(payload: any, _sig?: string): Promise<VerifyResult> {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const { sign, ...rest } = data;

    if (sign && !this._verify(rest, sign)) {
      return { success: false, amount: 0, txId: '', orderId: null };
    }

    const success = ['paid', 'success', 'completed', 'trade_success'].includes(
      (data.trade_status ?? data.status ?? '').toLowerCase()
    );

    return {
      success,
      amount:  Number(data.total_amount ?? data.amount ?? 0),
      txId:    data.trade_no   ?? null,
      orderId: data.out_trade_no ?? null,
    };
  }

  // ── processWithdraw ────────────────────────────────────────────────────────
  async processWithdraw(request: any): Promise<WithdrawResult> {
    this.validateAmount(Number(request.amount));

    const payload: Record<string, any> = {
      app_id:      this.appId,
      merchant_id: this.merchantId,
      order_id:    request.id,
      amount:      Number(request.amount),
      currency:    request.currency ?? 'VND',
      to_account:  request.address ?? request.bankInfo?.accountNumber ?? '',
      timestamp:   Math.floor(Date.now() / 1000),
    };
    payload.sign = this._sign(payload);

    const response = await axios.post(`${this.endpoint}/payout`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    return {
      success: response.data?.success ?? true,
      error: response.data?.success ? undefined : 'Payout failed'
    };
  }

  // ── checkStatus ────────────────────────────────────────────────────────────
  async checkStatus(transactionId: string): Promise<StatusResult> {
    try {
      const res = await axios.get(`${this.endpoint}/query/${transactionId}`, {
        headers: { 'X-App-Id': this.appId },
      });
      return { status: res.data.trade_status ?? 'unknown', txId: transactionId };
    } catch {
      return { status: 'unknown', txId: transactionId };
    }
  }
}
