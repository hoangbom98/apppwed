// @ts-nocheck
// backend/src/modules/game/services/payments/BasePayment.js
class BasePayment {
  constructor(config) {
    this.config = config;
  }

  async processDeposit(_amount) {
    throw new Error('Method not implemented');
  }
}

module.exports = BasePayment;
