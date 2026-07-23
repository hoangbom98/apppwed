'use strict';
/**
 * @kjc/utils — validators.js
 * Simple pure-function validators for backend use (no Joi dependency).
 * Mirrors the frontend Yup schema rules for consistency.
 */

/** @param {string} email */
function isEmail(email) {
  return typeof email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** @param {string} password — at least 6 chars */
function isPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

/** @param {string} username — 3–30 alphanumeric/underscore chars */
function isUsername(username) {
  return typeof username === 'string' &&
    /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

/** Vietnamese phone: 10–12 digits */
function isPhone(phone) {
  return typeof phone === 'string' && /^[0-9]{10,12}$/.test(phone.trim());
}

/**
 * Validate deposit/withdrawal amount.
 * @param {number} amount
 * @param {number} [min=10000]
 * @param {number} [max=Infinity]
 */
function isValidAmount(amount, min = 10_000, max = Infinity) {
  const n = Number(amount);
  return !isNaN(n) && n >= min && n <= max;
}

/**
 * Check that an object has all required keys (non-null, non-empty-string).
 * @param {object} obj
 * @param {string[]} keys
 * @returns {string[]} Array of missing key names (empty = all present)
 */
function missingFields(obj, keys) {
  return keys.filter(k => obj[k] == null || obj[k] === '');
}

module.exports = { isEmail, isPassword, isUsername, isPhone, isValidAmount, missingFields };
