/**
 * demo.seed.js — Demo data for all 6 databases (dev/staging only)
 *
 * Creates sample users, content, transactions for realistic testing.
 * All operations use upsert/create.catch() — safe to re-run.
 *
 * Usage:
 *   node prisma/seeds/demo.seed.js
 *   npm run seed:demo
 *
 * ⚠️  Do NOT run in production.
 */
'use strict';

const path  = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient } = require('../../src/config/databases');
const bcrypt = require('bcryptjs');

const hash = (pw) => bcrypt.hash(pw, 10);

// ── Admin ──────────────────────────────────────────────────────────────────────
async function demoAdmin() {
  console.log('\n🔧  [admin_db] System settings…');
  const prisma = getPrismaClient('admin');

  const settings = [
    { key: 'maintenance_mode',   value: 'false',               group: 'general',  description: 'Chế độ bảo trì' },
    { key: 'allow_registration', value: 'true',                group: 'general',  description: 'Cho phép đăng ký' },
    { key: 'app_name',           value: 'LKVIP GROUP',        group: 'branding', description: 'Tên ứng dụng' },
    { key: 'support_email',      value: 'support@lkvip.com',   group: 'support',  description: 'Email hỗ trợ' },
    { key: 'support_phone',      value: '1800 xxxx',           group: 'support',  description: 'SĐT hỗ trợ' },
    { key: 'min_deposit',        value: '50000',               group: 'finance',  description: 'Nạp tối thiểu (VND)' },
    { key: 'min_withdraw',       value: '100000',              group: 'finance',  description: 'Rút tối thiểu (VND)' },
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({ where: { key: s.key }, update: {}, create: s }).catch(() => {});
  }
  console.log(`  ✅ ${settings.length} system settings`);
}

// ── Hub ────────────────────────────────────────────────────────────────────────
async function demoHub() {
  console.log('\n📰  [hub_db] Sample news + games…');
  const prisma = getPrismaClient('hub');

  const newsItems = [
    { title: 'LKVIP ra mắt phiên bản mới',         slug: 'lkvip-ra-mat-phien-ban-moi',    content: '<p>LKVIP nâng cấp toàn diện...</p>', status: 'published', type: 'news' },
    { title: 'Top 5 game hot nhất tháng 7/2025',   slug: 'top-5-game-hot-thang-7-2025',   content: '<p>Những game đang hot...</p>',       status: 'published', type: 'news' },
    { title: 'Khuyến mãi sinh nhật LKVIP',         slug: 'khuyen-mai-sinh-nhat-lkvip',    content: '<p>Nhân dịp sinh nhật...</p>',        status: 'published', type: 'news' },
    { title: 'Hướng dẫn đặt cược thể thao',       slug: 'huong-dan-dat-cuoc-the-thao',   content: '<p>Cách đặt cược hiệu quả...</p>',   status: 'published', type: 'news' },
  ];
  for (const n of newsItems) {
    await prisma.news.upsert({ where: { slug: n.slug }, update: {}, create: n }).catch(() => {});
  }
  console.log(`  ✅ ${newsItems.length} news articles`);

  const games = [
    { name: 'GAMEX Casino',  slug: 'gamex-casino',  url: 'https://game.lkvip.com',  icon: '/icons/gamex.png',  description: 'Casino trực tuyến hàng đầu', downloads: '500K+', rating: 4.8, sortOrder: 1, status: 'published' },
    { name: 'VietDating',    slug: 'vietdating',    url: 'https://dating.lkvip.com', icon: '/icons/dating.png', description: 'Hẹn hò & livestream',       downloads: '1M+',   rating: 4.6, sortOrder: 2, status: 'published' },
    { name: 'Sports Live',   slug: 'sports-live',   url: 'https://sports.lkvip.com', icon: '/icons/sports.png', description: 'Xem bóng đá trực tiếp',     downloads: '300K+', rating: 4.7, sortOrder: 3, status: 'published' },
  ];
  for (const g of games) {
    await prisma.game.upsert({ where: { slug: g.slug }, update: {}, create: g }).catch(() => {});
  }
  console.log(`  ✅ ${games.length} hub game entries`);
}

// ── Game ───────────────────────────────────────────────────────────────────────
async function demoGame() {
  console.log('\n🎮  [game_db] Sample users…');
  const prisma = getPrismaClient('game');
  const pwd = await hash('Demo@123456');

  // game.User has inline balance — no separate Wallet model. No kycLevel field.
  const users = [
    { username: 'nguyen_van_a', email: 'nguyen_van_a@demo.com', fullName: 'Nguyễn Văn A' },
    { username: 'tran_thi_b',   email: 'tran_thi_b@demo.com',   fullName: 'Trần Thị B' },
    { username: 'le_van_c',     email: 'le_van_c@demo.com',     fullName: 'Lê Văn C' },
    { username: 'pham_thi_d',   email: 'pham_thi_d@demo.com',   fullName: 'Phạm Thị D' },
    { username: 'hoang_van_e',  email: 'hoang_van_e@demo.com',  fullName: 'Hoàng Văn E' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      // balance is an inline field on game.User — seed with a starting balance
      create: { ...u, password: pwd, role: 'user', status: 'active', balance: Math.floor(Math.random() * 5000000) + 500000 },
    }).catch(() => {});
  }
  console.log(`  ✅ ${users.length} game users`);
}

