'use strict';
/**
 * prisma/seeds/test-users.seed.ts — Test user accounts for all 6 databases
 *
 * Creates one dedicated test user per project for QA and manual testing.
 * All accounts are idempotent (upsert by email / username).
 *
 * Databases seeded:
 *   admin  — AdminUser (admin panel login) + shared User row
 *   game   — User + DepositOrder (starter balance via balance field)
 *   hub    — User
 *   trade  — User + Wallet (USDT)
 *   dating — User
 *   sports — User
 *
 * Usage:
 *   pnpm --filter backend seed:test-users
 *
 * Default passwords (all accounts):
 *   admin panel : Test@Admin123
 *   sub-projects: Test@User123
 */

const path   = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');

// Use the shared factory — singleton pattern, all 6 DBs
const { getPrismaClient, disconnectAll } = require('../../src/config/databases');

// ── Constants ─────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 12;

/** Password for all admin panel test accounts */
const ADMIN_PASSWORD  = process.env.TEST_ADMIN_PASSWORD  || 'Test@Admin123';
/** Password for all sub-project (end-user) test accounts */
const USER_PASSWORD   = process.env.TEST_USER_PASSWORD   || 'Test@User123';

// ── Seed functions ────────────────────────────────────────────────────────────

/**
 * Admin DB — creates:
 *   • 1 AdminUser  (super_admin, for admin panel login)
 *   • 1 AdminUser  (admin role, limited permissions)
 *   • 1 User       (shared player row used by Risk/AML modules)
 */
async function seedAdmin() {
  const prisma = getPrismaClient('admin');
  {
    const adminPwd = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    const userPwd  = await bcrypt.hash(USER_PASSWORD, SALT_ROUNDS);

    // super_admin test account
    // Note: roleId (AdminRole relation) is excluded — column may not exist in all
    // DB states. Role is set via the string `role` field instead.
    const superAdmin = await prisma.adminUser.upsert({
      where:  { email: 'test.superadmin@lkvip.test' },
      update: {},
      create: {
        username: 'test_superadmin',
        email:    'test.superadmin@lkvip.test',
        password: adminPwd,
        fullName: '[TEST] Super Admin',
        role:     'super_admin',
        status:   'active',
      },
    });
    console.log(`    AdminUser (super_admin): ${superAdmin.email}`);

    // regular admin test account (limited permissions — useful for testing RBAC)
    const regularAdmin = await prisma.adminUser.upsert({
      where:  { email: 'test.admin@lkvip.test' },
      update: {},
      create: {
        username: 'test_admin',
        email:    'test.admin@lkvip.test',
        password: adminPwd,
        fullName: '[TEST] Admin',
        role:     'admin',
        status:   'active',
        // modules[] stored in permissions JSON for frontend registry gate
        permissions: { modules: ['game', 'hub'] },
      },
    });
    console.log(`    AdminUser (admin):       ${regularAdmin.email}`);

    // shared User row in admin DB (for cross-project Risk/AML/Loyalty tables)
    const testUser = await prisma.user.upsert({
      where:  { email: 'test.user@lkvip.test' },
      update: {},
      create: {
        email:    'test.user@lkvip.test',
        password: userPwd,
        fullName: '[TEST] Shared User',
        role:     'user',
        status:   'active',
        kycLevel: 'verified',
      },
    });
    console.log(`    User (shared):           ${testUser.email}`);
  }
}

/**
 * Hub DB — creates 1 regular user and 1 agent user.
 */
async function seedHub() {
  const prisma = getPrismaClient('hub');
  {
    const pwd = await bcrypt.hash(USER_PASSWORD, SALT_ROUNDS);

    const user = await prisma.user.upsert({
      where:  { email: 'test.user@lkvip.test' },
      update: {},
      create: {
        email:    'test.user@lkvip.test',
        username: 'test_hub_user',
        password: pwd,
        fullName: '[TEST] Hub User',
        role:     'user',
        status:   'active',
      },
    });
    console.log(`    User: ${user.email}  (id: ${user.id})`);
  }
}

/**
 * Game DB — creates 2 users:
 *   • Regular user  (vipLevel 1, balance 1 000 000 VND for testing deposits/bets)
 *   • VIP user      (vipLevel 5, higher balance)
 */
async function seedGame() {
  const prisma = getPrismaClient('game');
  {
    const pwd = await bcrypt.hash(USER_PASSWORD, SALT_ROUNDS);

    const regularUser = await prisma.user.upsert({
      where:  { email: 'test.user@lkvip.test' },
      update: {},
      create: {
        email:    'test.user@lkvip.test',
        username: 'test_game_user',
        password: pwd,
        fullName: '[TEST] Game User',
        role:     'user',
        status:   'active',
        vipLevel: 1,
        balance:  1_000_000,   // 1M VND starter balance for bet testing
      },
    });
    console.log(`    User (vip1):  ${regularUser.email}  balance: 1,000,000 VND`);

    const vipUser = await prisma.user.upsert({
      where:  { email: 'test.vip@lkvip.test' },
      update: {},
      create: {
        email:    'test.vip@lkvip.test',
        username: 'test_game_vip',
        password: pwd,
        fullName: '[TEST] Game VIP',
        role:     'user',
        status:   'active',
        vipLevel: 5,
        balance:  50_000_000,  // 50M VND for VIP feature testing
        totalDeposit: 150_000_000,
      },
    });
    console.log(`    User (vip5):  ${vipUser.email}  balance: 50,000,000 VND`);
  }
}

