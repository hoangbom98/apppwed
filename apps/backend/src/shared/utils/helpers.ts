'use strict';
/**
 * src/shared/utils/helpers.ts
 *
 * Re-exports all utilities from the canonical @lkvip/utils workspace package,
 * then adds backend-specific helpers that have no place in the shared package.
 *
 * Usage:
 *   const { paginate, slugify, formatVND, generateOTP } = require('./helpers');
 *   const { paginate } = require('@lkvip/utils');  // preferred for new code
 */

// ── Re-export everything from the canonical package ───────────────────────────
const kjcUtils = require('@lkvip/utils');

// ── Backend-specific helpers not in @lkvip/utils ────────────────────────────────
const crypto = require('crypto');

/**
 * Generate a referral code (8-char uppercase hex).
 * @returns {string}
 */
const generateReferralCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase();

/**
 * Generate an order number with prefix + timestamp + random suffix.
 * @param {string} [prefix='ORD']
 * @returns {string}
 */
const generateOrderNo = (prefix = 'ORD') =>
  `${prefix}${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

/**
 * Returns Prisma-compatible skip/take + pagination metadata.
 * Alias of @lkvip/utils parsePaginationQuery with legacy API surface.
 * @param {number|string} [page=1]
 * @param {number|string} [limit=20]
 * @returns {{ skip: number, take: number, page: number, limit: number }}
 */
const paginate = (page = 1, limit = 20) => ({
  skip:  (Math.max(1, +page) - 1) * Math.min(100, +limit),
  take:  Math.min(100, +limit),
  page:  Math.max(1, +page),
  limit: Math.min(100, +limit),
});

/**
 * Pick only allowed keys from an object.
 * @param {object} obj
 * @param {string[]} allowed
 * @returns {object}
 */
const sanitize = (obj, allowed) =>
  allowed.reduce((acc, k) => { if (obj[k] !== undefined) acc[k] = obj[k]; return acc; }, {});

/**
 * Calculate age in years from a birth date.
 * @param {string|Date} birthDate
 * @returns {number}
 */
const calcAge = (birthDate) => {
  const d = new Date(birthDate), n = new Date();
  let age = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) age--;
  return age;
};

module.exports = Object.assign(
  {},
  kjcUtils,               // slugify, truncate, mask, formatVND, isEmail, parsePaginationQuery, generateOTP, …
  {
    generateReferralCode,
    generateOrderNo,
    paginate,             // legacy API used by existing route files
    sanitize,
    calcAge,
  },
);
