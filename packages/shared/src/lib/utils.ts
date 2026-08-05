import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes an toàn — tránh xung đột class */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Tối ưu URL ảnh Cloudinary (resize, format auto, quality auto) */
export function cloudinaryUrl(
  url: string,
  opts: { width?: number; height?: number; quality?: string; format?: string } = {},
): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  const { width, height, quality = 'auto', format = 'auto' } = opts;
  const [base, rest] = url.split('/upload/');
  let t = `f_${format},q_${quality}`;
  if (width) t += `,w_${width}`;
  if (height) t += `,h_${height},c_fill`;
  return `${base}/upload/${t}/${rest}`;
}

/** Format tiền AED (Dubai) */
export function formatAED(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format tiền VND */
export function formatCurrency(amount: number, currency = 'VND'): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Rút gọn chuỗi text */
export function truncate(str: string, max = 100): string {
  return str.length <= max ? str : `${str.slice(0, max)}…`;
}

/** Chuyển slug thành title */
export function slugToTitle(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Định dạng ngày tháng theo locale */
export function formatDate(date: string | Date, locale = 'en-AE'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}
