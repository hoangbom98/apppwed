'use strict';
/**
 * prisma/seeds/game.seed.js — Game DB seed
 * Creates: GameCategory, GameProvider, LotteryType, OddsSetting,
 *          VipLevel, Promotion, CheckinConfig, MissionTemplate, LuckyWheel
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('../../node_modules/.prisma/game-client');
const prisma = new PrismaClient();

async function seed() {
  // ── 1. Game Categories ────────────────────────────────────────────
  const categories = [
    { name: 'Slot',               slug: 'slot',         icon: '/icons/slot.svg',        sortOrder: 1 },
    { name: 'Live Casino',        slug: 'live-casino',  icon: '/icons/live-casino.svg', sortOrder: 2 },
    { name: 'Cá Cược Thể Thao',   slug: 'sports',       icon: '/icons/sports.svg',      sortOrder: 3 },
    { name: 'Xổ Số',              slug: 'lottery',      icon: '/icons/lottery.svg',     sortOrder: 4 },
    { name: 'Câu Cá',             slug: 'fishing',      icon: '/icons/fishing.svg',     sortOrder: 5 },
    { name: 'Bài',                slug: 'card',         icon: '/icons/card.svg',        sortOrder: 6 },
  ];
  for (const cat of categories) {
    await prisma.gameCategory.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  console.log(`  GameCategories: ${categories.length}`);

  // ── 2. Game Providers ─────────────────────────────────────────────
  const providers = [
    { code: 'GSC',      name: 'GSC Plus (JILI/PG/PP)',      baseUrl: process.env.GSC_BASE_URL      || 'https://api.gscplus.com',     status: 'active', config: { currency: 'VND', language: 'vi' } },
    { code: 'GOLDGATE', name: 'Goldgate (EVO/Sexy)',         baseUrl: process.env.GOLDGATE_BASE_URL || 'https://api.goldgate.io',     status: 'active', config: {} },
    { code: 'TCGAMING', name: 'TC Gaming (Lottery/Keno)',   baseUrl: process.env.TCGAMING_API_URL  || 'https://api.tcgaming.net',    status: 'active', config: { currency: 'VND2', walletType: 'transfer' } },
  ];
  for (const prov of providers) {
    await prisma.gameProvider.upsert({ where: { code: prov.code }, update: {}, create: prov });
  }
  console.log(`  GameProviders: ${providers.length}`);

  // ── 3. Lottery Types ──────────────────────────────────────────────
  const lotteryTypes = [
    { code: 'PC28',  name: 'PC 28',       description: 'Xổ số PC28 - Tài/Xỉu/Chẵn/Lẻ', config: { drawInterval: 180, maxBet: 10000000, minBet: 10000 }, status: 'active' },
    { code: 'MARK6', name: 'Mark Six',    description: 'Xổ số Mark 6 Hong Kong',         config: { drawInterval: 600, maxBet: 5000000,  minBet: 10000 }, status: 'active' },
    { code: 'K3',    name: 'K3 Xúc Xắc', description: 'Xúc xắc K3 - Tổng 3 viên',      config: { drawInterval: 60,  maxBet: 2000000,  minBet: 10000 }, status: 'active' },
  ];
  for (const lt of lotteryTypes) {
    await prisma.lotteryType.upsert({ where: { code: lt.code }, update: {}, create: lt });
  }
  console.log(`  LotteryTypes: ${lotteryTypes.length}`);

  // ── 4. Odds Settings ──────────────────────────────────────────────
  const odds = [
    { gameType: 'PC28_TAI',   rate: 1.95 }, { gameType: 'PC28_XIU',   rate: 1.95 },
    { gameType: 'PC28_CHAN',  rate: 1.95 }, { gameType: 'PC28_LE',    rate: 1.95 },
    { gameType: 'PC28_BIG',  rate: 1.95 }, { gameType: 'PC28_SMALL', rate: 1.95 },
    { gameType: 'K3_SUM',    rate: 1.90 }, { gameType: 'K3_PAIR',   rate: 4.50 },
    { gameType: 'K3_THREE',  rate: 50.0 },
  ];
  for (const o of odds) {
    await prisma.oddsSetting.upsert({ where: { gameType: o.gameType }, update: {}, create: o });
  }
  console.log(`  OddsSettings: ${odds.length}`);

  // ── 5. VIP Levels ─────────────────────────────────────────────────
  const vipLevels = [
    { level: 1, name: 'Đồng',     minTotalDeposit: 0,           cashbackRate: 0.003, interestRate: 0.001, withdrawLimit: 50_000_000,    freeSpins: 0,  benefits: { label: 'Thành viên Đồng' } },
    { level: 2, name: 'Bạc',      minTotalDeposit: 5_000_000,   cashbackRate: 0.005, interestRate: 0.002, withdrawLimit: 100_000_000,   freeSpins: 5,  benefits: { label: 'Thành viên Bạc',      extras: ['chat_support'] } },
    { level: 3, name: 'Vàng',     minTotalDeposit: 20_000_000,  cashbackRate: 0.008, interestRate: 0.003, withdrawLimit: 200_000_000,   freeSpins: 10, benefits: { label: 'Thành viên Vàng',     extras: ['priority_withdraw'] } },
    { level: 4, name: 'Bạch Kim', minTotalDeposit: 50_000_000,  cashbackRate: 0.010, interestRate: 0.004, withdrawLimit: 500_000_000,   freeSpins: 20, benefits: { label: 'Thành viên Bạch Kim', extras: ['priority_withdraw','dedicated_manager'] } },
    { level: 5, name: 'Kim Cương',minTotalDeposit: 200_000_000, cashbackRate: 0.015, interestRate: 0.005, withdrawLimit: 2_000_000_000, freeSpins: 50, benefits: { label: 'Thành viên Kim Cương', extras: ['priority_withdraw','dedicated_manager','exclusive_events'] } },
  ];
  for (const vip of vipLevels) {
    await prisma.vipLevel.upsert({
      where:  { level: vip.level },
      update: { name: vip.name, cashbackRate: vip.cashbackRate, interestRate: vip.interestRate, withdrawLimit: vip.withdrawLimit, freeSpins: vip.freeSpins, benefits: vip.benefits },
      create: { ...vip, status: 'active' },
    });
  }
  console.log(`  VipLevels: ${vipLevels.length}`);

  // ── 6. Promotions ─────────────────────────────────────────────────
  const promos = [
    { type: 'welcome',  title: 'Khuyến Mãi Chào Mừng 100%',   slug: 'chao-mung-100',      description: 'Nạp lần đầu được thưởng 100%', bonusType: 'bonus_percent', bonusValue: 100, minDeposit: 200_000, maxBonus: 2_000_000,  wagerMultiplier: 20, maxUsesPerUser: 1, status: 'active', sortOrder: 1 },
    { type: 'deposit',  title: 'Thưởng Nạp Hằng Ngày 20%',    slug: 'nap-hang-ngay-20',   description: 'Nạp tiền mỗi ngày thưởng 20%', bonusType: 'bonus_percent', bonusValue: 20,  minDeposit: 100_000, maxBonus: 1_000_000,  wagerMultiplier: 15, maxUsesPerUser: 1, status: 'active', sortOrder: 2 },
    { type: 'cashback', title: 'Hoàn Trả 5% Hằng Tuần',       slug: 'hoan-tra-hang-tuan', description: 'Nhận lại 5% thua trong tuần',   bonusType: 'cashback',       bonusValue: 5,   minDeposit: 0,       maxBonus: 5_000_000,  wagerMultiplier: 1,  maxUsesPerUser: 1, status: 'active', sortOrder: 3 },
  ];
  for (const promo of promos) {
    await prisma.promotion.upsert({ where: { slug: promo.slug }, update: {}, create: promo });
  }
  console.log(`  Promotions: ${promos.length}`);

  // ── 7. Check-in Config ────────────────────────────────────────────
  const checkins = [
    { day: 1, rewardType: 'coin', rewardAmount: 10  }, { day: 2, rewardType: 'coin', rewardAmount: 20  },
    { day: 3, rewardType: 'coin', rewardAmount: 30  }, { day: 4, rewardType: 'coin', rewardAmount: 50  },
    { day: 5, rewardType: 'coin', rewardAmount: 80  }, { day: 6, rewardType: 'coin', rewardAmount: 100 },
    { day: 7, rewardType: 'free_spin', rewardAmount: 200 },
  ];
  for (const cfg of checkins) {
    await prisma.checkinConfig.upsert({
      where:  { day: cfg.day },
      update: { rewardType: cfg.rewardType, rewardAmount: cfg.rewardAmount },
      create: { ...cfg, isActive: true },
    });
  }
  console.log(`  CheckinConfigs: ${checkins.length} days`);

  // ── 8. Mission Templates ──────────────────────────────────────────
  const missions = [
    { code: 'daily_login',   title: 'Đăng nhập hôm nay', description: 'Đăng nhập để nhận thưởng', targetType: 'LOGIN',   targetValue: 1, rewardType: 'coin', rewardAmount: 5,  sortOrder: 1 },
    { code: 'daily_deposit', title: 'Nạp tiền hôm nay',  description: 'Nạp tiền một lần',          targetType: 'DEPOSIT', targetValue: 1, rewardType: 'coin', rewardAmount: 20, sortOrder: 2 },
    { code: 'daily_bet_3',   title: 'Đặt cược 3 lần',    description: 'Đặt cược 3 lần bất kỳ',     targetType: 'BET',     targetValue: 3, rewardType: 'coin', rewardAmount: 30, sortOrder: 3 },
    { code: 'daily_lottery', title: 'Chơi xổ số',        description: 'Tham gia một kỳ xổ số',     targetType: 'LOTTERY', targetValue: 1, rewardType: 'coin', rewardAmount: 10, sortOrder: 4 },
    { code: 'daily_invite',  title: 'Mời bạn bè',        description: 'Mời 1 người bạn đăng ký',   targetType: 'INVITE',  targetValue: 1, rewardType: 'coin', rewardAmount: 50, sortOrder: 5 },
  ];
  for (const m of missions) {
    await prisma.missionTemplate.upsert({
      where:  { code: m.code },
      update: { title: m.title, rewardAmount: m.rewardAmount },
      create: { ...m, missionType: 'daily', isActive: true },
    });
  }
  console.log(`  MissionTemplates: ${missions.length}`);

  // ── 9. Lucky Wheel ────────────────────────────────────────────────
  const wheel = await prisma.luckyWheelConfig.upsert({
    where:  { id: 'wheel_default' },
    update: { name: 'Vòng Quay May Mắn', maxFreeSpinsPerDay: 3, isActive: true },
    create: { id: 'wheel_default', name: 'Vòng Quay May Mắn', spinCost: 0, maxFreeSpinsPerDay: 3, resetHour: 0, isActive: true },
  });
  const prizes = [
    { label: '10 Coin',   rewardType: 'COIN',      rewardValue: 10,   probability: 0.30, color: '#F59E0B', sortOrder: 1 },
    { label: '20 Coin',   rewardType: 'COIN',      rewardValue: 20,   probability: 0.25, color: '#10B981', sortOrder: 2 },
    { label: '50 Coin',   rewardType: 'COIN',      rewardValue: 50,   probability: 0.15, color: '#3B82F6', sortOrder: 3 },
    { label: '100 Coin',  rewardType: 'COIN',      rewardValue: 100,  probability: 0.10, color: '#8B5CF6', sortOrder: 4 },
    { label: 'Free Spin', rewardType: 'FREE_SPIN', rewardValue: 1,    probability: 0.10, color: '#EF4444', sortOrder: 5 },
    { label: '200 Coin',  rewardType: 'COIN',      rewardValue: 200,  probability: 0.05, color: '#F97316', sortOrder: 6 },
    { label: '500 Coin',  rewardType: 'COIN',      rewardValue: 500,  probability: 0.03, color: '#06B6D4', sortOrder: 7 },
    { label: '1000 Coin', rewardType: 'COIN',      rewardValue: 1000, probability: 0.02, color: '#D97706', sortOrder: 8 },
  ];
  for (const p of prizes) {
    const existing = await prisma.wheelPrize.findFirst({ where: { wheelId: wheel.id, label: p.label } });
    if (!existing) {
      await prisma.wheelPrize.create({ data: { ...p, wheelId: wheel.id, isActive: true } });
    }
  }
  console.log(`  LuckyWheel + ${prizes.length} prizes`);
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .catch(e => { console.error('[seed:game] ❌', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
