'use strict';
/**
 * @kjc/utils — dates.js
 * Backend date/time helpers (no external dependencies).
 */

/**
 * Format a Date as "DD/MM/YYYY HH:mm:ss" (UTC+7 / Vietnam time).
 * @param {Date|string|number} d
 * @returns {string}
 */
function formatVNDateTime(d) {
  const date = new Date(d);
  const vn = new Date(date.getTime() + 7 * 3600 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(vn.getUTCDate())}/${pad(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()} ${pad(vn.getUTCHours())}:${pad(vn.getUTCMinutes())}:${pad(vn.getUTCSeconds())}`;
}

/**
 * Return a Date `n` minutes from now.
 * @param {number} minutes
 * @returns {Date}
 */
function addMinutes(minutes) {
  return new Date(Date.now() + minutes * 60_000);
}

/**
 * Return a Date `n` days from now.
 * @param {number} days
 * @returns {Date}
 */
function addDays(days) {
  return new Date(Date.now() + days * 86_400_000);
}

/**
 * Check if a date (or ISO string) is in the past.
 * @param {Date|string} d
 * @returns {boolean}
 */
function isPast(d) {
  return new Date(d).getTime() < Date.now();
}

/**
 * Get start-of-day (00:00:00.000) for a given date (local time).
 * Useful for "has the user done this today?" checks.
 * @param {Date} [date=new Date()]
 * @returns {Date}
 */
function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format a duration (seconds) as HH:MM:SS or MM:SS.
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

module.exports = { formatVNDateTime, addMinutes, addDays, isPast, startOfDay, formatDuration };
