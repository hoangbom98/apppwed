import { DepositOrder, PaymentInstructions, VerifyResult, WithdrawResult, StatusResult } from './types';

/**
 * BasePaymentAdapter — Abstract interface for all payment gateway adapters.
 */
export abstract class BasePaymentAdapter {
  protected gateway: any;
  protected cfg: any;
  protected prisma: any;

  /**
   * @param {object} gateway  – Full PaymentGateway Prisma record
   * @param {object} prisma   – Prisma client for this module's database
   */
  constructor(gateway: any, prisma: any) {
    if (new.target === BasePaymentAdapter) {
      throw new Error('BasePaymentAdapter is abstract and cannot be instantiated directly.');
    }
    this.gateway = gateway;
    this.cfg     = gateway.config ?? {};
    this.prisma  = prisma;
  }

  // ── Abstract methods ───────────────────────────────────────────────────────

  abstract createDeposit(order: DepositOrder): Promise<PaymentInstructions>;

  abstract verifyPayment(payload: any, sig?: string): Promise<VerifyResult>;

  abstract processWithdraw(request: any): Promise<WithdrawResult>;

  abstract checkStatus(transactionId: string): Promise<StatusResult>;

  // ── Shared helpers ────────────────────────────────────────────────────────

  formatDepositResponse(data: Partial<PaymentInstructions> & { type: PaymentInstructions['type'], title: string }): PaymentInstructions {
    return {
      type:        data.type,
      title:       data.title,
      fields:      data.fields      ?? [],
      qrDataUrl:   data.qrDataUrl   ?? null,
      redirectUrl: data.redirectUrl ?? null,
      expiresAt:   data.expiresAt   ?? null,
    };
  }

  calculateFee(amount: number): number {
    const fees = this.gateway.fees ?? {};
    const pct  = Number(fees.percentage ?? 0);
    const fixed= Number(fees.fixed      ?? 0);
    return Math.ceil(amount * pct / 100) + fixed;
  }

  validateAmount(amount: number): void {
    const limits = this.gateway.limits ?? {};
    const min = Number(limits.min ?? 0);
    const max = Number(limits.max ?? Infinity);
    if (amount < min) throw new Error(`Số tiền tối thiểu là ${min.toLocaleString()}`);
    if (amount > max) throw new Error(`Số tiền tối đa là ${max.toLocaleString()}`);
  }
}
