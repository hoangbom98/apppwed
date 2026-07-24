// backend/src/modules/game/services/payments/BankPayment.js
const BasePayment = require('./BasePayment');

class BankPayment extends BasePayment {
  async processDeposit(amount) {
    return { status: 'success', gateway: 'bank', amount, details: `Processing via ${this.config.apiUrl}` };
  }
}

module.exports = BankPayment;
