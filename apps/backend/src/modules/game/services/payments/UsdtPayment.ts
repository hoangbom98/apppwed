'use strict';
/**
 * UsdtPayment — Adapter nạp/rút USDT cho game module.
 * Hiển thị địa chỉ ví USDT và sinh QR code.
 */
const BasePayment = require('./BasePayment');

class UsdtPayment extends BasePayment {
  /**
   * @param {{ enabled: boolean, address?: string, network?: string, minConfirmations?: number }} config
   */
  constructor(config) {
    super(config);
    this.address       = config.address          ?? '';
    this.network       = config.network          ?? 'TRC20';
    this.minConfirms   = Number(config.minConfirmations ?? 1);
  }

  async processDeposit(amount) {
    if (!this.config.enabled) {
      return { status: 'error', gateway: 'usdt', amount, details: 'Cổng USDT chưa được kích hoạt' };
    }
    if (!this.address) {
      return { status: 'error', gateway: 'usdt', amount, details: 'Địa chỉ ví USDT chưa được cấu hình' };
    }

    let qrDataUrl = null;
    try {
      const QRCode = require('qrcode');
      qrDataUrl = await QRCode.toDataURL(this.address, { width: 200, margin: 1 });
    } catch { /* qrcode chưa cài — bỏ qua */ }

    return {
      status:   'pending',
      gateway:  'usdt',
      amount,
      details:  `Gửi ${amount} USDT (${this.network}) đến địa chỉ ví bên dưới. Yêu cầu tối thiểu ${this.minConfirms} xác nhận.`,
      address:  this.address,
      network:  this.network,
      qrDataUrl,
    };
  }

  async processWithdraw(amount, bankInfo) {
    if (!this.config.enabled) {
      return { status: 'error', gateway: 'usdt', amount, details: 'Cổng USDT chưa được kích hoạt' };
    }
    return {
      status:  'pending',
      gateway: 'usdt',
      amount,
      details: `Lệnh rút ${amount} USDT đến ví ${bankInfo?.address ?? 'N/A'} đã được ghi nhận, đang chờ xử lý on-chain`,
    };
  }

  async checkStatus(txRef) {
    // Xác nhận on-chain cần được thực hiện bởi blockchain listener
    return { status: 'unknown', txId: txRef, note: 'Cần kiểm tra trực tiếp trên blockchain' };
  }
}

module.exports = UsdtPayment;
