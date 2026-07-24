// @ts-nocheck
'use strict';
/**
 * Storage Adapter — abstraction for local filesystem vs S3-compatible storage.
 *
 * Config:
 *   STORAGE_PROVIDER=local  — local filesystem (default, current behavior)
 *   STORAGE_PROVIDER=s3     — AWS S3 / Cloudflare R2 / MinIO
 *
 * S3 env vars (required when STORAGE_PROVIDER=s3):
 *   S3_BUCKET         — bucket name
 *   S3_REGION         — region (e.g. ap-southeast-1)
 *   S3_ACCESS_KEY     — access key ID
 *   S3_SECRET_KEY     — secret access key
 *   S3_ENDPOINT       — optional: custom endpoint (Cloudflare R2, MinIO)
 *   CDN_BASE_URL      — public URL prefix for uploaded files
 */

const path   = require('path');
const fs     = require('fs');
const logger = require('./logger');

const PROVIDER = process.env.STORAGE_PROVIDER || 'local';

// ── Local adapter ──────────────────────────────────────────────────────────────
const LocalAdapter = {
  /**
   * Write a buffer to local filesystem.
   * @param {Buffer} buffer
   * @param {string} relativePath  e.g. 'avatars/abc123.webp'
   * @returns {Promise<string>} Public URL
   */
  async upload(buffer, relativePath) {
    const UPLOAD_DIR = process.env.UPLOAD_DIR
      ? path.resolve(process.env.UPLOAD_DIR)
      : path.join(__dirname, '../../../../uploads');
    const fullPath = path.join(UPLOAD_DIR, relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);
    const base = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
    return base ? `${base}/uploads/${relativePath}` : `/uploads/${relativePath}`;
  },

  /**
   * Delete a file by its public URL.
   * @param {string} publicUrl
   */
  async delete(publicUrl) {
    try {
      const UPLOAD_DIR = process.env.UPLOAD_DIR
        ? path.resolve(process.env.UPLOAD_DIR)
        : path.join(__dirname, '../../../../uploads');
      const rel = publicUrl.replace(/^.*\/uploads\//, '');
      const fullPath = path.join(UPLOAD_DIR, rel);
      if (fs.existsSync(fullPath)) await fs.promises.unlink(fullPath);
    } catch (err) {
      logger.warn(`[Storage:Local] delete failed: ${err.message}`);
    }
  },

  getUrl(relativePath) {
    const base = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
    return base ? `${base}/uploads/${relativePath}` : `/uploads/${relativePath}`;
  },
};

// ── S3 adapter ─────────────────────────────────────────────────────────────────
const S3Adapter = (() => {
  let _s3 = null;

  const getS3 = () => {
    if (_s3) return _s3;
    try {
      const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
      _s3 = {
        client: new S3Client({
          region:      process.env.S3_REGION || 'ap-southeast-1',
          credentials: {
            accessKeyId:     process.env.S3_ACCESS_KEY || '',
            secretAccessKey: process.env.S3_SECRET_KEY || '',
          },
          ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
        }),
        PutObjectCommand,
        DeleteObjectCommand,
        bucket: process.env.S3_BUCKET || '',
      };
    } catch {
      logger.error('[Storage:S3] @aws-sdk/client-s3 not installed. Run: pnpm add @aws-sdk/client-s3');
    }
    return _s3;
  };

  return {
    async upload(buffer, relativePath, contentType = 'application/octet-stream') {
      const s3 = getS3();
      if (!s3) throw new Error('S3 adapter not available — install @aws-sdk/client-s3');
      await s3.client.send(new s3.PutObjectCommand({
        Bucket:      s3.bucket,
        Key:         relativePath,
        Body:        buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }));
      return S3Adapter.getUrl(relativePath);
    },

    async delete(publicUrlOrKey) {
      const s3 = getS3();
      if (!s3) return;
      const cdnBase = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
      const key = publicUrlOrKey
        .replace(cdnBase, '')
        .replace(/^\//, '');
      try {
        await s3.client.send(new s3.DeleteObjectCommand({ Bucket: s3.bucket, Key: key }));
      } catch (err) {
        logger.warn(`[Storage:S3] delete failed: ${err.message}`);
      }
    },

    getUrl(relativePath) {
      const base = (process.env.CDN_BASE_URL ||
        `https://${process.env.S3_BUCKET || 'bucket'}.s3.amazonaws.com`
      ).replace(/\/$/, '');
      return `${base}/${relativePath}`;
    },
  };
})();

// ── Factory ────────────────────────────────────────────────────────────────────
function getStorageAdapter() {
  if (PROVIDER === 's3') return S3Adapter;
  if (PROVIDER !== 'local') {
    logger.warn(`[Storage] Unknown STORAGE_PROVIDER="${PROVIDER}" — using local`);
  }
  return LocalAdapter;
}

module.exports = { getStorageAdapter, LocalAdapter, S3Adapter };
