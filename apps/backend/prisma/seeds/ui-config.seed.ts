'use strict';
/**
 * prisma/seeds/ui-config.seed.js — admin_db ProjectConfig (branding/UI)
 * + AppCatalog entries for each sub-project app.
 * Safe to re-run: only updates metadata, never overwrites admin-customised values.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient } = require('../../src/config/databases');

const PROJECT_UI_CONFIGS = {
  hub: [
    { module: 'general', group: 'brand',  key: 'site_name',       value: 'LKVIP Hub',                    type: 'string', description: 'Tên trang web' },
    { module: 'general', group: 'brand',  key: 'site_slogan',     value: 'Cổng thông tin giải trí',    type: 'string', description: 'Slogan' },
    { module: 'general', group: 'brand',  key: 'logo_url',        value: '/assets/gif/header-logo.gif',type: 'image',  description: 'Logo URL' },
    { module: 'general', group: 'brand',  key: 'favicon_url',     value: '/favicon.ico',               type: 'image',  description: 'Favicon URL' },
    { module: 'general', group: 'brand',  key: 'copyright_text',  value: '© 2025 LKVIP Hub',             type: 'string', description: 'Copyright' },
    { module: 'general', group: 'colors', key: 'primary_color',   value: '#1e40af',                    type: 'string', description: 'Màu chính' },
    { module: 'general', group: 'colors', key: 'secondary_color', value: '#4338ca',                    type: 'string', description: 'Màu phụ' },
    { module: 'general', group: 'colors', key: 'accent_color',    value: '#f59e0b',                    type: 'string', description: 'Màu nhấn' },
    { module: 'social',  group: 'social', key: 'facebook_url',    value: '',                           type: 'string', description: 'Facebook URL' },
    { module: 'social',  group: 'social', key: 'telegram_url',    value: '',                           type: 'string', description: 'Telegram URL' },
    { module: 'social',  group: 'social', key: 'zalo_url',        value: '',                           type: 'string', description: 'Zalo URL' },
    { module: 'social',  group: 'social', key: 'hotline',         value: '',                           type: 'string', description: 'Hotline' },
    { module: 'feature', group: 'feature',key: 'registration_enabled', value: true,                    type: 'boolean',description: 'Cho phép đăng ký' },
    { module: 'feature', group: 'feature',key: 'dark_mode_enabled',    value: false,                   type: 'boolean',description: 'Bật dark mode mặc định' },
    { module: 'feature', group: 'feature',key: 'maintenance_mode',     value: false,                   type: 'boolean',description: 'Chế độ bảo trì' },
    { module: 'feature', group: 'feature',key: 'download_app_enabled', value: true,                    type: 'boolean',description: 'Hiển thị nút tải app' },
  ],
  game: [
    { module: 'general', group: 'brand',  key: 'site_name',       value: 'GameX',                      type: 'string', description: 'Tên trang web' },
    { module: 'general', group: 'brand',  key: 'site_slogan',     value: 'Sòng bạc & Game trực tuyến', type: 'string', description: 'Slogan' },
    { module: 'general', group: 'brand',  key: 'logo_url',        value: '/images/logo.png',           type: 'image',  description: 'Logo URL' },
    { module: 'general', group: 'brand',  key: 'copyright_text',  value: '© 2025 GameX Platform',     type: 'string', description: 'Copyright' },
    { module: 'general', group: 'colors', key: 'primary_color',   value: '#7c3aed',                    type: 'string', description: 'Màu chính' },
    { module: 'general', group: 'colors', key: 'secondary_color', value: '#6d28d9',                    type: 'string', description: 'Màu phụ' },
    { module: 'general', group: 'colors', key: 'accent_color',    value: '#f59e0b',                    type: 'string', description: 'Màu nhấn' },
    { module: 'social',  group: 'social', key: 'facebook_url',    value: '',  type: 'string', description: 'Facebook URL' },
    { module: 'social',  group: 'social', key: 'telegram_url',    value: '',  type: 'string', description: 'Telegram URL' },
    { module: 'social',  group: 'social', key: 'hotline',         value: '',  type: 'string', description: 'Hotline' },
    { module: 'feature', group: 'feature',key: 'registration_enabled', value: true,  type: 'boolean', description: 'Cho phép đăng ký' },
    { module: 'feature', group: 'feature',key: 'dark_mode_enabled',    value: true,  type: 'boolean', description: 'Bật dark mode mặc định' },
    { module: 'feature', group: 'feature',key: 'maintenance_mode',     value: false, type: 'boolean', description: 'Chế độ bảo trì' },
    { module: 'feature', group: 'feature',key: 'download_app_enabled', value: true,  type: 'boolean', description: 'Hiển thị nút tải app' },
  ],
  dating: [
    { module: 'general', group: 'brand',  key: 'site_name',       value: 'VietDating',                 type: 'string', description: 'Tên trang web' },
    { module: 'general', group: 'brand',  key: 'site_slogan',     value: 'Hẹn hò & Kết đôi',          type: 'string', description: 'Slogan' },
    { module: 'general', group: 'brand',  key: 'logo_url',        value: '/images/login/login_logo.png',type: 'image', description: 'Logo URL' },
    { module: 'general', group: 'brand',  key: 'copyright_text',  value: '© 2025 VietDating',         type: 'string', description: 'Copyright' },
    { module: 'general', group: 'colors', key: 'primary_color',   value: '#ec4899',                    type: 'string', description: 'Màu chính (pink)' },
    { module: 'general', group: 'colors', key: 'secondary_color', value: '#f43f5e',                    type: 'string', description: 'Màu phụ' },
    { module: 'social',  group: 'social', key: 'facebook_url',    value: '',  type: 'string', description: 'Facebook URL' },
    { module: 'social',  group: 'social', key: 'telegram_url',    value: '',  type: 'string', description: 'Telegram URL' },
    { module: 'social',  group: 'social', key: 'hotline',         value: '',  type: 'string', description: 'Hotline' },
    { module: 'feature', group: 'feature',key: 'registration_enabled',  value: true,  type: 'boolean', description: 'Cho phép đăng ký' },
    { module: 'feature', group: 'feature',key: 'maintenance_mode',      value: false, type: 'boolean', description: 'Chế độ bảo trì' },
    { module: 'feature', group: 'feature',key: 'download_app_enabled',  value: true,  type: 'boolean', description: 'Hiển thị nút tải app' },
    { module: 'feature', group: 'feature',key: 'live_streaming_enabled',value: true,  type: 'boolean', description: 'Bật tính năng livestream' },
  ],
  sports: [
    { module: 'general', group: 'brand',  key: 'site_name',       value: 'Sports Live',                type: 'string', description: 'Tên trang web' },
    { module: 'general', group: 'brand',  key: 'site_slogan',     value: 'Cá cược & Thể thao trực tiếp',type: 'string',description: 'Slogan' },
    { module: 'general', group: 'brand',  key: 'logo_url',        value: '/images/logo.png',           type: 'image',  description: 'Logo URL' },
    { module: 'general', group: 'brand',  key: 'copyright_text',  value: '© 2025 Sports Live',        type: 'string', description: 'Copyright' },
    { module: 'general', group: 'colors', key: 'primary_color',   value: '#16a34a',                    type: 'string', description: 'Màu chính (green)' },
    { module: 'general', group: 'colors', key: 'secondary_color', value: '#15803d',                    type: 'string', description: 'Màu phụ' },
    { module: 'social',  group: 'social', key: 'facebook_url',    value: '',  type: 'string', description: 'Facebook URL' },
    { module: 'social',  group: 'social', key: 'telegram_url',    value: '',  type: 'string', description: 'Telegram URL' },
    { module: 'feature', group: 'feature',key: 'registration_enabled',  value: true,  type: 'boolean', description: 'Cho phép đăng ký' },
    { module: 'feature', group: 'feature',key: 'dark_mode_enabled',     value: true,  type: 'boolean', description: 'Bật dark mode mặc định' },
    { module: 'feature', group: 'feature',key: 'maintenance_mode',      value: false, type: 'boolean', description: 'Chế độ bảo trì' },
    { module: 'feature', group: 'feature',key: 'betting_enabled',       value: true,  type: 'boolean', description: 'Bật cá cược' },
    { module: 'feature', group: 'feature',key: 'live_streaming_enabled',value: true,  type: 'boolean', description: 'Bật phát sóng trực tiếp' },
    { module: 'feature', group: 'feature',key: 'download_app_enabled',  value: true,  type: 'boolean', description: 'Hiển thị nút tải app' },
  ],
  trade: [
    { module: 'general', group: 'brand',  key: 'site_name',       value: 'Trade Pro',                  type: 'string', description: 'Tên trang web' },
    { module: 'general', group: 'brand',  key: 'site_slogan',     value: 'Sàn giao dịch tài chính',   type: 'string', description: 'Slogan' },
    { module: 'general', group: 'brand',  key: 'logo_url',        value: '/images/logo.png',           type: 'image',  description: 'Logo URL' },
    { module: 'general', group: 'brand',  key: 'copyright_text',  value: '© 2025 Trade Pro',          type: 'string', description: 'Copyright' },
    { module: 'general', group: 'colors', key: 'primary_color',   value: '#2563eb',                    type: 'string', description: 'Màu chính (blue)' },
    { module: 'general', group: 'colors', key: 'secondary_color', value: '#1d4ed8',                    type: 'string', description: 'Màu phụ' },
    { module: 'social',  group: 'social', key: 'facebook_url',    value: '',  type: 'string', description: 'Facebook URL' },
    { module: 'social',  group: 'social', key: 'telegram_url',    value: '',  type: 'string', description: 'Telegram URL' },
    { module: 'feature', group: 'feature',key: 'registration_enabled', value: true,  type: 'boolean', description: 'Cho phép đăng ký' },
    { module: 'feature', group: 'feature',key: 'maintenance_mode',     value: false, type: 'boolean', description: 'Chế độ bảo trì' },
    { module: 'feature', group: 'feature',key: 'download_app_enabled', value: true,  type: 'boolean', description: 'Hiển thị nút tải app' },
    { module: 'feature', group: 'feature',key: 'trading_enabled',      value: true,  type: 'boolean', description: 'Bật giao dịch' },
  ],
};

const APP_CATALOG_SEED = [
  { appId: 'game',   name: 'GAMEX',      developer: 'GAMEX Entertainment',        category: 'Giải trí · 18+',        iconUrl: '/icons/icon-192.png',  primaryColor: '#194C38', rating: 4.6, reviewsCount: '12.5 N', downloads: '500 N+', androidLink: 'https://tc-gaming.live/downloads/gamex.apk',       iosLink: 'itms-services://?action=download-manifest&url=https://tc-gaming.live/ios/gamex.plist',       description: 'Hệ thống giải trí trực tuyến hàng đầu Việt Nam.', features: ['🎰 Slots 1000+ game','🃏 Casino trực tiếp','⚽ Cá cược thể thao','💳 Nạp/Rút tức thì'], isPublished: true, sortOrder: 1 },
  { appId: 'dating', name: 'AppLive18',  developer: 'AppLive18 Entertainment',    category: 'Hẹn hò · Social',       iconUrl: '/icons/app-icon.svg',  primaryColor: '#ec4899', rating: 4.5, reviewsCount: '23 N',   downloads: '1 Tr+',  androidLink: 'https://tc-gaming.live/downloads/applive18.apk',   iosLink: 'itms-services://?action=download-manifest&url=https://tc-gaming.live/ios/applive18-manifest.plist', description: 'Nền tảng hẹn hò và livestream hàng đầu Việt Nam.', features: ['💘 Swipe & Kết đôi','📺 Live Stream','💬 Chat & Video Call','👑 VIP'], isPublished: true, sortOrder: 2 },
  { appId: 'sports', name: 'Sports Live',developer: 'Sports Live Entertainment',  category: 'Thể thao · Tin tức',    iconUrl: '/icons/app-icon.svg',  primaryColor: '#16a34a', rating: 4.7, reviewsCount: '8.2 N',  downloads: '200 N+', androidLink: 'https://tc-gaming.live/downloads/sports.apk',      iosLink: 'itms-services://?action=download-manifest&url=https://tc-gaming.live/ios/sports-manifest.plist',   description: 'Xem bóng đá trực tiếp, tỷ số & livestream HD.',   features: ['⚽ Tỷ số trực tiếp 24/7','📺 Livestream HD','🏆 400+ giải đấu','🔔 Thông báo bàn thắng'], isPublished: true, sortOrder: 3 },
  { appId: 'trade',  name: 'Trade Pro',  developer: 'Trade Pro Exchange',         category: 'Tài chính · Đầu tư',    iconUrl: '/icons/app-icon.svg',  primaryColor: '#3b82f6', rating: 4.4, reviewsCount: '5.6 N',  downloads: '100 N+', androidLink: 'https://tc-gaming.live/downloads/tradepro.apk',    iosLink: 'itms-services://?action=download-manifest&url=https://tc-gaming.live/ios/tradepro-manifest.plist',  description: 'Giao dịch chứng khoán & Crypto chuyên nghiệp.',   features: ['📈 Biểu đồ realtime','🔔 Cảnh báo giá','💼 Quản lý danh mục','🔒 Bảo mật 2FA'], isPublished: true, sortOrder: 4 },
];

async function seed() {
  const prisma = getPrismaClient('admin');
  let total = 0;

  for (const [projectCode, configs] of Object.entries(PROJECT_UI_CONFIGS)) {
    for (const cfg of configs) {
      await prisma.projectConfig.upsert({
        where: { projectCode_module_group_key: {
          projectCode, module: cfg.module, group: cfg.group, key: cfg.key,
        }},
        create: { projectCode, module: cfg.module, group: cfg.group, key: cfg.key, value: cfg.value, type: cfg.type, description: cfg.description, isSecret: false, editable: true, status: 'active' },
        update: { type: cfg.type, description: cfg.description },
      });
      total++;
    }
    console.log(`  [${projectCode}] ${configs.length} UI configs`);
  }

  let catalogTotal = 0;
  for (const entry of APP_CATALOG_SEED) {
    await prisma.appCatalog.upsert({
      where:  { appId: entry.appId },
      create: entry,
      update: { androidLink: entry.androidLink, iosLink: entry.iosLink, category: entry.category, primaryColor: entry.primaryColor, features: entry.features, sortOrder: entry.sortOrder },
    });
    catalogTotal++;
  }
  console.log(`  AppCatalog: ${catalogTotal} entries`);
  console.log(`  Total: ${total} ProjectConfig + ${catalogTotal} AppCatalog`);
}

module.exports = { PROJECT_UI_CONFIGS, APP_CATALOG_SEED, seed };

if (require.main === module) {
  seed().catch(e => { console.error(e); process.exit(1); });
}
