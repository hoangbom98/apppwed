// packages/shared-ui/src/formatters.ts
// Shared formatting utilities for all frontend apps

/** Format số tiền VND: 1500000 → "1.500.000 ₫" */
export function formatVND(amount: number | string): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

/** Format số có dấu phẩy: 1500000 → "1,500,000" */
export function formatNumber(num: number | string, decimals = 0): string {
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Format date: "2024-01-15" → "15/01/2024" */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('vi-VN');
}

/** Format time: "14:30:00" */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/** Format datetime: "15/01/2024 14:30" */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

/** Format relative time: "2 giờ trước" */
export function formatRelativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)    return 'vừa xong';
  if (mins < 60)   return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 30)   return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  return `${Math.floor(months / 12)} năm trước`;
}
export const relativeTime = formatRelativeTime;

/** Format duration in seconds → "1:30:00" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/** Format score / points — also accepts (homeScore, awayScore) for match display */
export function formatScore(score: number | string, awayScore?: number | string): string {
  if (awayScore !== undefined) return `${score ?? '-'} - ${awayScore ?? '-'}`;
  const n = Number(score);
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(score);
}

/** Format distance in meters */
export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

/** Format age from birthdate */
export function formatAge(birthDate: string | Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Truncate string */
export function truncate(str: string, len = 50): string {
  return str.length > len ? `${str.slice(0, len)}...` : str;
}

/** Clamp number between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/** Format coins/points */
export function formatCoins(amount: number): string {
  return formatNumber(amount) + ' xu';
}

/** Format decimal with fixed places */
export function formatDecimal(num: number, places = 2): string {
  return num.toFixed(places);
}

/** Format percentage: 0.756 → "75.60%" */
export function fmtPct(val: number, places = 2): string {
  return (val * 100).toFixed(places) + '%';
}

/** Format volume (compact): 1500000 → "1.5M" */
export function fmtVol(val: number): string {
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return String(val);
}
