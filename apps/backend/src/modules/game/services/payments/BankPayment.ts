'use strict';
/**
 * BankPayment — Adapter chuyển khoản ngân hàng nội địa cho game module.
 * Kế thừa BasePayment; gọi cấu hình bank từ config được truyền vào.
 */
const BasePayment = require('./BasePayment');

class BankPayment extends BasePayment {
  /**
   * @param {{ apiUrl: string, bankName?: string, accountNumber?: string, accountName?: string, enabled: boolean }} config
   */
  constructor(config) {
    super(config);
  }

  async processDeposit(amount) {
    if (!this.config.enabled) {
      return { status: 'error', gateway: 'bank', amount, details: 'Cổng ngân hàng chưa được kích hoạt' };
    }
    return {
      status:  'pending',
      gateway: 'bank',
      amount,
      details: `Vui lòng chuyển khoản ${amount.toLocaleString('vi-VN')} VND đến tài khoản ${this.config.accountNumber ?? 'N/A'} — ${this.config.bankName ?? ''}`,
      bankName:      this.config.bankName      ?? '',
      accountNumber: this.config.accountNumber ?? '',
      accountName:   this.config.accountName   ?? '',
    };
  }

  async processWithdraw(amount, bankInfo) {
    if (!this.config.enabled) {
      return { status: 'error', gateway: 'bank', amount, details: 'Cổng ngân hàng chưa được kích hoạt' };
    }
    return {
      status:  'pending',
      gateway: 'bank',
      amount,
      details: `Lệnh rút ${amount.toLocaleString('vi-VN')} VND đến ${bankInfo?.bankName ?? ''} — ${bankInfo?.accountNumber ?? ''} đã được ghi nhận`,
    };
  }

  async checkStatus(txRef) {
    if (this.config.apiUrl) {
      try {
        const axios = require('axios');
        const res = await axios.get(`${this.config.apiUrl}/status/${txRef}`);
        return { status: res.data?.status ?? 'unknown', txId: txRef };
      } catch {
        return { status: 'unknown', txId: txRef };
      }
    }
    return { status: 'unknown', txId: txRef };
  }
}

module.exports = BankPayment;
