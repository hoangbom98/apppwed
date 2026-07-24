'use strict';
/**
 * prisma/seeds/trade.seed.js — Trade DB seed
 * Creates: Market (CRYPTO) + 10 Symbol rows (BTC/USDT, ETH/USDT, …)
 *
 * Trade schema has NO TradingPair model. Correct hierarchy:
 *   Market (1) → Symbol (many)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient } = require('../../src/config/databases');
const prisma = getPrismaClient('trade');

async function seed() {
  // ── 1. Market ──────────────────────────────────────────────────────────────
  const cryptoMarket = await prisma.market.upsert({
    where:  { code: 'CRYPTO' },
    update: { status: 'active' },
    create: {
      code:      'CRYPTO',
      name:      'Crypto Market',
      type:      'crypto',
      timezone:  'UTC',
      openTime:  '00:00',
      closeTime: '23:59',
      status:    'active',
      sortOrder: 1,
    },
  });
  console.log(`  Markets: 1 (id: ${cryptoMarket.id})`);

  const forexMarket = await prisma.market.upsert({
    where:  { code: 'FOREX' },
    update: { status: 'active' },
    create: {
      code:      'FOREX',
      name:      'Forex Market',
      type:      'forex',
      timezone:  'UTC',
      openTime:  '00:00',
      closeTime: '23:59',
      status:    'active',
      sortOrder: 2,
    },
  });

  // ── 2. Symbols ─────────────────────────────────────────────────────────────
  const cryptoSymbols = [
    { code: 'BTCUSDT',  name: 'Bitcoin / USDT',       baseAsset: 'BTC',   quoteAsset: 'USDT', minQty: 0.00001,  maxQty: 100,      tickSize: 0.01,   stepSize: 0.00001,  minLeverage: 1, maxLeverage: 100, sortOrder: 1  },
    { code: 'ETHUSDT',  name: 'Ethereum / USDT',       baseAsset: 'ETH',   quoteAsset: 'USDT', minQty: 0.0001,   maxQty: 1000,     tickSize: 0.01,   stepSize: 0.0001,   minLeverage: 1, maxLeverage: 100, sortOrder: 2  },
    { code: 'BNBUSDT',  name: 'BNB / USDT',            baseAsset: 'BNB',   quoteAsset: 'USDT', minQty: 0.001,    maxQty: 10000,    tickSize: 0.01,   stepSize: 0.001,    minLeverage: 1, maxLeverage: 75,  sortOrder: 3  },
    { code: 'SOLUSDT',  name: 'Solana / USDT',         baseAsset: 'SOL',   quoteAsset: 'USDT', minQty: 0.01,     maxQty: 100000,   tickSize: 0.001,  stepSize: 0.01,     minLeverage: 1, maxLeverage: 75,  sortOrder: 4  },
    { code: 'XRPUSDT',  name: 'XRP / USDT',            baseAsset: 'XRP',   quoteAsset: 'USDT', minQty: 1,        maxQty: 1000000,  tickSize: 0.0001, stepSize: 1,        minLeverage: 1, maxLeverage: 75,  sortOrder: 5  },
    { code: 'ADAUSDT',  name: 'Cardano / USDT',        baseAsset: 'ADA',   quoteAsset: 'USDT', minQty: 1,        maxQty: 1000000,  tickSize: 0.0001, stepSize: 1,        minLeverage: 1, maxLeverage: 50,  sortOrder: 6  },
    { code: 'DOGEUSDT', name: 'Dogecoin / USDT',       baseAsset: 'DOGE',  quoteAsset: 'USDT', minQty: 1,        maxQty: 5000000,  tickSize: 0.0001, stepSize: 1,        minLeverage: 1, maxLeverage: 50,  sortOrder: 7  },
    { code: 'AVAXUSDT', name: 'Avalanche / USDT',      baseAsset: 'AVAX',  quoteAsset: 'USDT', minQty: 0.01,     maxQty: 10000,    tickSize: 0.01,   stepSize: 0.01,     minLeverage: 1, maxLeverage: 75,  sortOrder: 8  },
    { code: 'MATICUSDT',name: 'Polygon / USDT',        baseAsset: 'MATIC', quoteAsset: 'USDT', minQty: 1,        maxQty: 500000,   tickSize: 0.0001, stepSize: 1,        minLeverage: 1, maxLeverage: 50,  sortOrder: 9  },
    { code: 'DOTUSDT',  name: 'Polkadot / USDT',       baseAsset: 'DOT',   quoteAsset: 'USDT', minQty: 0.1,      maxQty: 100000,   tickSize: 0.001,  stepSize: 0.1,      minLeverage: 1, maxLeverage: 75,  sortOrder: 10 },
  ];

  const forexSymbols = [
    { code: 'EURUSD', name: 'Euro / US Dollar',        baseAsset: 'EUR', quoteAsset: 'USD', minQty: 0.01, maxQty: 1000, tickSize: 0.00001, stepSize: 0.01, minLeverage: 1, maxLeverage: 500, sortOrder: 11 },
    { code: 'GBPUSD', name: 'British Pound / US Dollar', baseAsset: 'GBP', quoteAsset: 'USD', minQty: 0.01, maxQty: 1000, tickSize: 0.00001, stepSize: 0.01, minLeverage: 1, maxLeverage: 500, sortOrder: 12 },
    { code: 'USDJPY', name: 'US Dollar / Japanese Yen', baseAsset: 'USD', quoteAsset: 'JPY', minQty: 0.01, maxQty: 1000, tickSize: 0.001,   stepSize: 0.01, minLeverage: 1, maxLeverage: 500, sortOrder: 13 },
  ];

  let symbolCount = 0;
  for (const s of cryptoSymbols) {
    await prisma.symbol.upsert({
      where:  { code: s.code },
      update: { status: 'active', sortOrder: s.sortOrder },
      create: { ...s, marketId: cryptoMarket.id, status: 'active' },
    });
    symbolCount++;
  }
  for (const s of forexSymbols) {
    await prisma.symbol.upsert({
      where:  { code: s.code },
      update: { status: 'active', sortOrder: s.sortOrder },
      create: { ...s, marketId: forexMarket.id, status: 'active' },
    });
    symbolCount++;
  }
  console.log(`  Symbols: ${symbolCount} (${cryptoSymbols.length} crypto + ${forexSymbols.length} forex)`);

  // ── 3. Investment Packages ──────────────────────────────────────────────────
  const packages = [
    {
      name:        'Gói Cơ Bản',
      description: 'Gói đầu tư cơ bản, phù hợp cho người mới. Lãi suất 0.5%/ngày trong 30 ngày.',
      minAmount:   100,
      maxAmount:   5000,
      dailyProfit: 0.5,
      duration:    30,
      isActive:    true,
      sortOrder:   1,
    },
    {
      name:        'Gói Nâng Cao',
      description: 'Gói đầu tư nâng cao. Lãi suất 0.8%/ngày trong 60 ngày.',
      minAmount:   500,
      maxAmount:   20000,
      dailyProfit: 0.8,
      duration:    60,
      isActive:    true,
      sortOrder:   2,
    },
    {
      name:        'Gói VIP',
      description: 'Gói đầu tư VIP dành cho nhà đầu tư lớn. Lãi suất 1.2%/ngày trong 90 ngày.',
      minAmount:   2000,
      maxAmount:   0, // unlimited
      dailyProfit: 1.2,
      duration:    90,
      isActive:    true,
      sortOrder:   3,
    },
    {
      name:        'Gói Premium',
      description: 'Gói đầu tư premium. Lãi suất 1.5%/ngày trong 180 ngày.',
      minAmount:   5000,
      maxAmount:   0,
      dailyProfit: 1.5,
      duration:    180,
      isActive:    true,
      sortOrder:   4,
    },
  ];

  for (const pkg of packages) {
    await prisma.investmentPackage.upsert({
      where:  { name: pkg.name },
      update: { dailyProfit: pkg.dailyProfit, isActive: pkg.isActive },
      create: pkg,
    });
  }
  console.log(`  InvestmentPackages: ${packages.length}`);
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .then(() => { console.log('✅ trade.seed done'); process.exit(0); })
    .catch(e => { console.error('[seed:trade] ❌', e); process.exit(1); });
}
