// @ts-nocheck
'use strict';
/**
 * uploadService.js — File upload via Multer + Sharp.
 *
 * All images are converted to WebP on save.
 * Responsive images: `saveResponsiveImage()` generates three WebP widths
 * (400 / 800 / 1080) so the frontend can use srcset for bandwidth savings.
 * Avatars are also saved as AVIF (smaller, modern browsers).
 *
 * Exports:
 *   upload              — configured multer instance (middleware)
 *   saveAvatar          — 200×200 WebP + AVIF avatar
 *   saveImage           — single WebP up to maxWidth × maxHeight
 *   saveResponsiveImage — three-width WebP set (400/800/1080) + srcset string
 *   saveVideo           — passthrough video (no transcode)
 *   deleteFile          — remove a saved upload by public URL
 */

const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const sharp   = require('sharp');
const crypto  = require('crypto');

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '../../../../uploads');

// Ensure base upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer: memory storage (sharp processes before disk write) ─────────────────

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
  'video/mp4', 'video/webm',
];

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);

/** @type {multer.Multer} */
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new Error('File type not allowed'));
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function _ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function _uniqueName(ext) {
  return `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
}

/** Base URL served by the backend (set CDN_BASE_URL in .env for production CDN). */
function _publicUrl(relPath) {
  const base = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
  return base ? `${base}/${relPath}` : `/${relPath}`;
}

// ── saveAvatar ─────────────────────────────────────────────────────────────────

/**
 * Resize & save a user avatar.
 * Produces two formats:
 *   - 200×200 WebP  (universal support)
 *   - 200×200 AVIF  (25–50% smaller — served to modern browsers by <picture>)
 *
 * Returns:
 *   { webp: string, avif: string }  — public URLs
 *
 * @param {Express.Multer.File} file
 * @param {string} [subdir]
 * @returns {Promise<{ webp: string, avif: string }>}
 */
async function saveAvatar(file, subdir = 'avatars') {
  const dir = path.join(UPLOAD_DIR, subdir);
  _ensureDir(dir);

  const base    = _uniqueName('');   // e.g.  "1720000000000_abc123"
  const webpOut = path.join(dir, `${base}.webp`);
  const avifOut = path.join(dir, `${base}.avif`);

  const pipeline = sharp(file.buffer).resize(200, 200, { fit: 'cover' });

  await Promise.all([
    pipeline.clone().webp({ quality: 85 }).toFile(webpOut),
    pipeline.clone().avif({ quality: 60, speed: 5 }).toFile(avifOut),
  ]);

  return {
    webp: _publicUrl(`uploads/${subdir}/${base}.webp`),
    avif: _publicUrl(`uploads/${subdir}/${base}.avif`),
  };
}

// ── saveImage ──────────────────────────────────────────────────────────────────

/**
 * Resize & save a single general image as WebP.
 *
 * @param {Express.Multer.File} file
 * @param {object}  [opts]
 * @param {string}  [opts.subdir]    – default 'images'
 * @param {number}  [opts.maxWidth]  – default 1080
 * @param {number}  [opts.maxHeight] – default 1080
 * @param {number}  [opts.quality]   – WebP quality 0-100, default 85
 * @returns {Promise<string>}  Public URL of the saved WebP
 */
async function saveImage(file, opts = {}) {
  const {
    subdir    = 'images',
    maxWidth  = 1080,
    maxHeight = 1080,
    quality   = 85,
  } = opts;

  const dir  = path.join(UPLOAD_DIR, subdir);
  _ensureDir(dir);
  const name = _uniqueName('.webp');

  await sharp(file.buffer)
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toFile(path.join(dir, name));

  return _publicUrl(`uploads/${subdir}/${name}`);
}

// ── saveResponsiveImage ────────────────────────────────────────────────────────

/**
 * Generate a responsive image set (three WebP widths) for srcset delivery.
 *
 * Produces:
 *   <base>_400w.webp   – mobile thumbnail (≤400px)
 *   <base>_800w.webp   – tablet / medium screens (≤800px)
 *   <base>_1080w.webp  – desktop / full size (≤1080px)
 *
 * Usage in frontend:
 *   <img src={src} srcSet={srcset} sizes="(max-width:640px) 400px,(max-width:1024px) 800px,1080px" />
 *
 * @param {Express.Multer.File} file
 * @param {object} [opts]
 * @param {string} [opts.subdir]   – default 'images'
 * @param {number} [opts.quality]  – WebP quality, default 82
 * @returns {Promise<{ src: string, srcset: string, widths: { 400: string, 800: string, 1080: string } }>}
 */
async function saveResponsiveImage(file, opts = {}) {
  const { subdir = 'images', quality = 82 } = opts;

  const dir  = path.join(UPLOAD_DIR, subdir);
  _ensureDir(dir);
  const base = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

  const BREAKPOINTS = [400, 800, 1080];
  const pipeline    = sharp(file.buffer);

  await Promise.all(
    BREAKPOINTS.map((w) =>
      pipeline
        .clone()
        .resize(w, null, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality })
        .toFile(path.join(dir, `${base}_${w}w.webp`))
    )
  );

  const widths = {};
  BREAKPOINTS.forEach((w) => {
    widths[w] = _publicUrl(`uploads/${subdir}/${base}_${w}w.webp`);
  });

  const srcset = BREAKPOINTS.map((w) => `${widths[w]} ${w}w`).join(', ');

  return {
    src:    widths[1080],   // fallback full-size
    srcset,
    widths,
  };
}

// ── saveVideo ──────────────────────────────────────────────────────────────────

/**
 * Save a video file as-is (no server-side transcoding — ffmpeg not available).
 * @param {Express.Multer.File} file
 * @param {string} [subdir]
 * @returns {Promise<string>}  Public URL
 */
async function saveVideo(file, subdir = 'videos') {
  const dir  = path.join(UPLOAD_DIR, subdir);
  _ensureDir(dir);
  const ext  = path.extname(file.originalname) || '.mp4';
  const name = _uniqueName(ext);
  await fs.promises.writeFile(path.join(dir, name), file.buffer);
  return _publicUrl(`uploads/${subdir}/${name}`);
}

// ── deleteFile ─────────────────────────────────────────────────────────────────

/**
 * Delete a previously saved upload by its public URL.
 * Silently no-ops if file not found.
 * @param {string} publicUrl
 */
async function deleteFile(publicUrl) {
  try {
    const rel  = publicUrl.replace(/^.*\/uploads\//, 'uploads/');
    const full = path.join(UPLOAD_DIR, '..', rel);
    if (fs.existsSync(full)) await fs.promises.unlink(full);
  } catch { /* ignore */ }
}

module.exports = { upload, saveAvatar, saveImage, saveResponsiveImage, saveVideo, deleteFile };
