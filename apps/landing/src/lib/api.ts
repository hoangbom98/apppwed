import { createApi } from '@lkvip/shared/lib/api';

/**
 * Axios instance cho Landing (Omnis Properties).
 * - tokenKey: 'accessToken' (khác với admin 'admin_token')
 * - VITE_API_BASE_URL: URL của landing/server (Node + Express)
 */
const api = createApi({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  tokenKey: 'accessToken',
  refreshTokenKey: 'refreshToken',
  loginPath: '/login',
});

// Wrapper tương thích với các pages đang dùng { data } = await api.get(...)
export { api };
export default api;
