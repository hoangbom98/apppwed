import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// ─── Base client factory ──────────────────────────────────────────────────────

export const createApiClient = (baseURL: string, config?: AxiosRequestConfig): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
    ...config,
  });
};

// ─── Token store (in-memory, per-tab) ─────────────────────────────────────────

let _accessToken: string | null = null;

export const tokenStore = {
  get: (): string | null => _accessToken,
  set: (token: string): void => { _accessToken = token; },
  clear: (): void => { _accessToken = null; },
};

// ─── Auth-aware client ────────────────────────────────────────────────────────

/**
 * createAuthClient — Axios instance với:
 *   - Bearer token tự động từ tokenStore
 *   - Auto-refresh khi nhận 401 (một lần, tránh loop)
 *   - withCredentials: true để gửi cookie refresh_token
 *
 * Dùng cho tất cả SPA (Hub, Trading, Game, Dating, Sports).
 *
 * @param baseURL  Base API URL, mặc định từ VITE_API_URL
 * @param project  Project key khớp với JWT claim ('hub'|'trade'|'game'|'dating'|'sports')
 */
export const createAuthClient = (
  baseURL?: string,
  project?: string,
): AxiosInstance => {
  const base = baseURL ?? (
    typeof import.meta !== 'undefined'
      ? (import.meta as Record<string, Record<string, string>>).env?.VITE_API_URL
      : process.env.VITE_API_URL
  ) ?? 'http://localhost:5000';

  const client = axios.create({
    baseURL: base,
    timeout: 15000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  // ── Request: inject Bearer token ─────────────────────────────────────────
  client.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
    const token = tokenStore.get();
    if (token) {
      cfg.headers = cfg.headers ?? {};
      cfg.headers['Authorization'] = `Bearer ${token}`;
    }
    if (project) {
      cfg.headers = cfg.headers ?? {};
      cfg.headers['X-Project'] = project;
    }
    return cfg;
  });

  // ── Response: auto-refresh on 401 ────────────────────────────────────────
  let _refreshing = false;
  let _queue: Array<(token: string) => void> = [];

  const processQueue = (token: string) => {
    _queue.forEach((cb) => cb(token));
    _queue = [];
  };

  client.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (err) => {
      const originalReq = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
      if (err.response?.status !== 401 || originalReq._retry) {
        return Promise.reject(err);
      }
      originalReq._retry = true;

      if (_refreshing) {
        return new Promise((resolve) => {
          _queue.push((token) => {
            originalReq.headers['Authorization'] = `Bearer ${token}`;
            resolve(client(originalReq));
          });
        });
      }

      _refreshing = true;
      try {
        const refreshUrl = `${base}/api/${project ?? 'hub'}/auth/refresh`;
        const { data } = await axios.post(refreshUrl, {}, { withCredentials: true });
        const newToken: string = data.access_token ?? data.accessToken ?? data.token;
        tokenStore.set(newToken);
        processQueue(newToken);
        originalReq.headers['Authorization'] = `Bearer ${newToken}`;
        return client(originalReq);
      } catch (refreshErr) {
        tokenStore.clear();
        _queue = [];
        return Promise.reject(refreshErr);
      } finally {
        _refreshing = false;
      }
    },
  );

  return client;
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  username?: string;
  role: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

/**
 * createAuthService — Wrapper gọi login/register/logout/me cho một project.
 * Dùng instance từ createAuthClient() để tự động quản lý token.
 */
export const createAuthService = (client: AxiosInstance, project: string) => ({
  login: async (payload: LoginPayload): Promise<AuthTokens> => {
    const { data } = await client.post(`/api/${project}/auth/login`, payload);
    if (data.data?.access_token) tokenStore.set(data.data.access_token);
    return data.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthTokens> => {
    const { data } = await client.post(`/api/${project}/auth/register`, payload);
    if (data.data?.access_token) tokenStore.set(data.data.access_token);
    return data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await client.post(`/api/${project}/auth/logout`);
    } finally {
      tokenStore.clear();
    }
  },

  me: async (): Promise<AuthUser> => {
    const { data } = await client.get(`/api/${project}/auth/me`);
    return data.data;
  },

  refresh: async (): Promise<string> => {
    const { data } = await client.post(`/api/${project}/auth/refresh`);
    const token: string = data.data?.access_token ?? data.access_token;
    tokenStore.set(token);
    return token;
  },
});
