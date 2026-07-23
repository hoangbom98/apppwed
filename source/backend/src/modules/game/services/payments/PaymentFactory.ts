// @ts-nocheck
const BankPayment = require('./BankPayment');
const UsdtPayment = require('./UsdtPayment');
const ConfigService = require('../../../../shared/services/configService');

class PaymentFactory {
  constructor(prisma) {
    this.config = new ConfigService(prisma);
    this.prisma = prisma;
  }

  async getGateway() {
    const projectCode = 'game';
    const activeGateway = await this.config.get(projectCode, 'payment', 'gateway', 'active_gateway', 'bank');

    switch (activeGateway) {
      case 'bank':
        return new BankPayment(await this.getBankConfig());
      case 'usdt':
        return new UsdtPayment(await this.getUsdtConfig());
      default:
        throw new Error(`Payment gateway ${activeGateway} not supported`);
    }
  }

  async getBankConfig() {
    return {
      enabled: await this.config.get('game', 'payment', 'gateway', 'bank.enabled', true),
      apiUrl: await this.config.get('game', 'payment', 'gateway', 'bank.api_url', ''),
    };
  }

  async getUsdtConfig() {
    return {
      enabled: await this.config.get('game', 'payment', 'gateway', 'usdt.enabled', false),
    };
  }
}

module.exports = PaymentFactory;
