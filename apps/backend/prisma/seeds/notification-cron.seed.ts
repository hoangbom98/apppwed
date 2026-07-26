'use strict';
/**
 * notification-cron.seed.js
 *
 * Seeds:
 *   1. NotificationTemplate — 12 default templates (Telegram + Email)
 *   2. CronJob              — 10 default scheduled jobs
 *
 * Safe to run multiple times — uses upsert with "update: {}" so existing
 * customised records are NEVER overwritten.
 *
 * Usage:
 *   SEED_ONLY="Notification & Cron" node prisma/seeds/index.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient } = require('../../src/config/databases');

// ── Delegate to service layer ─────────────────────────────────────────────────
const tplSvc  = require('../../src/modules/admin/services/notificationTemplateService');
const cronSvc = require('../../src/modules/admin/services/cronService');

async function seed() {
  const prisma = getPrismaClient('admin');

  console.log('  → Seeding notification templates…');
  await tplSvc.seed(prisma);

  console.log('  → Seeding cron jobs…');
  await cronSvc.seed(prisma);
}

module.exports = { seed };

// ── CLI ───────────────────────────────────────────────────────────────────────
if (require.main === module) {
  seed()
    .then(() => { console.log('✅ Notification & Cron seed complete'); process.exit(0); })
    .catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); });
}
