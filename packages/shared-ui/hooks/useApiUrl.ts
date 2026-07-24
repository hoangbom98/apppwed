/// <reference types="vite/client" />
/**
 * useApiUrl.ts
 * Hook resolve đúng API base URL cho cả web và Capacitor native app.
 *
 * Problem: Khi chạy trong Capacitor WebView, /api proxy KHÔNG hoạt động
 * vì không có dev server. Cần gọi trực tiếp đến backend URL.
 *
 * Solution:
 *   - Web (npm run dev) → proxy '/api' → localhost:5000 (vite.config.ts)
 *   - Native app (Capacitor) → gọi trực tiếp API_BASE_URL
 *
 * Đặt tại: frontend/shared-ui/hooks/useApiUrl.ts
 */

import { isNativeApp } from './useCapacitor';

// ─── Config ────────────────────────────────────────────────────────────────────
// QUAN TRỌNG: Thay đổi URL này theo môi trường của bạn
const API_URLS = {
  // Production backend (HTTPS)
  production: 'https://api.your-domain.com',

  // Dev: IP của máy tính trong mạng LAN (Android emulator dùng 10.0.2.2)
  // Thiết bị thật trong cùng WiFi: dùng IP LAN, ví dụ 192.168.1.100
  android_emulator: 'http://10.0.2.2:5000',
  android_device:   'http://192.168.1.100:5000',  // ← Thay IP thực của bạn

  // iOS Simulator: localhost hoạt động bình thường
  ios: 'http://localhost:5000',
} as const;

// ─── Helper ────────────────────────────────────────────────────────────────────
function getCapacitorPlatform(): string {
  const cap = typeof window !== 'undefined' ? (window as any).Capacitor : null;
  return cap?.isNativePlatform() ? cap.getPlatform() : 'web';
}

/**
 * Trả về base URL cho API calls.
 * - Web: '' (rỗng, dùng proxy của vite)
 * - Native: URL đầy đủ đến backend
 */
export function getApiBaseUrl(): string {
  if (!isNativeApp()) return '';  // Web: dùng Vite proxy

  const platform = getCapacitorPlatform();

  // Sử dụng env variable nếu có (set khi build production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Dev defaults
  if (platform === 'android') return API_URLS.android_emulator;
  if (platform === 'ios')     return API_URLS.ios;
  return '';
}

/**
 * Tạo axios instance với baseURL đúng cho môi trường hiện tại.
 * Sử dụng trong các api/ files thay vì hardcode baseURL.
 *
 * Ví dụ usage:
 * ```ts
 * import axios from 'axios';
 * import { getApiBaseUrl } from '@ui/hooks/useApiUrl';
 *
 * const api = axios.create({ baseURL: getApiBaseUrl() + '/api' });
 * ```
 */
export function createApiInstance() {
  // Dynamic import để tránh circular
  const baseURL = getApiBaseUrl() + '/api';
  return baseURL;
}
