'use strict';
/**
 * prisma/seeds/admin.seed.ts — Admin DB seed
 * Creates: AdminUser, User, Wallet, Projects, ProjectConfigs, PaymentGateways,
 *          VipConfig, RebateRule, NotificationTemplate, CronJob seeds
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient, disconnectAll } = require('../../src/config/databases');
const bcrypt = require('bcryptjs');

const prisma = getPrismaClient('admin');

async function seed() {
  // ── 1. AdminUser ──────────────────────────────────────────────────
  const adminPwd = await bcrypt.hash(
    process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456', 12,
  );

  const adminUser = await prisma.adminUser.upsert({
    where:  { email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@lkvip.com' },
    update: {},
    create: {
      username: 'superadmin',
      email:    process.env.ADMIN_DEFAULT_EMAIL || 'admin@lkvip.com',
      password: adminPwd,
      fullName: 'Super Admin',
      role:     'super_admin',
      status:   'active',
    },
  });
  console.log(`  AdminUser: ${adminUser.id} <${adminUser.email}>`);

  // ── 2. User (shared player account) ──────────────────────────────
  const userPwd = await bcrypt.hash('Admin@123456', 12);
  const user = await prisma.user.upsert({
    where:  { email: 'admin@lkvip.com' },
    update: {},
    create: {
      email:    'admin@lkvip.com',
      password: userPwd,
      fullName: 'Super Admin',
      role:     'super_admin',
      status:   'active',
      kycLevel: 'verified',
    },
  });
  console.log(`  User:      ${user.id} <${user.email}>`);

  // ── 3. Wallet ─────────────────────────────────────────────────────
  await prisma.wallet.upsert({
    where:  { userId_currency: { userId: user.id, currency: 'VND' } },
    update: {},
    create: { userId: user.id, currency: 'VND', balance: 0 },
  }).catch(() => {});

  // ── 4. Projects ───────────────────────────────────────────────────
  const projects = [
    { code: 'hub',    name: 'LKVIP Hub',    description: 'Cổng thông tin giải trí' },
    { code: 'game',   name: 'LKVIP Game',   description: 'Nền tảng game trực tuyến' },
    { code: 'trade',  name: 'LKVIP Trade',  description: 'Sàn giao dịch tài chính' },
    { code: 'dating', name: 'LKVIP Dating', description: 'Mạng xã hội kết bạn hẹn hò' },
    { code: 'sports', name: 'LKVIP Sports', description: 'Tin tức & phát sóng thể thao' },
  ];
  for (const p of projects) {
    await prisma.project.upsert({
      where:  { code: p.code },
      update: {},
      create: { ...p, status: 'active' },
    });
  }
  console.log(`  Projects:  ${projects.map(p => p.code).join(', ')}`);

  // ── 5. ProjectConfig ──────────────────────────────────────────────
  const configs = [
    { projectCode: 'game', module: 'payment',       group: 'gateway',  key: 'active_gateway',  value: '"bank"', type: 'select',  description: 'Cổng thanh toán mặc định' },
    { projectCode: 'game', module: 'payment',       group: 'gateway',  key: 'bank_enabled',    value: true,     type: 'boolean', description: 'Bật thanh toán ngân hàng' },
    { projectCode: 'game', module: 'game_provider', group: 'tcgaming', key: 'enabled',         value: true,     type: 'boolean', description: 'Bật TC Gaming' },
    { projectCode: 'game', module: 'system',        group: 'security', key: 'captcha_enabled', value: true,     type: 'boolean', description: 'Bật captcha' },
    { projectCode: 'hub',  module: 'general',       group: 'brand',    key: 'site_name',       value: '"LKVIP Hub"', type: 'string', description: 'Tên website' },
    { projectCode: 'hub',  module: 'general',       group: 'brand',    key: 'primary_color',   value: '"#1e40af"', type: 'string', description: 'Màu chính' },
    { projectCode: 'trade',module: 'trading',       group: 'limits',   key: 'max_leverage',    value: 100,      type: 'number',  description: 'Đòn bẩy tối đa' },
    { projectCode: 'trade',module: 'trading',       group: 'limits',   key: 'min_deposit',     value: 50,       type: 'number',  description: 'Nạp tối thiểu (USD)' },
    { projectCode: 'dating',module:'general',       group: 'coins',    key: 'call_rate',       value: 10,       type: 'number',  description: 'Coin/phút cho cuộc gọi' },
    { projectCode: 'dating',module:'general',       group: 'coins',    key: 'super_like_cost', value: 5,        type: 'number',  description: 'Coin cho super like' },
    { projectCode: 'sports',module:'general',       group: 'livestream',key:'max_viewers',     value: 10000,    type: 'number',  description: 'Số người xem tối đa' },
  ];
  for (const cfg of configs) {
    await prisma.projectConfig.upsert({
      where: { projectCode_module_group_key: {
        projectCode: cfg.projectCode, module: cfg.module, group: cfg.group, key: cfg.key,
      }},
      update: {},
      create: { ...cfg, isSecret: false, editable: true, status: 'active' },
    });
  }
  console.log(`  ProjectConfigs: ${configs.length}`);

  // ── 6. PaymentGateway ─────────────────────────────────────────────
  const gateways = [
    { code: 'BANK',       name: 'Chuyển khoản ngân hàng', config: { banks: ['Vietcombank','Sacombank','MBBank','Techcombank'] }, status: 'active' },
    { code: 'USDT_TRC20', name: 'USDT (TRC20)',            config: { network: 'TRC20' },              status: 'active' },
    { code: 'MOMO',       name: 'MoMo',                    config: { partnerCode: 'MOMOBKUN20180529' },status: 'active' },
    { code: 'ZALOPAY',    name: 'ZaloPay',                  config: { appId: '2553' },                 status: 'inactive' },
  ];
  for (const gw of gateways) {
    await prisma.paymentGateway.upsert({
      where:  { code: gw.code },
      update: {},
      create: gw,
    });
  }
  console.log(`  PaymentGateways: ${gateways.map(g => g.code).join(', ')}`);

  // ── 7. VipConfig ──────────────────────────────────────────────────
  const vipLevels = [
    { level: 0, name: 'Member', betRequired: 0,          rewardAmount: 0,       color: '#888888' },
    { level: 1, name: 'V1',     betRequired: 100000,     rewardAmount: 10000,   color: '#00B894' },
    { level: 2, name: 'V2',     betRequired: 1400000,    rewardAmount: 54200,   color: '#00CEC9' },
    { level: 3, name: 'V3',     betRequired: 5000000,    rewardAmount: 200000,  color: '#0984E3' },
    { level: 4, name: 'V4',     betRequired: 15000000,   rewardAmount: 600000,  color: '#6C5CE7' },
    { level: 5, name: 'V5',     betRequired: 50000000,   rewardAmount: 2000000, color: '#FD79A8' },
    { level: 6, name: 'V6',     betRequired: 150000000,  rewardAmount: 6000000, color: '#E17055' },
    { level: 7, name: 'V7',     betRequired: 500000000,  rewardAmount: 20000000,color: '#FDCB6E' },
    { level: 8, name: 'V8',     betRequired: 1500000000, rewardAmount: 60000000,color: '#F9CA24' },
    { level: 9, name: 'V9',     betRequired: 5000000000, rewardAmount: 200000000, color: '#FF9FF3' },
  ];
  for (const v of vipLevels) {
    await prisma.vipConfig.upsert({
      where:  { level: v.level },
      update: {},
      create: { ...v, status: 'active' },
    });
  }
  console.log(`  VipConfigs: ${vipLevels.length} levels`);

  // ── 8. RebateRule (default rules per project) ──────────────────────
  const rebateRules = [
    { name: 'Game — Rebate mặc định (Lottery)',   gameType: 'lottery', rebateRate: 0.005,  minBet: 10000, period: 'daily',   project: 'game',   status: 'active', sortOrder: 1 },
    { name: 'Game — Rebate slot',                  gameType: 'slot',    rebateRate: 0.003,  minBet: 10000, period: 'daily',   project: 'game',   status: 'active', sortOrder: 2 },
    { name: 'Game — Rebate live casino',           gameType: 'live',    rebateRate: 0.004,  minBet: 50000, period: 'daily',   project: 'game',   status: 'active', sortOrder: 3 },
    { name: 'Game — Rebate tuần (tất cả loại)',    gameType: null,      rebateRate: 0.006,  minBet: 100000,period: 'weekly',  project: 'game',   status: 'active', sortOrder: 4 },
    { name: 'Sports — Rebate cược thể thao',       gameType: 'sports',  rebateRate: 0.004,  minBet: 20000, period: 'daily',   project: 'sports', status: 'active', sortOrder: 5 },
    { name: 'Trade — Rebate giao dịch',            gameType: 'trade',   rebateRate: 0.002,  minBet: 100000,period: 'monthly', project: 'trade',  status: 'active', sortOrder: 6 },
  ];
  let rebateCount = 0;
  for (const rule of rebateRules) {
    const existing = await prisma.rebateRule.findFirst({
      where: { name: rule.name, project: rule.project },
    });
    if (!existing) {
      await prisma.rebateRule.create({ data: rule });
      rebateCount++;
    }
  }
  console.log(`  RebateRules: ${rebateRules.length} (${rebateCount} created)`);

  // ── 9. System Configs (key-value defaults) ─────────────────────────
  const sysConfigs = [
    { key: 'maintenance_mode',    value: 'false', group: 'system',  description: 'Chế độ bảo trì toàn hệ thống' },
    { key: 'internal_loan_rate',  value: '0.0003',group: 'finance', description: 'Lãi suất vay nội bộ mặc định (mỗi ngày)' },
    { key: 'vip_rebate_bonus',    value: '1.2',   group: 'game',    description: 'Hệ số nhân rebate cho VIP 5+' },
    { key: 'max_withdraw_daily',  value: '100000000', group: 'payment', description: 'Hạn mức rút tối đa/ngày (VND)' },
    { key: 'min_deposit',         value: '50000', group: 'payment', description: 'Nạp tối thiểu (VND)' },
    { key: 'reg_require_referral',value: 'false', group: 'general', description: 'Bắt buộc mã giới thiệu khi đăng ký' },
    { key: 'reg_bonus_amount',    value: '0',     group: 'general', description: 'Thưởng đăng ký mới (VND)' },
  ];
  for (const cfg of sysConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: cfg,
    }).catch(() => {});
  }
  console.log(`  SystemConfigs: ${sysConfigs.length}`);
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .catch(e => { console.error('[seed:admin] ❌', e); process.exit(1); })
    .finally(() => disconnectAll());
}
