#!/usr/bin/env pnpm ts-node
import { execSync } from 'child_process';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('lkvip')
  .description('LKVIP CLI quản lý vận hành')
  .version('1.0.0');

// --- Logic Deploy ---
program
  .command('deploy')
  .description('Triển khai dự án')
  .action(() => {
    console.log('Bắt đầu deploy (quy trình tối ưu)...');
    try {
      execSync('git pull && pnpm install', { stdio: 'inherit' });
      console.log('Kiểm tra chất lượng code...');
      execSync('pnpm run lint && pnpm run typecheck', { stdio: 'inherit' });
      
      console.log('Health Check...');
      execSync('pnpm ts-node scripts/tcg-health-check.ts', { stdio: 'inherit' });
      
      console.log('Build dự án...');
      execSync('pnpm run build:packages && pnpm run build:frontends && pnpm prisma:deploy', { stdio: 'inherit' });
      
      execSync('pm2 restart lkvip-api --update-env && pm2 save', { stdio: 'inherit' });
      execSync('nginx -t && systemctl reload nginx', { stdio: 'inherit' });
      console.log('Deploy hoàn tất.');
    } catch (e) {
      console.error('Deploy thất bại:', e);
      process.exit(1);
    }
  });

// --- Logic Backup ---
const DATABASES = ['lkvip_admin', 'lkvip_game', 'lkvip_trade', 'lkvip_dating', 'lkvip_sports', 'lkvip_hub'];
const BACKUP_BASE = '/var/LKVIP/.backups';

program
  .command('backup')
  .description('Sao lưu dữ liệu')
  .action(() => {
    console.log('Bắt đầu sao lưu...');
    const today = new Date().toISOString().split('T')[0];
    const backupDir = path.join(BACKUP_BASE, today);
    
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    for (const db of DATABASES) {
      console.log(`Đang sao lưu: ${db}...`);
      const outputFile = path.join(backupDir, `${db}.sql.gz`);
      execSync(`mysqldump ${db} | gzip > ${outputFile}`);
    }
    console.log('Sao lưu hoàn tất.');
  });

// --- Logic Setup ---
program
  .command('setup')
  .description('Thiết lập môi trường')
  .argument('[mode]', 'Chế độ (permissions|ssl|all)', 'all')
  .action((mode: string) => {
    console.log(`Bắt đầu setup mode: ${mode}...`);
    console.log('⚠️ Logic setup cần được thực hiện qua các script hệ thống tương ứng.');
  });

program.parse(process.argv);
