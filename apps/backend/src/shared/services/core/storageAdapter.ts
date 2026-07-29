// @ts-nocheck
'use strict';
/**
 * Storage Adapter — abstraction for local filesystem, S3-compatible, or Supabase Storage.
 *
 * Config:
 *   STORAGE_PROVIDER=local     — local filesystem (default)
 *   STORAGE_PROVIDER=s3        — AWS S3 / Cloudflare R2 / MinIO
 *   STORAGE_PROVIDER=supabase  — Supabase Storage
 *
 * S3 env vars (required when STORAGE_PROVIDER=s3):
 *   S3_BUCKET         — bucket name
 *   S3_REGION         — region ("auto" for Cloudflare R2)
 *   S3_ACCESS_KEY     — access key ID
 *   S3_SECRET_KEY     — secret access key
 *   S3_ENDPOINT       — custom endpoint (Cloudflare R2: https://<id>.r2.cloudflarestorage.com)
 *   CDN_BASE_URL      — public URL prefix for uploaded files
 *
 * Supabase env vars (required when STORAGE_PROVIDER=supabase):
 *   SUPABASE_URL               — Project URL from Supabase dashboard
 *   SUPABASE_SERVICE_ROLE_KEY  — service_role key (server-only, bypasses RLS)
 *   SUPABASE_STORAGE_BUCKET    — bucket name (default: lkvip-uploads)
 *
 * Public API on every adapter:
 *   upload(buffer, relativePath, contentType?)  → Promise<string>  public URL
 *   delete(publicUrlOrKey)                       → Promise<void>
 *   getUrl(relativePath)                         → string           public URL (no expiry)
 *   getSignedUrl(relativePath, expiresIn?)       → Promise<string>  pre-signed URL (private files)
 *     expiresIn: seconds until URL expires (default: 3600 = 1 h)
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

  /**
   * Return a time-limited URL for a private local file.
   * Local storage has no real signed-URL mechanism; we return the public path
   * with a plain HMAC token so the backend can optionally verify it.
   * For production private files, switch STORAGE_PROVIDER=s3 (Cloudflare R2).
   *
   * @param {string} relativePath  e.g. 'receipts/bankapp/receipt_abc.pdf'
   * @param {number} [expiresIn=3600]  seconds
   * @returns {Promise<string>}
   */
  async getSignedUrl(relativePath, expiresIn = 3600) {
    const crypto = require('crypto');
    const secret = process.env.JWT_SECRET || 'local-dev-secret';
    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(`${relativePath}:${expires}`)
      .digest('hex')
      .slice(0, 16);
    const base = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
    const fileUrl = base ? `${base}/uploads/${relativePath}` : `/uploads/${relativePath}`;
    return `${fileUrl}?expires=${expires}&token=${hmac}`;
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

    /**
     * Generate a pre-signed GET URL for a private S3/R2 object.
     * Requires @aws-sdk/s3-request-presigner (installed alongside @aws-sdk/client-s3).
     *
     * @param {string} relativePath  e.g. 'receipts/bankapp/receipt_abc.pdf'
     * @param {number} [expiresIn=3600]  seconds until URL expires (max 604800 = 7 days)
     * @returns {Promise<string>}
     */
    async getSignedUrl(relativePath, expiresIn = 3600) {
      const s3 = getS3();
      if (!s3) throw new Error('S3 adapter not available — install @aws-sdk/client-s3');
      try {
        const { getSignedUrl: awsGetSignedUrl } = require('@aws-sdk/s3-request-presigner');
        const { GetObjectCommand } = require('@aws-sdk/client-s3');
        const command = new GetObjectCommand({ Bucket: s3.bucket, Key: relativePath });
        return await awsGetSignedUrl(s3.client, command, { expiresIn });
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
          throw new Error(
            'getSignedUrl requires @aws-sdk/s3-request-presigner. Run: pnpm add @aws-sdk/s3-request-presigner'
          );
        }
        throw err;
      }
    },
  };
})();

