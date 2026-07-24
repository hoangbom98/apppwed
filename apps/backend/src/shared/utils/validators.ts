'use strict';
/**
 * src/shared/utils/validators.ts
 *
 * Re-exports all validators from the canonical @lkvip/utils workspace package,
 * then adds backend-specific validators (stronger rules, business logic).
 *
 * Usage:
 *   const { isEmail, isValidAmount, isStrongPassword } = require('./validators');
 */

// ── Re-export everything from the canonical package ───────────────────────────
const kjcValidators = require('@lkvip/utils');

// ── Backend-only / stricter validators ────────────────────────────────────────

/** Password must be ≥ 8 chars, contain letter + digit (stricter than @lkvip/utils isPassword ≥6) */
const isStrongPassword = (v) =>
  typeof v === 'string' &&
  v.length >= 8 &&
  /[A-Za-z]/.test(v) &&
  /[0-9]/.test(v);

const isUUID = (v) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const isSlug = (v) =>
  typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);

const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const isPositiveNumber = (v) => isFinite(Number(v)) && Number(v) > 0;

const isNonNegativeNumber = (v) => isFinite(Number(v)) && Number(v) >= 0;

const isValidDate = (v) => !isNaN(Date.parse(v));

const isIn = (v, allowed) => allowed.includes(v);

const isLength = (v, min, max) => {
  const s = String(v ?? '');
  return s.length >= min && (max === undefined || s.length <= max);
};

/** Amount must be positive decimal with up to 8 decimal places */
const isAmount = (v) =>
  /^\d+(\.\d{1,8})?$/.test(String(v)) && Number(v) > 0;

/** Validate Decimal precision (digits, decimals) */
const isDecimal = (v, digits = 15, decimals = 8) => {
  const pattern = new RegExp(`^\\d{1,${digits - decimals}}(\\.\\d{1,${decimals}})?$`);
  return pattern.test(String(v));
};

/** Build a Prisma-friendly `orderBy` from a query string like "createdAt:desc" */
const parseOrderBy = (sortStr, allowedFields = [], defaultField = 'createdAt') => {
  if (!sortStr) return { [defaultField]: 'desc' };
  const [field, dir] = sortStr.split(':');
  const safeField = allowedFields.includes(field) ? field : defaultField;
  const safeDir   = dir === 'asc' ? 'asc' : 'desc';
  return { [safeField]: safeDir };
};

module.exports = Object.assign(
  {},
  kjcValidators,   // isEmail, isPassword, isUsername, isPhone, isValidAmount, missingFields, parsePaginationQuery, …
  {
    isStrongPassword,
    isUUID, isSlug,
    isPositiveInt, isPositiveNumber, isNonNegativeNumber, isValidDate, isIn, isLength,
    isAmount, isDecimal,
    parseOrderBy,
  },
);