// ── Dating ─────────────────────────────────────────────────────────────────────
async function demoDating() {
  console.log('\n💕  [dating_db] Sample users…');
  const prisma = getPrismaClient('dating');
  const pwd = await hash('Demo@123456');

  // dating.User has: username, email, fullName, gender, coins, role, status
  // No 'age' field (use birthDate) — no 'isStreamer' field (use Streamer relation)
  const datingUsers = [
    { username: 'lily_nguyen', email: 'lily@demo.com', fullName: 'Lily Nguyễn', gender: 'female' },
    { username: 'rose_tran',   email: 'rose@demo.com', fullName: 'Rose Trần',   gender: 'female' },
    { username: 'anna_pham',   email: 'anna@demo.com', fullName: 'Anna Phạm',   gender: 'female' },
    { username: 'kate_le',     email: 'kate@demo.com', fullName: 'Kate Lê',     gender: 'female' },
    { username: 'minh_nguyen', email: 'minh@demo.com', fullName: 'Minh Nguyễn', gender: 'male'   },
    { username: 'long_tran',   email: 'long@demo.com', fullName: 'Long Trần',   gender: 'male'   },
  ];

  for (const u of datingUsers) {
    await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { ...u, password: pwd, role: 'user', status: 'active', coins: 100 },
    }).catch(() => {});
  }
  console.log(`  ✅ ${datingUsers.length} dating users`);
}

// ── Trade ──────────────────────────────────────────────────────────────────────
async function demoTrade() {
  console.log('\n📈  [trade_db] Sample traders…');
  const prisma = getPrismaClient('trade');
  const pwd = await hash('Demo@123456');

  // trade.User has: email, fullName, role, status, kycStatus — no username/kycLevel
  const traders = [
    { email: 'trader_an@demo.com',    fullName: 'Trader An' },
    { email: 'trader_binh@demo.com',  fullName: 'Trader Bình' },
    { email: 'trader_cuong@demo.com', fullName: 'Trader Cường' },
  ];
  for (const t of traders) {
    const user = await prisma.user.upsert({
      where:  { email: t.email },
      update: {},
      create: { ...t, password: pwd, role: 'user', status: 'active', kycStatus: 'pending' },
    }).catch(() => null);

    if (user) {
      // trade.Wallet is 1-per-user (unique on userId only, no currency composite key)
      await prisma.wallet.upsert({
        where:  { userId: user.id },
        update: {},
        create: { userId: user.id, currency: 'USD', balance: Math.floor(Math.random() * 10000) + 1000 },
      }).catch(() => {});
    }
  }
  console.log(`  ✅ ${traders.length} trade users + wallets`);
  // Note: Markets + Symbols are seeded by trade.seed.js — no duplication here
}

// ── Sports ─────────────────────────────────────────────────────────────────────
async function demoSports() {
  console.log('\n⚽  [sports_db] Sample matches…');
  const prisma = getPrismaClient('sports');

  // Find existing teams to create a sample match
  const manCity = await prisma.team.findUnique({ where: { slug: 'man-city' } }).catch(() => null);
  const arsenal = await prisma.team.findUnique({ where: { slug: 'arsenal' } }).catch(() => null);
  const plLeague = await prisma.league.findUnique({ where: { slug: 'epl' } }).catch(() => null);

  if (manCity && arsenal && plLeague) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);

    await prisma.match.create({
      data: {
        leagueId: plLeague.id, homeTeamId: manCity.id, awayTeamId: arsenal.id,
        startTime: tomorrow, status: 'scheduled', season: '2024/25', round: 'GW15',
      },
    }).catch(() => {});
    console.log('  ✅ Sample match: Man City vs Arsenal');
  } else {
    console.log('  ℹ️  Skipped match — run sports.seed.js first');
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀  Starting DEMO data seed…');
  console.log('    All operations use upsert/create.catch — safe to re-run.\n');
  console.log('⚠️  DO NOT run this in production!\n');

  try { await demoAdmin();  } catch (e) { console.error('  ❌ admin:',   e.message); }
  try { await demoHub();    } catch (e) { console.error('  ❌ hub:',     e.message); }
  try { await demoGame();   } catch (e) { console.error('  ❌ game:',    e.message); }
  try { await demoDating(); } catch (e) { console.error('  ❌ dating:',  e.message); }
  try { await demoTrade();  } catch (e) { console.error('  ❌ trade:',   e.message); }
  try { await demoSports(); } catch (e) { console.error('  ❌ sports:',  e.message); }

  console.log('\n✅  DEMO seed completed!');
  console.log('\n📋  Admin:          admin@lkvip.com / Admin@123456');
  console.log('👤  Game users:     nguyen_van_a…hoang_van_e / Demo@123456');
  console.log('💕  Dating users:   lily_nguyen, rose_tran, anna_pham, kate_le / Demo@123456');
  console.log('📈  Trade traders:  trader_an…trader_cuong / Demo@123456');
  console.log('\n⚠️  Change passwords before any public deployment!');
}

module.exports = { seed: main };

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}
