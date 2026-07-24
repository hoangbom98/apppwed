// @ts-nocheck
/**
 * archiveService.ts — Cold Storage Archive (Tầng 2)
 *
 * Moves data older than ARCHIVE_MONTHS (default 6) from MySQL to an
 * S3-compatible object store (Cloudflare R2, AWS S3, Backblaze B2).
 *
 * Uses the standard AWS SDK v3 which works with R2 via a custom endpoint.
 *
 * ENV VARS required to enable archiving:
 *   ARCHIVE_ENABLED=true
 *   ARCHIVE_BUCKET=my-archive-bucket
 *   ARCHIVE_S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com  (R2)
 *   ARCHIVE_S3_REGION=auto
 *   ARCHIVE_S3_ACCESS_KEY_ID=...
 *   ARCHIVE_S3_SECRET_ACCESS_KEY=...
 *   ARCHIVE_MONTHS=6        (default: 6)
 *   ARCHIVE_BATCH_SIZE=1000 (rows per INSERT batch)
 *
 * Schema stored in admin_db.archive_logs for audit trail.
 */

'use strict';

import zlib from 'zlib';
import { promisify } from 'util';

const gzip   = promisify(zlib.gzip);
const logger = require('./logger');

// ── S3 client (lazy-init so server starts even without aws-sdk) ───────────
let _s3: any = null;

function getS3() {
  if (_s3) return _s3;
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    _s3 = new S3Client({
      region:   process.env.ARCHIVE_S3_REGION   || 'auto',
      endpoint: process.env.ARCHIVE_S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId:     process.env.ARCHIVE_S3_ACCESS_KEY_ID     || '',
        secretAccessKey: process.env.ARCHIVE_S3_SECRET_ACCESS_KEY || '',
      },
    });
  } catch {
    logger.warn('[Archive] @aws-sdk/client-s3 not installed — archiving disabled. Run: npm install @aws-sdk/client-s3');
  }
  return _s3;
}

// ── Config ────────────────────────────────────────────────────────────────

const ARCHIVE_MONTHS     = parseInt(process.env.ARCHIVE_MONTHS     || '6',    10);
const ARCHIVE_BATCH_SIZE = parseInt(process.env.ARCHIVE_BATCH_SIZE || '1000', 10);
const ARCHIVE_BUCKET     = process.env.ARCHIVE_BUCKET || '';

// ── Tables to archive per project ────────────────────────────────────────

interface ArchiveTarget {
  project:   string;
  model:     string;        // Prisma model name (camelCase)
  dateField: string;        // Prisma field name for date filter
}

const ARCHIVE_TARGETS: ArchiveTarget[] = [
  { project: 'game',   model: 'transaction',   dateField: 'createdAt' },
  { project: 'trade',  model: 'transaction',   dateField: 'createdAt' },
  { project: 'admin',  model: 'auditLog',      dateField: 'createdAt' },
  { project: 'admin',  model: 'userActivity',  dateField: 'createdAt' },
  { project: 'dating', model: 'chatMessage',   dateField: 'createdAt' },
  { project: 'sports', model: 'liveScore',     dateField: 'createdAt' },
];

// ── Core archive function ─────────────────────────────────────────────────

/**
 * Archives old records for one target:
 * 1. Reads rows older than cutoffDate in batches.
 * 2. Gzip-compresses to JSON.
 * 3. Uploads to S3/R2.
 * 4. Deletes from MySQL.
 * 5. Records in admin_db.archive_logs.
 *
 * @returns number of rows archived
 */
export async function archiveTarget(
  target: ArchiveTarget,
  prismaProject: any,   // project's own Prisma client
  adminPrisma:   any,   // admin_db Prisma client for ArchiveLog
): Promise<number> {
  if (!ARCHIVE_BUCKET || !getS3()) {
    logger.debug('[Archive] Skipped — ARCHIVE_BUCKET or S3 not configured');
    return 0;
  }

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - ARCHIVE_MONTHS);

  let totalRows    = 0;
  let pageOffset   = 0;
  const chunks: any[] = [];

  // ── Read in batches ──────────────────────────────────────────────────────
  let rows: any[] = [];
  do {
    rows = await prismaProject[target.model].findMany({
      where:  { [target.dateField]: { lt: cutoffDate } },
      take:   ARCHIVE_BATCH_SIZE,
      skip:   pageOffset,
      orderBy: { [target.dateField]: 'asc' },
    });
    if (!rows.length) break;
    chunks.push(...rows);
    pageOffset += rows.length;
  } while (rows.length >= ARCHIVE_BATCH_SIZE);

  if (!chunks.length) return 0;

  // ── Compress ─────────────────────────────────────────────────────────────
  const jsonBuf    = Buffer.from(JSON.stringify(chunks), 'utf8');
  const compressed = await gzip(jsonBuf, { level: 9 });

  // ── Upload to S3/R2 ──────────────────────────────────────────────────────
  const month      = cutoffDate.toISOString().slice(0, 7);   // "2025-01"
  const archiveKey = `archives/${target.project}/${target.model}_${month}.json.gz`;

  try {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    await getS3().send(new PutObjectCommand({
      Bucket:          ARCHIVE_BUCKET,
      Key:             archiveKey,
      Body:            compressed,
      ContentType:     'application/json',
      ContentEncoding: 'gzip',
      Metadata: {
        project:     target.project,
        model:       target.model,
        recordCount: String(chunks.length),
        cutoffDate:  cutoffDate.toISOString(),
      },
    }));
  } catch (err: any) {
    await adminPrisma.archiveLog.create({
      data: {
        tableName:   target.model,
        project:     target.project,
        archiveKey,
        recordCount: chunks.length,
        sizeBytes:   BigInt(compressed.length),
        cutoffDate,
        status:      'failed',
        error:       err.message,
      },
    });
    throw err;
  }

  // ── Delete from MySQL ────────────────────────────────────────────────────
  await prismaProject[target.model].deleteMany({
    where: { [target.dateField]: { lt: cutoffDate } },
  });

  totalRows += chunks.length;

  // ── Record in archive_logs ───────────────────────────────────────────────
  await adminPrisma.archiveLog.create({
    data: {
      tableName:   target.model,
      project:     target.project,
      archiveKey,
      recordCount: chunks.length,
      sizeBytes:   BigInt(compressed.length),
      cutoffDate,
      status:      'completed',
    },
  });

  logger.info(`[Archive] ${target.project}.${target.model}: archived ${chunks.length} rows → ${archiveKey} (${Math.round(compressed.length / 1024)}KB)`);
  return totalRows;
}

export { ARCHIVE_TARGETS };
