import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosError,
} from 'axios';

// ── Cấu hình mặc định ─────────────────────────────────────────────────────────

export interface ApiConfig {
  /** Base URL của backend API */
  baseURL: string;
  /** localStorage key chứa access token. Default: 'accessToken' */
  tokenKey?: string;
  /** localStorage key chứa refresh token. Default: 'refreshToken' */
  refreshTokenKey?: string;
  /** Path redirect khi 401 và không refresh được. Default: '/login' */
  loginPath?: string;
  /** Endpoint refresh token. Nếu không truyền, không tự refresh. */
  refreshEndpoint?: string;
}

// ── Factory tạo Axios instance được cấu hình đầy đủ ──────────────────────────

/**
 * Tạo một Axios instance với interceptors đầy đủ:
 * - Tự động đính kèm Bearer token từ localStorage
 * - Tự động redirect /login khi 401 (và refresh thất bại)
 * - Optional: Tự động refresh token khi hết hạn
 *
 * @example
 * // Landing server (Omnis)
 * export const api = createApi({ baseURL: import.meta.env.VITE_API_BASE_URL || '', tokenKey: 'accessToken' });
 *
 * // Admin LKVIP
 * export const client = createApi({ baseURL: import.meta.env.VITE_API_URL || '/api', tokenKey: 'admin_token' });
 */
export function createApi(config: ApiConfig | string): AxiosInstance {
  // Hỗ trợ cả dạng string (legacy) và object
  const cfg: ApiConfig = typeof config === 'string'
    ? { baseURL: config }
    : config;

  const {
    baseURL,
    tokenKey = 'accessToken',
    refreshTokenKey = 'refreshToken',
    loginPath = '/login',
    refreshEndpoint,
  } = cfg;

  const instance = axios.create({
    baseURL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  // ── Request: đính kèm Bearer ────────────────────────────────────────────────
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(tokenKey);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // ── Response: xử lý 401 ─────────────────────────────────────────────────────
  let _refreshing = false;
  let _queue: Array<(token: string | null) => void> = [];

  const flushQueue = (token: string | null) => {
    _queue.forEach(cb => cb(token));
    _queue = [];
  };

  instance.interceptors.response.use(
    res => res,
    async (err: AxiosError) => {
      const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (err.response?.status === 401 && !original._retry && refreshEndpoint) {
        original._retry = true;

        if (_refreshing) {
          return new Promise((resolve, reject) => {
            _queue.push(token => {
              if (!token) { reject(err); return; }
              original.headers.Authorization = `Bearer ${token}`;
              resolve(instance(original));
            });
          });
        }

        _refreshing = true;
        let newToken: string | null = null;

        try {
          const rt = localStorage.getItem(refreshTokenKey);
          if (!rt) throw new Error('no refresh token');
          const res = await axios.post(refreshEndpoint, { refresh_token: rt }, { withCredentials: true });
          newToken = res.data?.data?.access_token ?? res.data?.access_token ?? null;
          if (newToken) {
            localStorage.setItem(tokenKey, newToken);
            const newRt = res.data?.data?.refresh_token ?? null;
            if (newRt) localStorage.setItem(refreshTokenKey, newRt);
          }
        } catch {
          localStorage.removeItem(tokenKey);
          localStorage.removeItem(refreshTokenKey);
        }

        _refreshing = false;
        flushQueue(newToken);

        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return instance(original);
        }

        window.location.href = loginPath;
        return Promise.reject(err);
      }

      // 401 không có refresh → xoá token và redirect
      if (err.response?.status === 401 && !original._retry && !refreshEndpoint) {
        localStorage.removeItem(tokenKey);
        if (window.location.pathname !== loginPath) {
          window.location.href = loginPath;
        }
      }

      return Promise.reject(err);
    },
  );

  return instance;
}