// ── Supabase Storage adapter ───────────────────────────────────────────────────
const SupabaseAdapter = (() => {
  let _client = null;
  let _bucket  = null;

  const getClient = () => {
    if (_client) return { client: _client, bucket: _bucket };
    try {
      const { createClient } = require('@supabase/supabase-js');
      _bucket = process.env.SUPABASE_STORAGE_BUCKET || 'lkvip-uploads';
      _client = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
    } catch {
      logger.error('[Storage:Supabase] @supabase/supabase-js not installed. Run: pnpm add @supabase/supabase-js');
    }
    return { client: _client, bucket: _bucket };
  };

  return {
    async upload(buffer, relativePath, contentType = 'application/octet-stream') {
      const { client, bucket } = getClient();
      if (!client) throw new Error('Supabase adapter not available — install @supabase/supabase-js');
      const { error } = await client.storage
        .from(bucket)
        .upload(relativePath, buffer, { contentType, upsert: true });
      if (error) throw new Error(`[Storage:Supabase] upload failed: ${error.message}`);
      const { data } = client.storage.from(bucket).getPublicUrl(relativePath);
      return data.publicUrl;
    },

    async delete(publicUrlOrKey) {
      const { client, bucket } = getClient();
      if (!client) return;
      // Strip the public URL prefix to get the storage path
      const { data: urlData } = client.storage.from(bucket).getPublicUrl('');
      const prefix = urlData.publicUrl.replace(/\/$/, '');
      const key = publicUrlOrKey.startsWith(prefix)
        ? publicUrlOrKey.slice(prefix.length + 1)
        : publicUrlOrKey.replace(/^\//, '');
      const { error } = await client.storage.from(bucket).remove([key]);
      if (error) logger.warn(`[Storage:Supabase] delete failed: ${error.message}`);
    },

    getUrl(relativePath) {
      const { client, bucket } = getClient();
      if (!client) return `/${relativePath}`;
      const { data } = client.storage.from(bucket).getPublicUrl(relativePath);
      return data.publicUrl;
    },

    /**
     * Generate a time-limited signed URL for a private Supabase Storage object.
     * The file must be in a private bucket (public access disabled in dashboard).
     *
     * @param {string} relativePath  e.g. 'receipts/bankapp/receipt_abc.pdf'
     * @param {number} [expiresIn=3600]  seconds until URL expires
     * @returns {Promise<string>}
     */
    async getSignedUrl(relativePath, expiresIn = 3600) {
      const { client, bucket } = getClient();
      if (!client) throw new Error('Supabase adapter not available — install @supabase/supabase-js');
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(relativePath, expiresIn);
      if (error || !data?.signedUrl) {
        throw new Error(`[Storage:Supabase] getSignedUrl failed: ${error?.message ?? 'unknown error'}`);
      }
      return data.signedUrl;
    },
  };
})();

// ── Factory ────────────────────────────────────────────────────────────────────
function getStorageAdapter() {
  if (PROVIDER === 's3')       return S3Adapter;
  if (PROVIDER === 'supabase') return SupabaseAdapter;
  if (PROVIDER !== 'local') {
    logger.warn(`[Storage] Unknown STORAGE_PROVIDER="${PROVIDER}" — using local`);
  }
  return LocalAdapter;
}

/**
 * Convenience helper — resolves a pre-signed URL using the configured provider.
 *
 * @example
 * const { getSignedUrl } = require('./storageAdapter');
 * const url = await getSignedUrl('receipts/bankapp/receipt_abc.pdf', 1800);
 * res.redirect(url);
 *
 * @param {string} relativePath
 * @param {number} [expiresIn=3600]
 * @returns {Promise<string>}
 */
async function getSignedUrl(relativePath, expiresIn = 3600) {
  return getStorageAdapter().getSignedUrl(relativePath, expiresIn);
}

module.exports = { getStorageAdapter, getSignedUrl, LocalAdapter, S3Adapter, SupabaseAdapter };
