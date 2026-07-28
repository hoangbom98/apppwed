#!/usr/bin/env tsx
/**
 * scripts/lkvip.ts — LKVIP CLI quản lý vận hành
 *
 * Usage:
 *   tsx scripts/lkvip.ts deploy    — deploy full project
 *   tsx scripts/lkvip.ts backup    — backup 6 databases
 *   tsx scripts/lkvip.ts setup     — hướng dẫn setup
 *
 * NOTE: Đây là CLI wrapper tiện lợi. Trên production, ưu tiên dùng
 *       scripts/deploy.sh và scripts/backup.sh trực tiếp để có đầy đủ
 *       logging, rollback, và kiểm tra bảo mật.
 */

import { execSync } from 'child_process';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Đọc tên databases từ biến môi trường hoặc dùng default
const DB_PREFIX = process.env.DB_PREFIX ?? 'lkvip';
const DATABASES = [
  `${DB_PREFIX}_admin`,
  `${DB_PREFIX}_game`,
  `${DB_PREFIX}_trade`,
  `${DB_PREFIX}_dating`,
  `${DB_PREFIX}_sports`,
  `${DB_PREFIX}_hub`,
];
const BACKUP_BASE = process.env.BACKUP_DIR ?? path.join(ROOT_DIR, '.backups');

const program = new Command();

program
  .name('lkvip')
  .description('LKVIP CLI quản lý vận hành')
  .version('1.0.0');

// ── Deploy ────────────────────────────────────────────────────────────────────
program
  .command('deploy')
  .description('Triển khai dự án (wrapper — dùng deploy.sh cho production)')
  .action(() => {
    console.log('[lkvip] Bắt đầu deploy...');
    try {
      execSync('git pull && pnpm install', { stdio: 'inherit', cwd: ROOT_DIR });
      console.log('[lkvip] Kiểm tra chất lượng code...');
      execSync('pnpm run lint && pnpm run typecheck', { stdio: 'inherit', cwd: ROOT_DIR });

      console.log('[lkvip] Health Check...');
      execSync(`tsx ${path.join(ROOT_DIR, 'scripts/health-check.ts')}`, { stdio: 'inherit', cwd: ROOT_DIR });

      console.log('[lkvip] Build dự án...');
      execSync('pnpm run build:packages && pnpm run build:frontends', { stdio: 'inherit', cwd: ROOT_DIR });

      console.log('[lkvip] Deploy Prisma migrations...');
      execSync('pnpm prisma:deploy', { stdio: 'inherit', cwd: ROOT_DIR });

      execSync('pm2 reload lkvip-api --update-env && pm2 save', { stdio: 'inherit' });
      execSync('nginx -t && systemctl reload nginx', { stdio: 'inherit' });
      console.log('[lkvip] Deploy hoàn tất.');
    } catch (e) {
      console.error('[lkvip] Deploy thất bại:', (e as Error).message);
      process.exit(1);
    }
  });

// ── Backup ────────────────────────────────────────────────────────────────────
program
  .command('backup')
  .description('Sao lưu 6 databases MySQL')
  .action(() => {
    console.log('[lkvip] Bắt đầu sao lưu...');
    const today = new Date().toISOString().split('T')[0];
    const backupDir = path.join(BACKUP_BASE, today);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const mysqlHost = process.env.MYSQL_HOST ?? '127.0.0.1';
    const mysqlPort = process.env.MYSQL_PORT ?? '3306';
    const mysqlUser = process.env.MYSQL_USER ?? 'root';
    const mysqlPass = process.env.MYSQL_PASSWORD ?? '';
    const authFlag = mysqlPass ? `-p${mysqlPass}` : '';
    const connFlags = `-h${mysqlHost} -P${mysqlPort} -u${mysqlUser} ${authFlag}`;

    let failed = 0;
    for (const db of DATABASES) {
      console.log(`[lkvip]   Backing up: ${db}...`);
      const outputFile = path.join(backupDir, `${db}.sql.gz`);
      try {
        execSync(
          `mysqldump ${connFlags} --single-transaction --routines --triggers --skip-lock-tables "${db}" | gzip -9 > "${outputFile}"`,
          { stdio: ['pipe', 'pipe', 'pipe'] }
        );
        console.log(`[lkvip]   ✓ ${db}`);
      } catch (e) {
        console.error(`[lkvip]   ✗ ${db}: ${(e as Error).message}`);
        failed++;
      }
    }

    if (failed > 0) {
      console.error(`[lkvip] Sao lưu hoàn tất với ${failed} lỗi.`);
      process.exit(1);
    }
    console.log('[lkvip] Sao lưu hoàn tất thành công.');
  });

// ── Setup ─────────────────────────────────────────────────────────────────────
program
  .command('setup')
  .description('Hướng dẫn thiết lập môi trường')
  .argument('[mode]', 'Chế độ (permissions|ssl|all)', 'all')
  .action((mode: string) => {
    console.log(`[lkvip] Setup mode: ${mode}`);
    console.log('');
    console.log('Chạy script tương ứng:');
    if (mode === 'permissions' || mode === 'all') {
      console.log(`  sudo bash ${path.join(ROOT_DIR, 'scripts/setup-permissions.sh')}`);
    }
    if (mode === 'ssl' || mode === 'all') {
      console.log(`  sudo bash ${path.join(ROOT_DIR, 'scripts/ssl-setup.sh')}`);
    }
    if (mode === 'all') {
      console.log('');
      console.log('Khởi tạo lần đầu (VPS):');
      console.log(`  sudo bash ${path.join(ROOT_DIR, 'scripts/vps-setup.sh')}`);
    }
  });

program.parse(process.argv);
