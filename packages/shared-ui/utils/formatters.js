/**
 * frontend/shared-ui/utils/formatters.js
 * ----------------------------------------
 * Hàm format dùng chung cho tất cả sub-projects.
 * Import từ @ui: import { formatVND, formatDate, ... } from '@ui';
 *
 * Phủ sóng các hàm trùng lặp từ:
 *  - game/src/utils/dinhDang.ts
 *  - dating/src/utils/formatters.ts
 *  - sports/src/utils/formatters.ts
 *  - trade/src/utils/formatters.ts
 */

// ── VND / Tiền tệ ─────────────────────────────────────────────────────────
/** Format số thành tiền VND. Ví dụ: 1500000 → "1.500.000 ₫" */
export const formatVND = (n) =>
  Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

/** Format số thông thường có dấu phân cách. Ví dụ: 1234567 → "1.234.567" */
export const formatNumber = (n) => Number(n).toLocaleString('vi-VN');

/** Format xu/coins (K suffix). Ví dụ: 1500 → "1.5K", 800 → "800" */
export const formatCoins = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

/** Format số thập phân (US locale). Ví dụ: 1234.56 → "1,234.56" */
export const formatDecimal = (n, decimals = 2) =>
  (n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** Format phần trăm với dấu +/-. Ví dụ: 2.5 → "+2.50%" */
export const fmtPct = (n) => `${n > 0 ? '+' : ''}${formatDecimal(n, 2)}%`;

/** Format khối lượng giao dịch (B/M/K). Ví dụ: 1500000 → "1.5M" */
export const fmtVol = (n) => {
  if (n >= 1_000_000_000) return `${formatDecimal(n / 1_000_000_000, 1)}B`;
  if (n >= 1_000_000)     return `${formatDecimal(n / 1_000_000, 1)}M`;
  if (n >= 1_000)         return `${formatDecimal(n / 1_000, 1)}K`;
  return formatDecimal(n);
};

// ── Ngày / Giờ ────────────────────────────────────────────────────────────
/**
 * Format ngày theo locale vi-VN.
 * @param {string|Date} d
 * @param {Intl.DateTimeFormatOptions} [opts]
 */
export const formatDate = (d, opts) =>
  new Date(d).toLocaleDateString('vi-VN', opts || { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Format giờ:phút theo vi-VN. Ví dụ: "14:30" */
export const formatTime = (d) =>
  new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

/** Format ngày + giờ. Ví dụ: "20/07/2026 14:30" */
export const formatDateTime = (d) => `${formatDate(d)} ${formatTime(d)}`;

/**
 * Format thời gian tương đối (tiếng Việt).
 * Ví dụ: "Vừa xong", "5 phút trước", "2 giờ trước", "3 ngày trước"
 */
export const formatRelativeTime = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'Vừa xong';
  if (mins  < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days  < 7)  return `${days} ngày trước`;
  return formatDate(d);
};

// alias (backward compat cho game/src/utils/dinhDang.ts)
export const relativeTime = formatRelativeTime;

/**
 * Format duration (giây → mm:ss hoặc hh:mm:ss).
 * Ví dụ: 125 → "2:05", 3661 → "1:01:01"
 */
export const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

// ── Điểm số / Thể thao ────────────────────────────────────────────────────
/** Format tỷ số. Ví dụ: (2, 1) → "2 - 1", (null, null) → "-" */
export const formatScore = (home, away) => {
  if (home == null || away == null) return '-';
  return `${home} - ${away}`;
};

// ── Khoảng cách ───────────────────────────────────────────────────────────
/** Format khoảng cách (m/km). Ví dụ: 500 → "500m", 1500 → "1.5 km" */
export const formatDistance = (meters) => {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

// ── Tuổi ──────────────────────────────────────────────────────────────────
/** Tính tuổi từ ngày sinh (ISO string). Ví dụ: "2000-03-15" → 25 */
export const formatAge = (dob) => {
  const birth = new Date(dob);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  return m < 0 || (m === 0 && now.getDate() < birth.getDate()) ? age - 1 : age;
};

// ── Text ──────────────────────────────────────────────────────────────────
/** Cắt chuỗi dài. Ví dụ: truncate("Hello World", 7) → "Hello W..." */
export const truncate = (s, len = 30) =>
  s && s.length > len ? s.slice(0, len) + '...' : (s || '');

/** Clamp số trong khoảng [min, max] */
export const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
