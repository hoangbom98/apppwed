// backend/src/modules/game/services/payments/UsdtPayment.js
const BasePayment = require('./BasePayment');

class UsdtPayment extends BasePayment {
  async processDeposit(amount) {
    return { status: 'success', gateway: 'usdt', amount, details: 'Processing USDT' };
  }
}

module.exports = UsdtPayment;
