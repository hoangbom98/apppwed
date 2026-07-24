/**
 * migrate-storage.ts — Migrate local uploads to S3-compatible storage.
 *
 * Usage:
 *   npm run storage:migrate
 *
 * Requires STORAGE_PROVIDER=s3 (in .env) and S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { S3Adapter } = require('../src/shared/services/storageAdapter');

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '../../../uploads');

const CONTENT_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
};

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

async function main() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    console.log('[Migrate] No uploads directory found — nothing to migrate');
    process.exit(0);
  }

  const files = await walk(UPLOAD_DIR);
  console.log(`[Migrate] Found ${files.length} files in ${UPLOAD_DIR}`);

  if (files.length === 0) {
    console.log('[Migrate] No files to migrate');
    process.exit(0);
  }

  let uploaded = 0, failed = 0;

  for (const file of files) {
    const relative = path.relative(UPLOAD_DIR, file).replace(/\\/g, '/');
    const ext = path.extname(file).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

    try {
      const buffer = await fs.promises.readFile(file);
      await S3Adapter.upload(buffer, relative, contentType);
      console.log(`  ✓ ${relative}`);
      uploaded++;
    } catch (err) {
      console.error(`  ✗ ${relative}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n[Migrate] Done: ${uploaded} uploaded, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
