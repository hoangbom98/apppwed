#!/usr/bin/env tsx
/**
 * scripts/migrate-storage.ts — Migrate local uploads lên S3-compatible storage
 *
 * Đọc tất cả file trong thư mục uploads và upload lên S3 (hoặc S3-compatible như R2, MinIO).
 *
 * Biến môi trường cần thiết:
 *   STORAGE_PROVIDER  — phải là "s3"
 *   S3_BUCKET         — tên bucket
 *   S3_REGION         — region (vd: ap-southeast-1)
 *   S3_ACCESS_KEY     — access key ID
 *   S3_SECRET_KEY     — secret access key
 *   UPLOAD_DIR        — thư mục upload local (mặc định: data/uploads)
 *
 * Usage:
 *   tsx scripts/migrate-storage.ts
 *
 * NOTE: Đây là script one-time migration. Chạy 1 lần khi chuyển từ local
 *       storage sang S3. Cần cài @aws-sdk/client-s3 hoặc tương đương.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// ── Cấu hình ──────────────────────────────────────────────────────────────────

// Load .env nếu chưa được set
const envFile = path.join(ROOT_DIR, 'apps/backend/.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_0-9]+)=(.+)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(ROOT_DIR, 'data/uploads');

const CONTENT_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.pdf':  'application/pdf',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

// ── S3 Adapter (lazy import) ──────────────────────────────────────────────────

async function getS3Adapter() {
  try {
    const storageAdapterPath = path.join(ROOT_DIR, 'apps/backend/src/shared/services/storageAdapter');
    // Dynamic import để tránh crash khi file không tồn tại
    const mod = await import(storageAdapterPath);
    return mod.S3Adapter ?? mod.default?.S3Adapter ?? null;
  } catch {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Kiểm tra cấu hình
  const requiredEnvs = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'];
  const missing = requiredEnvs.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[migrate-storage] ❌ Thiếu biến môi trường: ${missing.join(', ')}`);
    console.error('[migrate-storage]    Kiểm tra apps/backend/.env');
    process.exit(1);
  }

  if (!fs.existsSync(UPLOAD_DIR)) {
    console.log('[migrate-storage] Không tìm thấy thư mục uploads — không cần migrate');
    process.exit(0);
  }

  const S3Adapter = await getS3Adapter();
  if (!S3Adapter) {
    console.error('[migrate-storage] ❌ Không thể load S3Adapter từ apps/backend/src/shared/services/storageAdapter');
    console.error('[migrate-storage]    Đảm bảo STORAGE_PROVIDER=s3 và file storageAdapter.ts tồn tại');
    process.exit(1);
  }

  const files = await walk(UPLOAD_DIR);
  console.log(`[migrate-storage] Tìm thấy ${files.length} file trong ${UPLOAD_DIR}`);

  if (files.length === 0) {
    console.log('[migrate-storage] Không có file nào cần migrate');
    process.exit(0);
  }

  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const relative = path.relative(UPLOAD_DIR, file).replace(/\\/g, '/');
    const ext = path.extname(file).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';

    try {
      const buffer = await fs.promises.readFile(file);
      await S3Adapter.upload(buffer, relative, contentType);
      console.log(`[migrate-storage]   ✓ ${relative}`);
      uploaded++;
    } catch (err) {
      console.error(`[migrate-storage]   ✗ ${relative}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n[migrate-storage] Hoàn tất: ${uploaded} uploaded, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('[migrate-storage] Lỗi nghiêm trọng:', (e as Error).message);
  process.exit(1);
});
