#!/usr/bin/env tsx
/**
 * backend/scripts/prisma-run.ts
 * ──────────────────────────────
 * Tham số hóa Prisma CLI — thay thế 18 per-module scripts trùng lặp.
 * Chạy bằng: tsx scripts/prisma-run.ts <action> [module]
 *
 * Actions:
 *   generate   — prisma generate           (tạo Prisma Client)
 *   migrate    — prisma migrate dev        (dev migration, tạo migration mới)
 *   deploy     — prisma migrate deploy     (production: áp dụng pending migrations)
 *   status     — prisma migrate status     (kiểm tra trạng thái)
 *   studio     — prisma studio             (mở Prisma Studio, bắt buộc chỉ 1 module)
 *
 * Modules: hub | game | trade | dating | sports | admin
 *   Bỏ qua module (hoặc dùng "all") → chạy tất cả 6 theo thứ tự chuẩn.
 *
 * Ví dụ:
 *   tsx scripts/prisma-run.ts generate
 *   tsx scripts/prisma-run.ts generate hub
 *   tsx scripts/prisma-run.ts migrate dating
 *   tsx scripts/prisma-run.ts deploy
 *   tsx scripts/prisma-run.ts status all
 *   tsx scripts/prisma-run.ts studio game
 */

import { execSync } from 'child_process';
import path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

const ALL_MODULES = ['admin', 'hub', 'game', 'dating', 'trade', 'sports'] as const;
type Module = typeof ALL_MODULES[number];
type Action = 'generate' | 'migrate' | 'deploy' | 'status' | 'studio';

const VALID_ACTIONS: Action[] = ['generate', 'migrate', 'deploy', 'status', 'studio'];

// tsx injects __dirname automatically even in CJS+ESM hybrid mode
const SCHEMA_BASE = path.join(__dirname, '..', 'prisma');

function schemaPath(mod: Module): string {
  return path.join(SCHEMA_BASE, mod, 'schema.prisma');
}

// ── Arg parsing ───────────────────────────────────────────────────────────────

const [,, action, moduleArg] = process.argv;

function printUsage(): void {
  console.error('\n❌  Usage: tsx scripts/prisma-run.ts <action> [module]\n');
  console.error(`   Actions : ${VALID_ACTIONS.join(' | ')}`);
  console.error(`   Modules : ${ALL_MODULES.join(' | ')}  (omit = all)\n`);
}

if (!action || !VALID_ACTIONS.includes(action as Action)) {
  printUsage();
  process.exit(1);
}

// 'all' keyword treated same as omitting module
const targetModule: Module | null =
  moduleArg && moduleArg !== 'all' ? (moduleArg as Module) : null;

if (targetModule && !ALL_MODULES.includes(targetModule)) {
  console.error(`\n❌  Unknown module: "${targetModule}"`);
  console.error(`   Valid: ${ALL_MODULES.join(', ')}\n`);
  process.exit(1);
}

if (action === 'studio' && !targetModule) {
  console.error('\n❌  "studio" requires a specific module.\n');
  console.error('   e.g.  tsx scripts/prisma-run.ts studio hub\n');
  process.exit(1);
}

const modules: Module[] = targetModule ? [targetModule] : [...ALL_MODULES];

// ── Command builder ───────────────────────────────────────────────────────────

function buildCommand(act: Action, mod: Module): string {
  const schema = schemaPath(mod);
  switch (act) {
    case 'generate': return `npx prisma generate --schema="${schema}"`;
    case 'migrate':  return `npx prisma migrate dev --schema="${schema}" --name "init_${mod}"`;
    case 'deploy':   return `npx prisma migrate deploy --schema="${schema}"`;
    case 'status':   return `npx prisma migrate status --schema="${schema}"`;
    case 'studio':   return `npx prisma studio --schema="${schema}"`;
  }
}

// ── Runner ────────────────────────────────────────────────────────────────────

function run(cmd: string, mod: Module): void {
  console.log(`\n▶  [${mod}] ${cmd}`);
  console.log('─'.repeat(64));
  try {
    execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log(`✅  [${mod}] Done\n`);
  } catch (err: unknown) {
    const exitCode = (err as NodeJS.ErrnoException & { status?: number }).status ?? 1;
    console.error(`\n❌  [${mod}] Failed (exit ${exitCode})\n`);
    process.exit(exitCode);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\n🔧  prisma-run | action: ${action} | modules: ${modules.join(', ')}\n`);

for (const mod of modules) {
  run(buildCommand(action as Action, mod), mod);
}

console.log(`\n✅  prisma-run complete: ${action} [${modules.join(', ')}]\n`);
