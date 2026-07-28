#!/usr/bin/env tsx
/**
 * scripts/migrate-assets.ts — Di chuyển và chuẩn hóa tên asset từ project nguồn
 *
 * Mục đích: Script one-time dùng để migrate assets từ một thư mục nguồn sang
 *           apps/game/src/assets, đồng thời chuẩn hóa tên file sang kebab-case.
 *
 * Cấu hình qua biến môi trường:
 *   ASSET_SOURCE_DIR  — thư mục nguồn chứa assets (bắt buộc)
 *   ASSET_TARGET_DIR  — thư mục đích (mặc định: apps/game/src/assets)
 *
 * Usage:
 *   ASSET_SOURCE_DIR=/path/to/source tsx scripts/migrate-assets.ts
 *
 * NOTE: Script này là công cụ one-time migration. Sau khi chạy xong,
 *       không cần chạy lại trừ khi có nguồn assets mới.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// ── Cấu hình từ biến môi trường ───────────────────────────────────────────────

const SOURCE_DIR = process.env.ASSET_SOURCE_DIR;
const TARGET_DIR = process.env.ASSET_TARGET_DIR
  ? path.resolve(process.env.ASSET_TARGET_DIR)
  : path.join(ROOT_DIR, 'apps/game/src/assets');

const FOLDERS_TO_MIGRATE = ['images', 'png', 'lottie', 'css'];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Chuẩn hóa tên file sang kebab-case quốc tế:
 * - Viết thường toàn bộ
 * - Ký tự đặc biệt → dấu gạch ngang
 * - Nhiều gạch ngang liên tiếp → 1
 * - Không có gạch ngang ở đầu/cuối
 * - Bảo toàn extension file
 */
function normalizeFileName(name: string): string {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  const normalized = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${normalized}${ext}`;
}

function migrateFolder(folderName: string, sourceDir: string, targetDir: string): void {
  const srcPath = path.join(sourceDir, folderName);
  const destPath = path.join(targetDir, folderName);

  if (!fs.existsSync(srcPath)) {
    console.log(`[migrate-assets] Bỏ qua: ${folderName} (không tồn tại tại nguồn)`);
    return;
  }

  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
  }

  const files = fs.readdirSync(srcPath);
  console.log(`[migrate-assets] Xử lý thư mục: ${folderName} (${files.length} file)`);

  let copied = 0;
  let skipped = 0;

  for (const file of files) {
    const srcFile = path.join(srcPath, file);
    if (fs.statSync(srcFile).isDirectory()) {
      skipped++;
      continue; // Bỏ qua thư mục con (chỉ migrate file phẳng)
    }

    const normalizedName = normalizeFileName(file);
    const destFile = path.join(destPath, normalizedName);

    try {
      fs.copyFileSync(srcFile, destFile);
      if (file !== normalizedName) {
        console.log(`[migrate-assets]   ✓ ${file} → ${normalizedName}`);
      } else {
        console.log(`[migrate-assets]   ✓ ${file}`);
      }
      copied++;
    } catch (err) {
      console.error(`[migrate-assets]   ✗ ${file}: ${(err as Error).message}`);
    }
  }

  console.log(`[migrate-assets]   ${copied} copied, ${skipped} skipped`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
  if (!SOURCE_DIR) {
    console.error('[migrate-assets] ❌ Biến môi trường ASSET_SOURCE_DIR chưa được đặt.');
    console.error('[migrate-assets]    Ví dụ: ASSET_SOURCE_DIR=/path/to/assets tsx scripts/migrate-assets.ts');
    process.exit(1);
  }

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`[migrate-assets] ❌ Thư mục nguồn không tồn tại: ${SOURCE_DIR}`);
    process.exit(1);
  }

  console.log(`[migrate-assets] Bắt đầu migration...`);
  console.log(`[migrate-assets]   Nguồn  : ${SOURCE_DIR}`);
  console.log(`[migrate-assets]   Đích   : ${TARGET_DIR}`);
  console.log(`[migrate-assets]   Folders: ${FOLDERS_TO_MIGRATE.join(', ')}`);

  for (const folder of FOLDERS_TO_MIGRATE) {
    migrateFolder(folder, SOURCE_DIR, TARGET_DIR);
  }

  console.log('[migrate-assets] Migration hoàn tất.');
}

main();
