/**
 * @lkvip/utils — src/format.ts
 *
 * Frontend-safe formatting utilities (TypeScript).
 * No external dependencies — works in both browser and Node.js environments.
 *
 * Usage:
 *   import { formatVND, formatCompact, formatPercent, formatRelativeTime } from '@lkvip/utils/src/format';
 */

// ── Currency ─────────────────────────────────────────────────────────────────

/**
 * Format a number as Vietnamese Dong (₫).
 * e.g. 1500000 → "1.500.000 ₫"
 */
export function formatVND(amount: number | string): string {
  const n = Number(amount);
  if (isNaN(n)) return '0 ₫';
  return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

/**
 * Format VND without the symbol suffix — for table cells where the column
 * header already shows the unit.
 * e.g. 1500000 → "1.500.000"
 */
export function formatVNDPlain(amount: number | string): string {
  const n = Number(amount);
  if (isNaN(n)) return '0';
  return n.toLocaleString('vi-VN');
}

/**
 * Compact format for large numbers (K / M / B).
 * e.g. 1500000 → "1.5M"  |  25000 → "25K"
 */
export function formatCompact(n: number, decimals = 1): string {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(decimals)}B`;
  if (Math.abs(n) >= 1_000_000)     return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (Math.abs(n) >= 1_000)         return `${(n / 1_000).toFixed(decimals)}K`;
  return String(n);
}

/**
 * Format a number as a percentage string.
 * e.g. 0.1234 → "12.34%" (if isDecimal=true)
 *       12.34  → "12.34%" (if isDecimal=false, default)
 */
export function formatPercent(value: number, decimals = 2, isDecimal = false): string {
  const pct = isDecimal ? value * 100 : value;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(decimals)}%`;
}

/**
 * Format a crypto / trading price.
 * Automatically adjusts decimal places based on magnitude.
 * e.g. 0.000123 → "0.000123"  |  45231.5 → "45,231.50"
 */
export function formatPrice(price: number, decimals?: number): string {
  if (price === 0) return '0.00';
  const d = decimals !== undefined ? decimals
    : price < 0.001  ? 8
    : price < 1      ? 6
    : price < 100    ? 4
    : 2;
  return price.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

// ── Dates ─────────────────────────────────────────────────────────────────────

type DateInput = string | Date | number;

/**
 * Format a date as "DD/MM/YYYY".
 * e.g. new Date('2024-06-15') → "15/06/2024"
 */
export function formatDate(d: DateInput): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/**
 * Format a date as "DD/MM/YYYY HH:mm".
 */
export function formatDateTime(d: DateInput): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Format a date as "DD/MM/YYYY HH:mm:ss".
 */
export function formatDateTimeFull(d: DateInput): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Human-readable relative time ("2 hours ago", "3 days ago", "just now").
 */
export function formatRelativeTime(d: DateInput): string {
  const now  = Date.now();
  const then = new Date(d).getTime();
  if (isNaN(then)) return '—';
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 30)                    return 'vừa xong';
  if (diffSec < 60)                    return `${diffSec} giây trước`;
  if (diffSec < 3600)                  return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400)                 return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 86400 * 7)             return `${Math.floor(diffSec / 86400)} ngày trước`;
  if (diffSec < 86400 * 30)            return `${Math.floor(diffSec / (86400 * 7))} tuần trước`;
  if (diffSec < 86400 * 365)           return `${Math.floor(diffSec / (86400 * 30))} tháng trước`;
  return `${Math.floor(diffSec / (86400 * 365))} năm trước`;
}

/**
 * Format a countdown duration (seconds remaining) as "mm:ss" or "HH:mm:ss".
 */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

// ── Strings ──────────────────────────────────────────────────────────────────

/**
 * Truncate a string to maxLen chars with "…" suffix.
 */
export function truncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str ?? '';
  return str.slice(0, maxLen - 1) + '…';
}

/**
 * Mask a sensitive string — show first N and last N chars, replace middle with "***".
 * e.g. maskSensitive("0987654321", 3, 2) → "098***21"
 */
export function maskSensitive(str: string, showFirst = 4, showLast = 4): string {
  if (!str) return '';
  if (str.length <= showFirst + showLast) return '*'.repeat(str.length);
  return str.slice(0, showFirst) + '***' + str.slice(-showLast);
}

/**
 * Mask a phone number: "0987654321" → "0987***321".
 */
export function maskPhone(phone: string): string {
  return maskSensitive(phone, 4, 3);
}

/**
 * Mask an email: "user@example.com" → "us***@example.com".
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return maskSensitive(email, 2, 2);
  return maskSensitive(local, 2, 1) + '@' + domain;
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert a snake_case or kebab-case string to Title Case.
 * e.g. "bank_transfer" → "Bank Transfer"
 */
export function toTitleCase(str: string): string {
  return str.replace(/[_-]/g, ' ').replace(/\w\S*/g, w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  );
}

// ── File / size ──────────────────────────────────────────────────────────────

/**
 * Format bytes as human-readable file size.
 * e.g. 1536000 → "1.47 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}
