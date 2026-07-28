/**
 * apiClient — shared Axios instance for all LKVIP frontend apps.
 *
 * Features:
 *  - Auto-inject Bearer token from TokenManager
 *  - Silent token refresh on 401 (single retry per request)
 *  - Project header injection via VITE_PROJECT env var
 *  - Redirect to /login after failed refresh
 */
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { TokenManager } from './TokenManager';

// Build base URL from env (Vite)
const BASE_URL = (import.meta as any)?.env?.VITE_API_URL ?? '/api';
const PROJECT   = (import.meta as any)?.env?.VITE_PROJECT ?? '';

export const apiClient = axios.create({
  baseURL:         BASE_URL,
  timeout:         30_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    ...(PROJECT ? { 'X-Project': PROJECT } : {}),
  },
});

// Track ongoing refresh so parallel 401s only trigger one refresh call
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = TokenManager.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
    const { accessToken, refreshToken: newRefresh } = res.data;
    TokenManager.setTokens(accessToken, newRefresh ?? refreshToken);
    return accessToken;
  } catch {
    TokenManager.clearTokens();
    return null;
  }
}

// Request interceptor — inject access token
apiClient.interceptors.request.use((config) => {
  const token = TokenManager.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — silent refresh on 401
apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (err) => {
    const original = err.config as AxiosRequestConfig & { _retry?: boolean };
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      // Deduplicate: if refresh is already in flight, wait for it
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return apiClient(original);
      }
      // Refresh failed — redirect to login
      TokenManager.clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default apiClient;
