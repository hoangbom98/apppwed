'use strict';
/**
 * BasePayment — Abstract base class cho payment adapters của game module.
 *
 * @deprecated Dùng shared/payment/BasePaymentAdapter thay thế cho code mới.
 * BankPayment và UsdtPayment vẫn kế thừa class này để đảm bảo tương thích ngược.
 */
class BasePayment {
  config: any;

  constructor(config: any) {
    if (new.target === BasePayment) {
      throw new Error('BasePayment là abstract class, không thể khởi tạo trực tiếp');
    }
    this.config = config ?? {};
  }

  /**
   * Xử lý nạp tiền — subclass bắt buộc override.
   * @param {number} amount
   * @returns {Promise<{status: string, gateway: string, amount: number, details: string}>}
   */
  async processDeposit(_amount) {
    throw new Error(`${this.constructor.name} chưa implement processDeposit()`);
  }

  /**
   * Xử lý rút tiền — subclass có thể override.
   * @param {number} _amount
   * @param {object} _bankInfo
   */
  async processWithdraw(_amount, _bankInfo) {
    throw new Error(`${this.constructor.name} chưa implement processWithdraw()`);
  }

  /**
   * Xác minh trạng thái giao dịch theo mã tham chiếu.
   * @param {string} _txRef
   */
  async checkStatus(_txRef) {
    return { status: 'unknown' };
  }
}

module.exports = BasePayment;
