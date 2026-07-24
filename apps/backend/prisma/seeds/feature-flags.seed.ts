'use strict';
/**
 * prisma/seeds/feature-flags.seed.js — admin_db ProjectConfig
 * Seeds feature flags + payment limits for all 5 sub-projects.
 * Safe to re-run: only updates type/description, never overwrites admin-set values.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient } = require('../../src/config/databases');

const FLAG_CONFIGS = {
  hub: [
    { module: 'feature', group: 'cms',     key: 'news_enabled',         value: true,  type: 'boolean', description: 'Bật tính năng tin tức/blog' },
    { module: 'feature', group: 'cms',     key: 'game_listing_enabled', value: true,  type: 'boolean', description: 'Bật danh sách game' },
    { module: 'feature', group: 'cms',     key: 'banner_max',           value: 10,    type: 'number',  description: 'Số banner tối đa trên trang chủ' },
    { module: 'feature', group: 'cms',     key: 'download_enabled',     value: true,  type: 'boolean', description: 'Bật trang tải app' },
    { module: 'feature', group: 'auth',    key: 'registration_enabled', value: true,  type: 'boolean', description: 'Cho phép đăng ký tài khoản' },
    { module: 'feature', group: 'auth',    key: 'login_enabled',        value: true,  type: 'boolean', description: 'Cho phép đăng nhập' },
    { module: 'feature', group: 'feature', key: 'maintenance_mode',     value: false, type: 'boolean', description: 'Chế độ bảo trì' },
    { module: 'feature', group: 'feature', key: 'dark_mode_enabled',    value: false, type: 'boolean', description: 'Mặc định bật dark mode' },
    { module: 'feature', group: 'feature', key: 'download_app_enabled', value: true,  type: 'boolean', description: 'Hiển thị nút tải app' },
    { module: 'seo',     group: 'seo',     key: 'auto_generate',        value: true,  type: 'boolean', description: 'Tự động tạo meta description' },
  ],
  game: [
    { module: 'payment', group: 'deposit',      key: 'enabled',              value: true,                    type: 'boolean', description: 'Bật nạp tiền' },
    { module: 'payment', group: 'deposit',      key: 'methods',              value: ['bank','usdt','momo'],  type: 'array',   description: 'Phương thức nạp tiền', options: ['bank','usdt','momo','zalopay','okpay'] },
    { module: 'payment', group: 'deposit',      key: 'min_amount',           value: 10000,                   type: 'number',  description: 'Nạp tối thiểu (VND)' },
    { module: 'payment', group: 'deposit',      key: 'max_amount',           value: 50000000,                type: 'number',  description: 'Nạp tối đa (VND)' },
    { module: 'payment', group: 'withdraw',     key: 'enabled',              value: true,                    type: 'boolean', description: 'Bật rút tiền' },
    { module: 'payment', group: 'withdraw',     key: 'methods',              value: ['bank','usdt'],         type: 'array',   description: 'Phương thức rút tiền' },
    { module: 'payment', group: 'withdraw',     key: 'min_amount',           value: 50000,                   type: 'number',  description: 'Rút tối thiểu (VND)' },
    { module: 'payment', group: 'withdraw',     key: 'max_amount',           value: 50000000,                type: 'number',  description: 'Rút tối đa (VND)' },
    { module: 'game',    group: 'slot',         key: 'enabled',              value: true,                    type: 'boolean', description: 'Bật game Slot' },
    { module: 'game',    group: 'lottery',      key: 'pc28_enabled',         value: true,                    type: 'boolean', description: 'Bật xổ số PC28' },
    { module: 'game',    group: 'lottery',      key: 'k3_enabled',           value: true,                    type: 'boolean', description: 'Bật xúc xắc K3' },
    { module: 'game',    group: 'limits',       key: 'max_bet',              value: 10000000,                type: 'number',  description: 'Cược tối đa (VND)' },
    { module: 'game',    group: 'limits',       key: 'min_bet',              value: 10000,                   type: 'number',  description: 'Cược tối thiểu (VND)' },
    { module: 'game_provider', group: 'gsc',    key: 'enabled',              value: true,                    type: 'boolean', description: 'Bật GSC (JILI/PG/PP)' },
    { module: 'game_provider', group: 'goldgate',key: 'enabled',             value: true,                    type: 'boolean', description: 'Bật Goldgate (EVO/Sexy)' },
    { module: 'game_provider', group: 'tcgaming',key: 'enabled',             value: true,                    type: 'boolean', description: 'Bật TC Gaming' },
    { module: 'feature', group: 'vip',          key: 'enabled',              value: true,                    type: 'boolean', description: 'Bật hệ thống VIP' },
    { module: 'feature', group: 'promotion',    key: 'enabled',              value: true,                    type: 'boolean', description: 'Bật khuyến mãi' },
    { module: 'feature', group: 'feature',      key: 'registration_enabled', value: true,                    type: 'boolean', description: 'Cho phép đăng ký' },
    { module: 'feature', group: 'feature',      key: 'maintenance_mode',     value: false,                   type: 'boolean', description: 'Chế độ bảo trì' },
    { module: 'feature', group: 'feature',      key: 'dark_mode_enabled',    value: true,                    type: 'boolean', description: 'Mặc định bật dark mode' },
    { module: 'feature', group: 'feature',      key: 'download_app_enabled', value: true,                    type: 'boolean', description: 'Hiển thị nút tải app' },
    { module: 'system',  group: 'security',     key: 'captcha_enabled',      value: true,                    type: 'boolean', description: 'Bật captcha' },
  ],
  trade: [
    { module: 'payment', group: 'deposit',  key: 'enabled',              value: true,                    type: 'boolean', description: 'Bật nạp tiền' },
    { module: 'payment', group: 'deposit',  key: 'methods',              value: ['bank','usdt'],         type: 'array',   description: 'Phương thức nạp' },
    { module: 'payment', group: 'deposit',  key: 'min_amount',           value: 50,                      type: 'number',  description: 'Nạp tối thiểu (USD)' },
    { module: 'payment', group: 'deposit',  key: 'require_kyc',          value: true,                    type: 'boolean', description: 'Yêu cầu KYC trước khi nạp' },
    { module: 'payment', group: 'withdraw', key: 'enabled',              value: true,                    type: 'boolean', description: 'Bật rút tiền' },
    { module: 'trading', group: 'limits',   key: 'market_enabled',       value: true,                    type: 'boolean', description: 'Bật sàn giao dịch' },
    { module: 'trading', group: 'limits',   key: 'max_leverage',         value: 100,                     type: 'number',  description: 'Đòn bẩy tối đa' },
    { module: 'trading', group: 'symbols',  key: 'enabled_symbols',      value: ['BTC/USDT','ETH/USDT','BNB/USDT','SOL/USDT'], type: 'array', description: 'Cặp giao dịch kích hoạt' },
    { module: 'kyc',     group: 'kyc',      key: 'required',             value: true,                    type: 'boolean', description: 'Bắt buộc KYC để giao dịch' },
    { module: 'feature', group: 'feature',  key: 'registration_enabled', value: true,                    type: 'boolean', description: 'Cho phép đăng ký' },
    { module: 'feature', group: 'feature',  key: 'trading_enabled',      value: true,                    type: 'boolean', description: 'Bật giao dịch' },
    { module: 'feature', group: 'feature',  key: 'maintenance_mode',     value: false,                   type: 'boolean', description: 'Chế độ bảo trì' },
    { module: 'feature', group: 'feature',  key: 'download_app_enabled', value: true,                    type: 'boolean', description: 'Hiển thị nút tải app' },
  ],
  dating: [
    { module: 'payment', group: 'deposit',  key: 'enabled',              value: true,                         type: 'boolean', description: 'Bật nạp tiền/coin' },
    { module: 'payment', group: 'deposit',  key: 'methods',              value: ['bank','momo','zalopay'],    type: 'array',   description: 'Phương thức nạp' },
    { module: 'payment', group: 'deposit',  key: 'min_amount',           value: 10000,                        type: 'number',  description: 'Nạp tối thiểu (VND)' },
    { module: 'feature', group: 'match',    key: 'enabled',              value: true,                         type: 'boolean', description: 'Bật tính năng kết đôi' },
    { module: 'feature', group: 'match',    key: 'max_per_day',          value: 50,                           type: 'number',  description: 'Lượt swipe tối đa/ngày (free)' },
    { module: 'feature', group: 'live',     key: 'enabled',              value: true,                         type: 'boolean', description: 'Bật livestream' },
    { module: 'feature', group: 'gift',     key: 'enabled',              value: true,                         type: 'boolean', description: 'Bật gửi quà' },
    { module: 'feature', group: 'call',     key: 'video_call_enabled',   value: true,                         type: 'boolean', description: 'Bật video call' },
    { module: 'feature', group: 'call',     key: 'call_rate_per_min',    value: 10,                           type: 'number',  description: 'Coin/phút cho cuộc gọi' },
    { module: 'feature', group: 'vip',      key: 'enabled',              value: true,                         type: 'boolean', description: 'Bật gói VIP' },
    { module: 'feature', group: 'feature',  key: 'registration_enabled', value: true,                         type: 'boolean', description: 'Cho phép đăng ký' },
    { module: 'feature', group: 'feature',  key: 'live_streaming_enabled',value: true,                        type: 'boolean', description: 'Bật livestream' },
    { module: 'feature', group: 'feature',  key: 'maintenance_mode',     value: false,                        type: 'boolean', description: 'Chế độ bảo trì' },
    { module: 'feature', group: 'feature',  key: 'download_app_enabled', value: true,                         type: 'boolean', description: 'Hiển thị nút tải app' },
  ],
  sports: [
    { module: 'payment', group: 'deposit',  key: 'enabled',               value: true,                  type: 'boolean', description: 'Bật nạp tiền' },
    { module: 'payment', group: 'deposit',  key: 'methods',               value: ['bank','momo'],       type: 'array',   description: 'Phương thức nạp' },
    { module: 'payment', group: 'withdraw', key: 'enabled',               value: true,                  type: 'boolean', description: 'Bật rút tiền' },
    { module: 'feature', group: 'sports',   key: 'update_interval_sec',   value: 30,                    type: 'number',  description: 'Tần suất cập nhật tỷ số (giây)' },
    { module: 'feature', group: 'betting',  key: 'enabled',               value: true,                  type: 'boolean', description: 'Bật cá cược' },
    { module: 'feature', group: 'betting',  key: 'min_bet',               value: 10000,                 type: 'number',  description: 'Cược tối thiểu (VND)' },
    { module: 'feature', group: 'community',key: 'comments_enabled',      value: true,                  type: 'boolean', description: 'Bật bình luận' },
    { module: 'feature', group: 'feature',  key: 'live_streaming_enabled',value: true,                  type: 'boolean', description: 'Bật phát sóng trực tiếp' },
    { module: 'feature', group: 'feature',  key: 'registration_enabled',  value: true,                  type: 'boolean', description: 'Cho phép đăng ký' },
    { module: 'feature', group: 'feature',  key: 'betting_enabled',       value: true,                  type: 'boolean', description: 'Bật cá cược thể thao' },
    { module: 'feature', group: 'feature',  key: 'maintenance_mode',      value: false,                 type: 'boolean', description: 'Chế độ bảo trì' },
    { module: 'feature', group: 'feature',  key: 'dark_mode_enabled',     value: true,                  type: 'boolean', description: 'Mặc định bật dark mode' },
    { module: 'feature', group: 'feature',  key: 'download_app_enabled',  value: true,                  type: 'boolean', description: 'Hiển thị nút tải app' },
  ],
};

async function seed() {
  const prisma = getPrismaClient('admin');
  let total = 0;

  for (const [projectCode, configs] of Object.entries(FLAG_CONFIGS)) {
    for (const cfg of configs) {
      await prisma.projectConfig.upsert({
        where: { projectCode_module_group_key: {
          projectCode, module: cfg.module, group: cfg.group, key: cfg.key,
        }},
        create: { projectCode, module: cfg.module, group: cfg.group, key: cfg.key, value: cfg.value, type: cfg.type, options: cfg.options ?? null, description: cfg.description, isSecret: false, editable: true, status: 'active' },
        update: { type: cfg.type, description: cfg.description, ...(cfg.options !== undefined && { options: cfg.options }) },
      });
      total++;
    }
    console.log(`  [${projectCode}] ${configs.length} feature flags`);
  }
  console.log(`  Total: ${total} records`);
}

module.exports = { seed, FLAG_CONFIGS };

if (require.main === module) {
  seed().catch(e => { console.error(e); process.exit(1); });
}
