'use strict';
/**
 * prisma/seeds/hub.seed.js — Hub DB seed
 * Creates: Category, Banner, Page, Setting
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient } = require('../../src/config/databases');
const prisma = getPrismaClient('hub');

async function seed() {
  // ── 1. Categories ─────────────────────────────────────────────────
  const categories = [
    { name: 'Game Hot',  slug: 'game-hot',  type: 'game',    sortOrder: 1 },
    { name: 'Game Mới',  slug: 'game-moi',  type: 'game',    sortOrder: 2 },
    { name: 'Website',   slug: 'website',   type: 'website', sortOrder: 3 },
    { name: 'Công cụ',   slug: 'cong-cu',   type: 'tool',    sortOrder: 4 },
    { name: 'Tin tức',   slug: 'tin-tuc',   type: 'news',    sortOrder: 5 },
    { name: 'Sự kiện',   slug: 'su-kien',   type: 'event',   sortOrder: 6 },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: {},
      create: { ...cat, status: 'active' },
    });
  }
  console.log(`  Categories: ${categories.length}`);

  // ── 2. Banners ────────────────────────────────────────────────────
  await prisma.banner.deleteMany({ where: { position: 'home' } }).catch(() => {});
  const banners = [
    { title: 'Chào mừng đến với LKVIP Hub', imageDesktop: '/banners/banner1_desktop.jpg', imageMobile: '/banners/banner1_mobile.jpg', link: '/games',      position: 'home', type: 'slider', sortOrder: 1, status: 'active' },
    { title: 'Khuyến mãi đặc biệt',       imageDesktop: '/banners/banner2_desktop.jpg', imageMobile: '/banners/banner2_mobile.jpg', link: '/promotions', position: 'home', type: 'slider', sortOrder: 2, status: 'active' },
  ];
  await prisma.banner.createMany({ data: banners });
  console.log(`  Banners: ${banners.length}`);

  // ── 3. Pages ──────────────────────────────────────────────────────
  const pages = [
    { slug: 'about',   title: 'Giới thiệu',          content: '<h1>Giới thiệu về LKVIP Hub</h1><p>Nội dung...</p>',      status: 'published' },
    { slug: 'policy',  title: 'Chính sách bảo mật',  content: '<h1>Chính sách bảo mật</h1><p>Nội dung...</p>',         status: 'published' },
    { slug: 'terms',   title: 'Điều khoản sử dụng',  content: '<h1>Điều khoản sử dụng</h1><p>Nội dung...</p>',         status: 'published' },
    { slug: 'contact', title: 'Liên hệ',             content: '<h1>Liên hệ</h1><p>Email: support@kjchub.com</p>',       status: 'published' },
  ];
  for (const pg of pages) {
    await prisma.page.upsert({ where: { slug: pg.slug }, update: {}, create: pg });
  }
  console.log(`  Pages: ${pages.length}`);

  // ── 4. Settings ───────────────────────────────────────────────────
  const settings = [
    { key: 'site_name',      value: 'LKVIP Hub',          group: 'general' },
    { key: 'site_email',     value: 'info@kjchub.com',  group: 'general' },
    { key: 'items_per_page', value: '20',               group: 'general' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log(`  Settings: ${settings.length}`);
}

module.exports = { seed };

if (require.main === module) {
  const { disconnectAll } = require('../../src/config/databases');
  seed()
    .catch(e => { console.error('[seed:hub] ❌', e); process.exit(1); })
    .finally(() => disconnectAll());
}
