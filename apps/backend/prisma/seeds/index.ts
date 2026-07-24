/**
 * index.js — Master seed orchestrator
 *
 * Entry point for ALL seed scripts. Runs every seed module sequentially
 * in a single Node.js process sharing the Prisma singleton pool.
 *
 * Usage:
 *   npm run seed:all              — seed everything (skip demo data)
 *   npm run seed:all:force        — force re-seed even if data exists
 *   SEED_FORCE=true node prisma/seeds/index.js
 *
 * Individual seeds can still be run directly:
 *   node prisma/seeds/admin.seed.js
 *   node prisma/seeds/game.seed.js
 *   etc.
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// ── Import all seed modules ───────────────────────────────────────────────────
const adminSeed          = require('./admin.seed');
const uiConfigSeed       = require('./ui-config.seed');
const featureFlagsSeed   = require('./feature-flags.seed');
const paymentSeed        = require('./payment-gateways.seed');
const hubSeed            = require('./hub.seed');
const gameSeed           = require('./game.seed');
const gameAggregatorSeed = require('./gameAggregators.seed');
const gameProductsSeed   = require('./gameProducts.seed');
const lkvipSeed          = require('./lkvip.seed');
const tradeSeed          = require('./trade.seed');
const datingSeed         = require('./dating.seed');
const sportsSeed         = require('./sports.seed');
const notifCronSeed      = require('./notification-cron.seed');

// ── Seed registry (execution order matters) ───────────────────────────────────
const SEEDS = [
  { name: 'Admin',                  fn: adminSeed.seed },
  { name: 'UI Config',              fn: uiConfigSeed.seed },
  { name: 'Feature Flags',          fn: featureFlagsSeed.seed },
  { name: 'Payment Gateways',       fn: paymentSeed.seed },
  { name: 'Hub',                    fn: hubSeed.seed },
  { name: 'Game',                   fn: gameSeed.seed },
  { name: 'Game Aggregators',       fn: gameAggregatorSeed.seed },
  { name: 'Game Products',          fn: gameProductsSeed.seed },
  { name: 'LKvip',                  fn: lkvipSeed.seed },
  { name: 'Trade',                  fn: tradeSeed.seed },
  { name: 'Dating',                 fn: datingSeed.seed },
  { name: 'Sports',                 fn: sportsSeed.seed },
  { name: 'Notification & Cron',    fn: notifCronSeed.seed },
];

// ── Runner ────────────────────────────────────────────────────────────────────

async function runSeeds(options = {}) {
  const { only } = options;         // string[] | undefined — run only these names

  console.log('🚀 Starting full database seed…');
  console.log('⚠️  Make sure all databases exist. Run: mysql -u root -p < init-databases.sql\n');

  const targets = only
    ? SEEDS.filter(s => only.includes(s.name.toLowerCase()) || only.includes(s.name))
    : SEEDS;

  const results = { passed: [], failed: [] };

  for (const { name, fn } of targets) {
    console.log(`\n🌱 Seeding ${name}…`);
    try {
      await fn();
      console.log(`✅ ${name} seeded successfully`);
      results.passed.push(name);
    } catch (err) {
      console.error(`❌ ${name} failed: ${err.message}`);
      results.failed.push(name);
      // Continue — don't abort the whole run on one failure
    }
  }

  console.log('\n══════════════════════════════════════════════');
  console.log(`🎉 Seed run complete — ${results.passed.length} passed, ${results.failed.length} failed`);
  if (results.failed.length) {
    console.error('   Failed:', results.failed.join(', '));
  }
  console.log('\n📋 Admin login: admin@lkvip.com / Admin@123456');
  console.log('   Endpoint:    http://localhost:5000/api/admin/auth/login');

  return results;
}

module.exports = { runSeeds, SEEDS };

// ── CLI entry point ───────────────────────────────────────────────────────────
if (require.main === module) {
  // Support SEED_ONLY=admin,game env var to run a subset
  const only = process.env.SEED_ONLY
    ? process.env.SEED_ONLY.split(',').map(s => s.trim())
    : undefined;

  runSeeds({ only })
    .then(results => process.exit(results.failed.length > 0 ? 1 : 0))
    .catch(e => { console.error(e); process.exit(1); });
}
