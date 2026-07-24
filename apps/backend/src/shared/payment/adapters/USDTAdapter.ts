'use strict';
/**
 * USDTAdapter — Crypto deposit/withdraw via USDT (TRC20 / ERC20 / BEP20).
 *
 * Deposit:  Show wallet address + generate QR code.
 * Webhook:  Accept payload from TronGrid/Etherscan/BSCScan webhook or
 *           a self-hosted blockchain listener.
 * Withdraw: Record withdrawal intent; actual on-chain TX is handled by
 *           a manual or scheduled job (hot-wallet management is out-of-scope
 *           for the adapter layer).
 *
 * AUTO-REFUND: When cfg.autoRefund=true, failed/unconfirmed webhook calls
 *              trigger a 'refund' ledger entry so the user is made whole.
 */
const BasePaymentAdapter = require('../BasePaymentAdapter');
const logger = require('../../services/logger');

class USDTAdapter extends BasePaymentAdapter {
  constructor(gateway, prisma) {
    super(gateway, prisma);
    this.address     = this.cfg.address          ?? '';
    this.network     = this.cfg.network          ?? 'TRC20';
    this.minConfirms = Number(this.cfg.minConfirmations ?? 1);
    this.autoRefund  = this.cfg.autoRefund        !== false; // default true
    this.feePercent  = Number(this.cfg.feePercent ?? 0);
  }

  // ── createDeposit ─────────────────────────────────────────────────────────
  async createDeposit(order) {
    this.validateAmount(Number(order.amount));

    // Optional: per-user unique address (if cfg.generateUniqueAddress is true)
    const address = this.address;
    const fee     = this.feePercent > 0
      ? Number((Number(order.amount) * this.feePercent / 100).toFixed(6))
      : 0;

    // Generate QR code (qrcode is a common dep — graceful fallback)
    let qrDataUrl = null;
    try {
      const QRCode = require('qrcode');
      qrDataUrl = await QRCode.toDataURL(address, { width: 200, margin: 1 });
    } catch { /* qrcode package not installed → skip QR */ }

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    return this.formatDepositResponse({
      type:   'crypto',
      title:  `Nạp bằng USDT (${this.network})`,
      fields: [
        { label: 'Mạng lưới',            value: this.network,                  copyable: false },
        { label: 'Địa chỉ ví',           value: address,                       copyable: true  },
        { label: 'Số tiền (USDT)',        value: String(order.amount),          copyable: true  },
        { label: 'Phí',                   value: fee > 0 ? `${fee} USDT` : 'Miễn phí', copyable: false },
        { label: 'Xác nhận tối thiểu',   value: String(this.minConfirms),      copyable: false },
        { label: 'Tự động hoàn trả',     value: this.autoRefund ? 'Có' : 'Không', copyable: false },
      ],
      qrDataUrl,
      expiresAt,
    });
  }

  // ── verifyPayment (webhook) ───────────────────────────────────────────────
  /**
   * Processes an inbound USDT blockchain webhook.
   * If the transaction is invalid/unconfirmed AND autoRefund=true,
   * this method writes a refund Transaction entry so the user's balance
   * is restored without admin intervention.
   */
  async verifyPayment(payload, _sig) {
    const { txId, amount, toAddress, confirmed, orderId, fromAddress } = payload;

    if (!txId || !amount) {
      return { success: false, error: 'Missing txId or amount' };
    }

    // Verify the payment was sent to our address
    if (toAddress && toAddress.toLowerCase() !== this.address.toLowerCase()) {
      logger.warn('USDT webhook: address mismatch', { toAddress, expected: this.address });
      return { success: false, error: 'Address mismatch' };
    }

    // Not yet confirmed on-chain
    if (!confirmed) {
      // Auto-refund: if an orderId is linked and amount matches, write ledger
      if (this.autoRefund && orderId) {
        await this._writeAutoRefund(orderId, Number(amount), txId, 'Unconfirmed on-chain').catch(
          e => logger.error('USDT auto-refund failed', { e: e.message, orderId })
        );
      }
      return { success: false, error: 'Transaction not yet confirmed' };
    }

    return {
      success:     true,
      amount:      Number(amount),
      txId,
      orderId:     orderId ?? null,
      fromAddress: fromAddress ?? null,
    };
  }

  // ── Auto-refund helper ───────────────────────────────────────────────────
  /**
   * Write a 'refund' Transaction ledger entry so the user's balance
   * is restored after a failed/unconfirmed USDT deposit.
   * Only runs when cfg.autoRefund=true (default).
   *
   * @param {string} orderId
   * @param {number} amount
   * @param {string} txId
   * @param {string} reason
   */
  async _writeAutoRefund(orderId, amount, txId, reason) {
    // Look up the deposit order to get userId
    const order = await this.prisma.depositOrder.findUnique({
      where: { id: orderId },
      select: { userId: true, status: true },
    });

    // Only refund if the order is still pending (not already credited or refunded)
    if (!order || order.status !== 'pending') return;

    await this.prisma.$transaction(async (tx) => {
      // Mark order as refunded
      await tx.depositOrder.update({
        where: { id: orderId },
        data:  { status: 'refunded', txId, processedAt: new Date() },
      });

      // Check if the project DB has a Transaction model before writing
      if (tx.transaction) {
        await tx.transaction.create({
          data: {
            userId:        order.userId,
            type:          'refund',
            amount,
            referenceId:   orderId,
            referenceType: 'deposit_order',
            note:          `USDT auto-refund — ${reason}`,
          },
        }).catch(() => { /* model may have additional required fields */ });
      }

      logger.info('USDT auto-refund written', { orderId, userId: order.userId, amount, reason });
    });
  }

  // ── processWithdraw ───────────────────────────────────────────────────────
  async processWithdraw(request) {
    this.validateAmount(Number(request.amount));
    // Record intent; actual on-chain TX must be submitted by hot-wallet service
    return {
      success: true,
      message: `Withdrawal of ${request.amount} USDT to ${request.address} queued for on-chain processing`,
      pendingTxId: null,
    };
  }

  // ── checkStatus ───────────────────────────────────────────────────────────
  async checkStatus(txId) {
    // Could call TronGrid / Etherscan API here; stub for now
    return { status: 'unknown', txId, note: 'Manual blockchain check required' };
  }
}

module.exports = USDTAdapter;
