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

  // ── 3. Investment Packages ─────────────────────────────────────────────────
  const packages = [
    {
      name: 'Gói Cơ Bản',        price: 100,    minAmount: 100,    maxAmount: 999,
      dailyProfit: 0.5,  duration: 30, totalReturn: 15.0, level: 1, sortOrder: 1,
      description: 'Gói đầu tư cơ bản, phù hợp người mới. Lợi nhuận 0.5%/ngày trong 30 ngày.',
    },
    {
      name: 'Gói Bạc',           price: 1000,   minAmount: 1000,   maxAmount: 4999,
      dailyProfit: 0.8,  duration: 60, totalReturn: 48.0, level: 1, sortOrder: 2,
      description: 'Gói bạc - Tăng trưởng ổn định. Lợi nhuận 0.8%/ngày trong 60 ngày.',
    },
    {
      name: 'Gói Vàng',          price: 5000,   minAmount: 5000,   maxAmount: 19999,
      dailyProfit: 1.0,  duration: 90, totalReturn: 90.0, level: 2, sortOrder: 3,
      description: 'Gói vàng - Tăng trưởng cao. Lợi nhuận 1.0%/ngày trong 90 ngày.',
    },
    {
      name: 'Gói VIP Bạch Kim',  price: 20000,  minAmount: 20000,  maxAmount: 99999,
      dailyProfit: 1.2,  duration: 120, totalReturn: 144.0, level: 3, sortOrder: 4,
      description: 'Gói VIP Bạch Kim. Lợi nhuận 1.2%/ngày, ưu tiên hỗ trợ.',
    },
    {
      name: 'Gói VIP Kim Cương',  price: 100000, minAmount: 100000, maxAmount: 1000000,
      dailyProfit: 1.5,  duration: 180, totalReturn: 270.0, level: 4, sortOrder: 5,
      description: 'Gói VIP Kim Cương - Đỉnh cao đầu tư. Lợi nhuận 1.5%/ngày.',
    },
  ];

  let pkgCount = 0;
  for (const pkg of packages) {
    await prisma.investmentPackage.upsert({
      where:  { name: pkg.name },
      update: { isActive: true },
      create: { ...pkg, isActive: true },
    });
    pkgCount++;
  }
  console.log(`  Investment Packages: ${pkgCount}`);

  // ── 4. Company Banks ───────────────────────────────────────────────────────
  const banks = [
    {
      bankName: 'Vietcombank', accountName: 'LKVIP GROUP',
      accountNumber: '1234567890', branch: 'HCM', type: 'bank',
      sortOrder: 1,
    },
    {
      bankName: 'Techcombank', accountName: 'LKVIP GROUP',
      accountNumber: '0987654321', branch: 'HN',  type: 'bank',
      sortOrder: 2,
    },
    {
      bankName: 'USDT TRC20',  accountName: 'LKVIP USDT Wallet',
      accountNumber: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      branch: null, type: 'usdt_trc20', sortOrder: 3,
    },
    {
      bankName: 'USDT BEP20',  accountName: 'LKVIP USDT Wallet',
      accountNumber: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      branch: null, type: 'usdt_bep20', sortOrder: 4,
    },
  ];

  let bankCount = 0;
  for (const bank of banks) {
    await prisma.companyBank.upsert({
      where:  { accountNumber: bank.accountNumber },
      update: { isActive: true },
      create: { ...bank, isActive: true },
    });
    bankCount++;
  }
  console.log(`  Company Banks: ${bankCount}`);

  // ── 5. Trade Config ────────────────────────────────────────────────────────
  const configs = [
    { key: 'withdrawal_fee_percent',   value: { value: 1.0 },   description: 'Phí rút tiền (%)'          },
    { key: 'min_deposit',              value: { value: 50 },     description: 'Nạp tiền tối thiểu (USD)'  },
    { key: 'min_withdrawal',           value: { value: 50 },     description: 'Rút tiền tối thiểu (USD)'  },
    { key: 'referral_commission_f1',   value: { value: 5.0 },   description: 'Hoa hồng F1 (% lợi nhuận)' },
    { key: 'referral_commission_f2',   value: { value: 2.0 },   description: 'Hoa hồng F2 (% lợi nhuận)' },
    { key: 'max_leverage',             value: { value: 100 },   description: 'Đòn bẩy tối đa'             },
    { key: 'liquidation_margin_ratio', value: { value: 0.05 },  description: 'Tỷ lệ margin thanh lý (5%)' },
    { key: 'maintenance_mode',         value: { enabled: false }, description: 'Chế độ bảo trì'           },
  ];

  let cfgCount = 0;
  for (const cfg of configs) {
    await prisma.tradeConfig.upsert({
      where:  { key: cfg.key },
      update: { value: cfg.value },
      create: cfg,
    });
    cfgCount++;
  }
  console.log(`  Trade Configs: ${cfgCount}`);
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .then(() => { console.log('✅ trade.seed done'); process.exit(0); })
    .catch(e => { console.error('[seed:trade] ❌', e); process.exit(1); });
}
