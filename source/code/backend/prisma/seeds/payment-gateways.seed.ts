'use strict';
/**
 * prisma/seeds/payment-gateways.seed.js — admin_db PaymentGateway rows
 * Safe to re-run (preserves admin-edited values on update).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient } = require('../../src/config/databases');

async function seed() {
  const prisma = getPrismaClient('admin');

  const gateways = [
    {
      code:      'lkvip',
      name:      'Chuyển khoản ngân hàng (LKvip)',
      type:      'bank',
      status:    'active',
      config:    { bankName: 'Sacombank', accountNumber: '060123456789', accountName: 'CONG TY TNHH LKVIP GROUP' },
      fees:      { percentage: 0, fixed: 0, min: 0, max: 0 },
      limits:    { min: 10000, max: 50000000, daily: 200000000 },
      sortOrder: 1,
    },
    {
      code:      'usdt',
      name:      'USDT (TRC20)',
      type:      'crypto',
      status:    'active',
      config:    { network: 'TRC20', address: 'REPLACE_WITH_YOUR_USDT_TRC20_ADDRESS' },
      fees:      { percentage: 0.5, fixed: 0, min: 0, max: 0 },
      limits:    { min: 5, max: 50000, daily: 100000 },
      sortOrder: 2,
    },
    {
      code:      'momo',
      name:      'Ví MoMo',
      type:      'ewallet',
      status:    'active',
      config:    {
        partnerCode: process.env.MOMO_PARTNER_CODE ?? 'MOMOBKUN20180529',
        accessKey:   process.env.MOMO_ACCESS_KEY   ?? 'klm05TvNBzhg7h7j',
        secretKey:   process.env.MOMO_SECRET_KEY   ?? 'at67qH6mk8w5Y1nAyMoTDo3YXkGxbypY',
        endpoint:    process.env.MOMO_ENDPOINT     ?? 'https://test-payment.momo.vn/v2/gateway/api/create',
      },
      fees:      { percentage: 0, fixed: 0, min: 0, max: 0 },
      limits:    { min: 10000, max: 20000000, daily: 50000000 },
      sortOrder: 3,
    },
    {
      code:      'okpay',
      name:      'OKPay',
      type:      'ewallet',
      status:    'inactive',
      config:    { apiKey: 'REPLACE_WITH_OKPAY_API_KEY', secret: 'REPLACE_WITH_OKPAY_SECRET', endpoint: 'https://api.okpay.com/v1' },
      fees:      { percentage: 1, fixed: 0, min: 0, max: 0 },
      limits:    { min: 100, max: 10000, daily: 20000 },
      sortOrder: 4,
    },
    {
      code:      'gopay',
      name:      'GoPay',
      type:      'ewallet',
      status:    'inactive',
      config:    {
        appId:       'REPLACE_WITH_GOPAY_APP_ID',
        merchantId:  'REPLACE_WITH_GOPAY_MERCHANT_ID',
        secretKey:   'REPLACE_WITH_GOPAY_SECRET_KEY',
        accessToken: 'REPLACE_WITH_GOPAY_ACCESS_TOKEN',
        endpoint:    'https://api.gopay.vn/v1',
      },
      fees:      { percentage: 0.5, fixed: 0, min: 0, max: 0 },
      limits:    { min: 50000, max: 100000000, daily: 500000000 },
      sortOrder: 5,
    },
    {
      code:      '818pay',
      name:      '818PAY',
      type:      'ewallet',
      status:    'inactive',
      config:    {
        merchantId: 'REPLACE_WITH_818PAY_MERCHANT_ID',
        apiKey:     'REPLACE_WITH_818PAY_API_KEY',
        secretKey:  'REPLACE_WITH_818PAY_SECRET_KEY',
        endpoint:   'https://api.818pay.com/v2',
      },
      fees:      { percentage: 0.5, fixed: 0, min: 0, max: 0 },
      limits:    { min: 10, max: 50000, daily: 200000 },
      sortOrder: 6,
    },
  ];

  let created = 0, updated = 0;
  for (const gw of gateways) {
    const existing = await prisma.paymentGateway.findUnique({ where: { code: gw.code } });
    if (existing) {
      // Only update non-sensitive display fields — preserve live admin config
      await prisma.paymentGateway.update({
        where: { code: gw.code },
        data:  { name: gw.name, type: gw.type, limits: gw.limits, sortOrder: gw.sortOrder },
      });
      updated++;
    } else {
      await prisma.paymentGateway.create({ data: gw });
      created++;
    }
  }
  console.log(`  PaymentGateways: ${created} created, ${updated} updated`);
}

module.exports = { seed };

if (require.main === module) {
  seed().catch(e => { console.error(e); process.exit(1); });
}
