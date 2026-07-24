'use strict';
/**
 * prisma/seeds/gameAggregators.seed.js — game_db GameAggregator config rows
 * Seeds GSC Plus, Goldgate, and TC Gaming.
 * Replace placeholder credentials with real values before production.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient } = require('../../src/config/databases');

const AGGREGATORS = [
  {
    code:        'GSC',
    name:        'GSC Plus',
    description: 'GSC Plus API v2.0.6 — 150+ game vendors (CQ9, JILI, PG, SBO, etc.)',
    baseUrl:     process.env.GSC_BASE_URL    || 'https://staging.gsimw.com',
    apiKey:      process.env.GSC_API_KEY     || 'YOUR_OPERATOR_CODE',
    secretKey:   process.env.GSC_SECRET_KEY  || 'YOUR_SECRET_KEY',
    status:      'active',
    config: {
      currency:   process.env.GSC_CURRENCY    || 'VND',
      language:   process.env.GSC_LANGUAGE    || 'vi',
      lobbyUrl:   process.env.GSC_LOBBY_URL   || '',
      depositUrl: process.env.GSC_DEPOSIT_URL || '',
      channelCode: 'gscp',
    },
    sortOrder: 1,
  },
  {
    code:        'GOLDGATE',
    name:        'Goldgate',
    description: 'Goldgate — seamless wallet, 100+ vendors (EVO, PG, JDB, SBO, JILI, CQ9)',
    baseUrl:     process.env.GOLDGATE_BASE_URL      || 'https://api.goldgate.io',
    apiKey:      process.env.GOLDGATE_CLIENT_ID     || 'YOUR_CLIENT_ID',
    secretKey:   process.env.GOLDGATE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
    status:      'active',
    config: {
      language: process.env.GOLDGATE_LANGUAGE  || 'vi',
      lobbyUrl: process.env.GOLDGATE_LOBBY_URL || '',
    },
    sortOrder: 2,
  },
  {
    code:        'TCGAMING',
    name:        'TC Gaming',
    description: 'TC Gaming — DES+SHA256 auth, transfer+seamless wallet, 200+ products',
    baseUrl:     process.env.TCGAMING_API_URL       || 'https://staging.tc-gaming.co/operator/index',
    apiKey:      process.env.TCGAMING_MERCHANT_CODE || 'YOUR_MERCHANT_CODE',
    secretKey:   process.env.TCGAMING_DES_KEY       || 'DESKEY01',
    status:      'active',
    config: {
      hashKey:  process.env.TCGAMING_HASH_KEY || 'YOUR_HASH_KEY',
      currency: process.env.TCGAMING_CURRENCY || 'VND2',
    },
    sortOrder: 3,
  },
];

async function seed() {
  const prisma = getPrismaClient('game');

  for (const agg of AGGREGATORS) {
    await prisma.gameAggregator.upsert({
      where:  { code: agg.code },
      create: agg,
      update: { name: agg.name, baseUrl: agg.baseUrl, apiKey: agg.apiKey, secretKey: agg.secretKey, status: agg.status, config: agg.config },
    });
    console.log(`  ${agg.code} — ${agg.name}`);
  }
  console.log(`  ⚠️  Set real credentials in .env: GSC_API_KEY, GOLDGATE_CLIENT_ID, TCGAMING_MERCHANT_CODE`);
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .catch(e => { console.error('[seed:aggregators] ❌', e); process.exit(1); });
}
