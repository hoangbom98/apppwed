// @ts-nocheck
/* eslint-disable */

'use strict';

/**
 * BasePaymentAdapter — Abstract interface for all payment gateway adapters.
 *
 * Each concrete adapter must implement:
 *   - createDeposit(order)         → PaymentInstructions
 *   - verifyPayment(payload)       → VerifyResult
 *   - processWithdraw(request)     → WithdrawResult
 *   - checkStatus(transactionId)   → StatusResult
 *
 * Adapters receive the full PaymentGateway DB record as `config`,
 * so they always have access to gateway.config (JSON), gateway.fees, gateway.limits.
 */
class BasePaymentAdapter {
  /**
   * @param {object} gateway  – Full PaymentGateway Prisma record
   * @param {object} prisma   – Prisma client for this module's database
   */
  constructor(gateway, prisma) {
    if (new.target === BasePaymentAdapter) {
      throw new Error('BasePaymentAdapter is abstract and cannot be instantiated directly.');
    }
    this.gateway = gateway;          // full DB record: { id, code, name, type, config, fees, limits, ... }
    this.cfg     = gateway.config ?? {}; // shorthand for gateway-specific config
    this.prisma  = prisma;
  }

  // ── Abstract methods (must be overridden) ─────────────────────────────────

  /**
   * Create a deposit request.
   * @param {object} order  – DepositOrder record (id, userId, amount, currency, ...)
   * @returns {Promise<PaymentInstructions>}
   */
  // eslint-disable-next-line no-unused-vars
  async createDeposit(order) {
    throw new Error(`${this.constructor.name}.createDeposit() not implemented`);
  }

  /**
   * Verify an incoming webhook payload.
   * @param {object} payload  – Raw webhook body
   * @param {string} [sig]    – Signature header value (if applicable)
   * @returns {Promise<VerifyResult>}  { success, amount, txId, orderId }
   */
  // eslint-disable-next-line no-unused-vars
  async verifyPayment(payload, sig) {
    throw new Error(`${this.constructor.name}.verifyPayment() not implemented`);
  }

  /**
   * Submit a withdrawal request to the gateway.
   * @param {object} request  – WithdrawOrder record
   * @returns {Promise<WithdrawResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async processWithdraw(request) {
    throw new Error(`${this.constructor.name}.processWithdraw() not implemented`);
  }

  /**
   * Query the status of a transaction.
   * @param {string} transactionId
   * @returns {Promise<StatusResult>}  { status: 'pending'|'completed'|'failed', amount, txId }
   */
  // eslint-disable-next-line no-unused-vars
  async checkStatus(transactionId) {
    throw new Error(`${this.constructor.name}.checkStatus() not implemented`);
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  /**
   * Normalise an adapter's raw response into the standard PaymentInstructions
   * shape that the frontend GatewaySelector / DepositInstructions component expects.
   *
   * @param {object} data
   * @param {'bank_transfer'|'crypto'|'redirect'|'qr_code'} data.type
   * @param {string}  data.title
   * @param {Array<{label:string, value:string, copyable?:boolean}>} [data.fields]
   * @param {string}  [data.qrDataUrl]
   * @param {string}  [data.redirectUrl]
   * @param {string}  [data.expiresAt]   ISO string
   * @returns {PaymentInstructions}
   */
  formatDepositResponse(data) {
    return {
      type:        data.type,
      title:       data.title,
      fields:      data.fields      ?? [],
      qrDataUrl:   data.qrDataUrl   ?? null,
      redirectUrl: data.redirectUrl ?? null,
      expiresAt:   data.expiresAt   ?? null,
    };
  }

  /**
   * Calculate fee for a given amount using this gateway's fee structure.
   * @param {number} amount
   * @returns {number} fee amount (rounded up to integer VND / smallest unit)
   */
  calculateFee(amount) {
    const fees = this.gateway.fees ?? {};
    const pct  = Number(fees.percentage ?? 0);
    const fixed= Number(fees.fixed      ?? 0);
    return Math.ceil(amount * pct / 100) + fixed;
  }

  /**
   * Validate amount against gateway limits.
   * @param {number} amount
   * @throws {Error} if amount is out of range
   */
  validateAmount(amount) {
    const limits = this.gateway.limits ?? {};
    const min = Number(limits.min ?? 0);
    const max = Number(limits.max ?? Infinity);
    if (amount < min) throw new Error(`Số tiền tối thiểu là ${min.toLocaleString()}`);
    if (amount > max) throw new Error(`Số tiền tối đa là ${max.toLocaleString()}`);
  }
}

module.exports = BasePaymentAdapter;
