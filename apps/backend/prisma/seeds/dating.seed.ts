'use strict';
/**
 * prisma/seeds/dating.seed.js — Dating DB seed
 * Creates: VipPlan, Gift
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient, disconnectAll } = require('../../src/config/databases');
const prisma = getPrismaClient('dating');

async function seed() {
  // ── 1. VIP Plans ──────────────────────────────────────────────────
  const vipPlans = [
    { name: 'Gói Bạc 7 Ngày',       duration: 7,  price: 79000,  coinBonus: 50,  features: { unlimitedLikes: true, superLikes: 5,  profileBoost: 1,  seeWhoLikedYou: false }, sortOrder: 1, status: 'active' },
    { name: 'Gói Vàng 30 Ngày',      duration: 30, price: 249000, coinBonus: 200, features: { unlimitedLikes: true, superLikes: 20, profileBoost: 5,  seeWhoLikedYou: true,  priorityMatch: true }, sortOrder: 2, status: 'active' },
    { name: 'Gói Kim Cương 90 Ngày', duration: 90, price: 599000, coinBonus: 700, features: { unlimitedLikes: true, superLikes: 60, profileBoost: 15, seeWhoLikedYou: true,  priorityMatch: true, verifiedBadge: true, videoCallDiscount: 20 }, sortOrder: 3, status: 'active' },
  ];
  for (const plan of vipPlans) {
    const existing = await prisma.vipPlan.findFirst({ where: { name: plan.name } });
    if (!existing) await prisma.vipPlan.create({ data: plan });
  }
  console.log(`  VipPlans: ${vipPlans.length}`);

  // ── 2. Gifts ──────────────────────────────────────────────────────
  const gifts = [
    { name: 'Hoa Hồng',         icon: '/gifts/rose.png',      coinCost: 10,   category: 'normal',  sortOrder: 1 },
    { name: 'Trái Tim',         icon: '/gifts/heart.png',     coinCost: 20,   category: 'normal',  sortOrder: 2 },
    { name: 'Gấu Bông',         icon: '/gifts/teddy.png',     coinCost: 50,   category: 'normal',  sortOrder: 3 },
    { name: 'Nhẫn Kim Cương',   icon: '/gifts/ring.png',      coinCost: 200,  category: 'special', sortOrder: 4 },
    { name: 'Pháo Hoa',         icon: '/gifts/firework.png',  coinCost: 100,  category: 'special', sortOrder: 5 },
    { name: 'Siêu Xe',          icon: '/gifts/supercar.png',  coinCost: 500,  category: 'vip',     sortOrder: 6 },
    { name: 'Du Thuyền',        icon: '/gifts/yacht.png',     coinCost: 1000, category: 'vip',     sortOrder: 7 },
  ];
  for (const gift of gifts) {
    const existing = await prisma.gift.findFirst({ where: { name: gift.name } });
    if (!existing) await prisma.gift.create({ data: { ...gift, status: 'active' } });
  }
  console.log(`  Gifts: ${gifts.length}`);

  // ── 3. Dating Missions ────────────────────────────────────────────
  const missions = [
    { slug: 'daily_checkin', title: 'Điểm danh hàng ngày',   description: 'Nhận 10 xu khi điểm danh',            reward: 10, type: 'daily',    targetCount: 1, icon: '📅', sortOrder: 1, status: 'active' },
    { slug: 'send_gift',     title: 'Gửi quà cho ai đó',     description: 'Gửi 1 quà và nhận 5 xu',               reward: 5,  type: 'daily',    targetCount: 1, icon: '🎁', sortOrder: 2, status: 'active' },
    { slug: 'swipe_10',      title: 'Lướt 10 hồ sơ',         description: 'Thích/bỏ qua 10 hồ sơ nhận 5 xu',      reward: 5,  type: 'daily',    targetCount: 10, icon: '👆', sortOrder: 3, status: 'active' },
    { slug: 'complete_profile', title: 'Hoàn thiện hồ sơ',   description: 'Điền đầy đủ thông tin cá nhân',         reward: 50, type: 'one_time', targetCount: 1, icon: '👤', sortOrder: 4, status: 'active' },
    { slug: 'first_match',   title: 'Ghép đôi đầu tiên',     description: 'Tạo 1 cặp đôi thành công',              reward: 20, type: 'one_time', targetCount: 1, icon: '💞', sortOrder: 5, status: 'active' },
    { slug: 'send_message',  title: 'Nhắn tin hàng ngày',    description: 'Gửi 5 tin nhắn nhận 5 xu',              reward: 5,  type: 'daily',    targetCount: 5, icon: '💬', sortOrder: 6, status: 'active' },
    { slug: 'weekly_active', title: 'Hoạt động cả tuần',     description: 'Điểm danh 7 ngày liên tiếp nhận 100 xu',reward: 100,type: 'weekly',   targetCount: 7, icon: '🔥', sortOrder: 7, status: 'active' },
  ];
  for (const m of missions) {
    const existing = await prisma.datingMission.findUnique({ where: { slug: m.slug } });
    if (!existing) await prisma.datingMission.create({ data: m });
  }
  console.log(`  DatingMissions: ${missions.length}`);

  // ── 4. Dating Events ──────────────────────────────────────────────
  const now = new Date();
  const events = [
    {
      title:       'Tuần Lễ Valentine',
      description: 'Nhân đôi xu khi gửi quà trong tuần Valentine',
      type:        'holiday',
      banner:      '/events/valentine.png',
      startsAt:    new Date(now.getFullYear(), 1, 10),
      endsAt:      new Date(now.getFullYear(), 1, 16),
      isActive:    true,
      metadata:    { coinMultiplier: 2, giftDiscount: 10 },
    },
  ];
  for (const evt of events) {
    const existing = await prisma.datingEvent.findFirst({ where: { title: evt.title } });
    if (!existing) await prisma.datingEvent.create({ data: evt });
  }
  console.log(`  DatingEvents: ${events.length}`);
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .catch(e => { console.error('[seed:dating] ❌', e); process.exit(1); })
    .finally(() => disconnectAll());
}
