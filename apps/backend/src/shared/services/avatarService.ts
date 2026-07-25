// @ts-nocheck
'use strict';
/**
 * AvatarService — tạo default avatar từ Dicebear API.
 *
 * Dicebear: https://www.dicebear.com — hoàn toàn miễn phí, không cần key.
 * Hỗ trợ nhiều style: avataaars, bottts, identicon, initials, lorelei, ...
 *
 * Dùng khi user đăng ký mà chưa upload avatar.
 * Dating  → style "lorelei" (nhân vật người)
 * Hub     → style "identicon" (geometric, neutral)
 * Game    → style "bottts" (robot)
 * Sports  → style "initials" (initials badge)
 *
 * Sử dụng:
 *   const avatarSvc = require('../../shared/services/avatarService');
 *   const url = avatarSvc.generateUrl('lorelei', userId);
 *   // → "https://api.dicebear.com/7.x/lorelei/svg?seed=<userId>&...options"
 *
 * URL được dùng trực tiếp làm avatar — không download, không lưu server.
 * Có thể cache nhẹ ở CDN nếu cần.
 */

const DICEBEAR_BASE = process.env.DICEBEAR_BASE_URL || 'https://api.dicebear.com/7.x';
const FORMAT        = process.env.DICEBEAR_FORMAT    || 'svg'; // svg | png

// Style mặc định theo project
const PROJECT_STYLE = {
  dating:  'lorelei',
  hub:     'identicon',
  game:    'bottts',
  sports:  'initials',
  trade:   'identicon',
  default: 'identicon',
};

/**
 * Tạo URL avatar từ Dicebear (stateless, no API call needed).
 * @param {string} style  — dicebear style slug (e.g. 'lorelei', 'bottts')
 * @param {string} seed   — unique seed, thường là userId hoặc username
 * @param {object} [opts] — query params bổ sung (backgroundColor, size, ...)
 * @returns {string} URL của avatar SVG/PNG
 */
function generateUrl(style, seed, opts = {}) {
  const s      = style || PROJECT_STYLE.default;
  const params = new URLSearchParams({ seed: String(seed), ...opts });
  return `${DICEBEAR_BASE}/${s}/${FORMAT}?${params.toString()}`;
}

/**
 * Lấy default avatar URL cho một project.
 * @param {string} project — 'dating' | 'hub' | 'game' | 'sports' | 'trade'
 * @param {string} seed    — userId hoặc username
 * @returns {string}
 */
function getDefaultAvatar(project, seed) {
  const style = PROJECT_STYLE[project] || PROJECT_STYLE.default;
  return generateUrl(style, seed);
}

/**
 * Chỉ trả về URL nếu user chưa có avatar.
 * Dùng trong register controllers: user.avatar = resolveAvatar(project, user.id, user.avatar)
 * @param {string} project
 * @param {string} seed
 * @param {string|null} existingAvatar — avatar URL đã có (nếu user upload)
 * @returns {string}
 */
function resolveAvatar(project, seed, existingAvatar = null) {
  if (existingAvatar) return existingAvatar;
  return getDefaultAvatar(project, seed);
}

module.exports = { generateUrl, getDefaultAvatar, resolveAvatar };