/**
 * Trade DB — creates 2 users:
 *   • Regular user (kycStatus: pending — to test KYC flow)
 *   • Verified user (kycStatus: verified — to test trading)
 *   Also creates a USDT wallet for each.
 */
async function seedTrade() {
  const prisma = getPrismaClient('trade');
  {
    const pwd = await bcrypt.hash(USER_PASSWORD, SALT_ROUNDS);

    const regularUser = await prisma.user.upsert({
      where:  { email: 'test.user@lkvip.test' },
      update: {},
      create: {
        email:      'test.user@lkvip.test',
        password:   pwd,
        fullName:   '[TEST] Trade User',
        role:       'user',
        status:     'active',
        kycStatus:  'pending',
        memberLevel: 1,
      },
    });
    console.log(`    User (pending kyc): ${regularUser.email}`);

    // USDT wallet for regular user
    await prisma.wallet.upsert({
      where:  { userId_currency: { userId: regularUser.id, currency: 'USDT' } },
      update: {},
      create: { userId: regularUser.id, currency: 'USDT', balance: 0 },
    }).catch(() => {});

    const verifiedUser = await prisma.user.upsert({
      where:  { email: 'test.verified@lkvip.test' },
      update: {},
      create: {
        email:       'test.verified@lkvip.test',
        password:    pwd,
        fullName:    '[TEST] Trade Verified',
        role:        'user',
        status:      'active',
        kycStatus:   'verified',
        memberLevel: 3,
      },
    });
    console.log(`    User (verified kyc): ${verifiedUser.email}`);

    // USDT wallet with test balance
    await prisma.wallet.upsert({
      where:  { userId_currency: { userId: verifiedUser.id, currency: 'USDT' } },
      update: {},
      create: { userId: verifiedUser.id, currency: 'USDT', balance: 1000 },
    }).catch(() => {});
  }
}

/**
 * Dating DB — creates 2 users (male + female) for testing match/like flow.
 */
async function seedDating() {
  const prisma = getPrismaClient('dating');
  {
    const pwd = await bcrypt.hash(USER_PASSWORD, SALT_ROUNDS);

    const male = await prisma.user.upsert({
      where:  { email: 'test.male@lkvip.test' },
      update: {},
      create: {
        email:    'test.male@lkvip.test',
        username: 'test_dating_male',
        password: pwd,
        fullName: '[TEST] Dating Male',
        role:     'user',
        status:   'active',
        gender:   'male',
        coins:    500,
      },
    });
    console.log(`    User (male):   ${male.email}`);

    const female = await prisma.user.upsert({
      where:  { email: 'test.female@lkvip.test' },
      update: {},
      create: {
        email:    'test.female@lkvip.test',
        username: 'test_dating_female',
        password: pwd,
        fullName: '[TEST] Dating Female',
        role:     'user',
        status:   'active',
        gender:   'female',
        coins:    500,
        isVip:    true,
      },
    });
    console.log(`    User (female): ${female.email}`);
  }
}

/**
 * Sports DB — creates 2 users:
 *   • Regular user (for testing betting / community)
 *   • Streamer user (isStreamer: true — for testing livestream flow)
 */
async function seedSports() {
  const prisma = getPrismaClient('sports');
  {
    const pwd = await bcrypt.hash(USER_PASSWORD, SALT_ROUNDS);

    const user = await prisma.user.upsert({
      where:  { email: 'test.user@lkvip.test' },
      update: {},
      create: {
        email:    'test.user@lkvip.test',
        username: 'test_sports_user',
        password: pwd,
        fullName: '[TEST] Sports User',
        role:     'user',
        status:   'active',
        balance:  2_000_000,  // 2M VND for bet testing
      },
    });
    console.log(`    User:     ${user.email}  balance: 2,000,000 VND`);

    const streamer = await prisma.user.upsert({
      where:  { email: 'test.streamer@lkvip.test' },
      update: {},
      create: {
        email:      'test.streamer@lkvip.test',
        username:   'test_sports_streamer',
        password:   pwd,
        fullName:   '[TEST] Sports Streamer',
        role:       'streamer',
        status:     'active',
        isStreamer: true,
        isVerified: true,
      },
    });
    console.log(`    Streamer: ${streamer.email}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('  [admin]  Creating admin test accounts…');
  await seedAdmin();

  console.log('  [hub]    Creating hub test users…');
  await seedHub();

  console.log('  [game]   Creating game test users…');
  await seedGame();

  console.log('  [trade]  Creating trade test users…');
  await seedTrade();

  console.log('  [dating] Creating dating test users…');
  await seedDating();

  console.log('  [sports] Creating sports test users…');
  await seedSports();

  console.log('');
  console.log('  📋 Test credentials (all databases):');
  console.log(`     Admin panel  : test.superadmin@lkvip.test  /  ${ADMIN_PASSWORD}`);
  console.log(`     Admin panel  : test.admin@lkvip.test       /  ${ADMIN_PASSWORD}`);
  console.log(`     Sub-projects : test.user@lkvip.test        /  ${USER_PASSWORD}`);
  console.log(`     Dating male  : test.male@lkvip.test        /  ${USER_PASSWORD}`);
  console.log(`     Dating female: test.female@lkvip.test      /  ${USER_PASSWORD}`);
  console.log(`     Game VIP     : test.vip@lkvip.test         /  ${USER_PASSWORD}`);
  console.log(`     Trade KYC    : test.verified@lkvip.test    /  ${USER_PASSWORD}`);
  console.log(`     Sports stream: test.streamer@lkvip.test    /  ${USER_PASSWORD}`);
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .catch(e => { console.error('[seed:test-users] ❌', e); process.exit(1); })
    .finally(() => disconnectAll());
}
