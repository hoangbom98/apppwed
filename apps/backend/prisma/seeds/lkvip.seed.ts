'use strict';
/**
 * prisma/seeds/lkvip.seed.js — LKvip seed (game_db)
 * Creates: BankAccount (main internal), PaymentSetting defaults
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient, disconnectAll } = require('../../src/config/databases');
const prisma = getPrismaClient('game');

async function seed() {
  // ── Main internal bank account ────────────────────────────────────
  const main = await prisma.bankAccount.upsert({
    where:  { accountNumber: '88990099' },
    update: {},
    create: {
      bankName:      'Ngân hàng Nội bộ LKvip',
      accountNumber: '88990099',
      accountName:   'CONG TY LKVIP',
      bankBin:       '970415',
      isMain:        true,
      isActive:      true,
    },
  });
  console.log(`  BankAccount: ${main.id} (${main.accountNumber})`);

  // ── Payment settings ──────────────────────────────────────────────
  const settings = [
    { projectCode: 'game', key: 'deposit.enabled',   value: true,     description: 'Enable/disable LKvip deposit' },
    { projectCode: 'game', key: 'withdraw.enabled',  value: true,     description: 'Enable/disable LKvip withdrawal' },
    { projectCode: 'game', key: 'deposit.min',       value: 10000,    description: 'Min deposit amount (VND)' },
    { projectCode: 'game', key: 'deposit.max',       value: 50000000, description: 'Max single deposit (VND)' },
    { projectCode: 'game', key: 'withdraw.min',      value: 50000,    description: 'Min withdrawal amount (VND)' },
    { projectCode: 'game', key: 'withdraw.max',      value: 50000000, description: 'Max single withdrawal (VND)' },
    { projectCode: 'game', key: 'va.expiry_minutes', value: 60,       description: 'VA expiry in minutes' },
  ];
  for (const s of settings) {
    await prisma.paymentSetting.upsert({
      where:  { projectCode_key: { projectCode: s.projectCode, key: s.key } },
      update: {},
      create: s,
    });
  }
  console.log(`  PaymentSettings: ${settings.length}`);
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .catch(e => { console.error('[seed:lkvip] ❌', e); process.exit(1); })
    .finally(() => disconnectAll());
}
