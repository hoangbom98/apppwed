/**
 * Shared formatter utilities — dùng chung toàn bộ admin dashboard.
 * Import: `import { fmtVND, fmtNum, fmtPct, fmtDate, fmtTime, fmtUptime, fmtBytes } from '@admin/modules/shared/utils/formatters'`
 */

/** Format số tiền VND ngắn gọn (compact): 1,234,567 → "1,2M đ" */
export const fmtVNDCompact = (n: number | null | undefined): string => {
  if (n == null) return '—';
  return new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n)) + 'đ';
};

/** Format số tiền VND đầy đủ: 1234567 → "1.234.567 ₫" */
export const fmtVND = (n: number | null | undefined): string => {
  if (n == null) return '—';
  return Number(n).toLocaleString('vi-VN') + ' ₫';
};

/** Format số nguyên với dấu phân cách: 1234567 → "1.234.567" */
export const fmtNum = (n: number | null | undefined): string => {
  if (n == null) return '—';
  return Number(n).toLocaleString('vi-VN');
};

/** Format phần trăm: 0.1234 → "12.3%" */
export const fmtPct = (n: number | null | undefined): string => {
  if (n == null) return '—';
  return Number(n).toFixed(1) + '%';
};

/** Format thời gian theo locale VN: Date → "14:35:22" */
export const fmtTime = (s: Date | string | null | undefined): string => {
  if (!s) return '—';
  return new Date(s).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

/** Format ngày tháng: Date → "15/07/2025" */
export const fmtDate = (s: Date | string | null | undefined): string => {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('vi-VN');
};

/** Format ngày + giờ: Date → "15/07/2025 14:35" */
export const fmtDateTime = (s: Date | string | null | undefined): string => {
  if (!s) return '—';
  return new Date(s).toLocaleString('vi-VN');
};

/** Format uptime (giây) → "2d 3h 15m" */
export const fmtUptime = (seconds: number | null | undefined): string => {
  if (!seconds) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

/** Format bytes → "128 MB" */
export const fmtBytes = (bytes: number | null | undefined): string => {
  if (!bytes) return '—';
  return (bytes / 1024 / 1024).toFixed(0) + ' MB';
};
