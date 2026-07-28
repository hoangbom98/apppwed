import { BasePaymentAdapter } from '../BasePaymentAdapter';
import { DepositOrder, PaymentInstructions, VerifyResult, WithdrawResult, StatusResult } from '../types';

export class MomoAdapter extends BasePaymentAdapter {
  private partnerCode: string;
  private accessKey: string;
  private secretKey: string;
  private endpoint: string;

  constructor(gateway: any, prisma: any) {
    super(gateway, prisma);
    this.partnerCode = this.cfg.partnerCode ?? process.env.MOMO_PARTNER_CODE ?? '';
    this.accessKey   = this.cfg.accessKey   ?? process.env.MOMO_ACCESS_KEY   ?? '';
    this.secretKey   = this.cfg.secretKey   ?? process.env.MOMO_SECRET_KEY   ?? '';
    this.endpoint    = this.cfg.endpoint    ?? process.env.MOMO_ENDPOINT     ?? 'https://payment.momo.vn/v2/gateway/api/create';
  }

  async createDeposit(order: DepositOrder): Promise<PaymentInstructions> {
    this.validateAmount(Number(order.amount));

    // Delegate to paymentService
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

  async verifyPayment(payload: any, _sig?: string): Promise<VerifyResult> {
    const { orderId, amount, resultCode, transId } = payload;
    const success = resultCode === 0 || resultCode === '0';

    return {
      success,
      amount:  Number(amount),
      txId:    String(transId ?? ''),
      orderId: orderId ?? null,
    };
  }

  async processWithdraw(_request: any): Promise<WithdrawResult> {
    return {
      success: false,
      error:   'Withdraw qua MoMo chưa được kích hoạt. Liên hệ admin.',
    };
  }

  async checkStatus(transactionId: string): Promise<StatusResult> {
    return { status: 'unknown', txId: transactionId, note: 'MoMo status check via IPN only' };
  }
}
