// @ts-nocheck
// packages/shared-ui/src/api/apiClient.ts
// Shared Axios instance — hỗ trợ:
//   1. Bearer token (Authorization header)  — API clients, mobile
//   2. Cookie fallback (access_token)        — browser SPA (GAP-3 backend fix)
//   3. Refresh token rotation                — tự động renew khi access hết hạn
//   4. buildFormData()                       — serialize nested JSON fields cho
//      multipart/form-data (tương thích parseNestedFields middleware — GAP-1)
import axios, {
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios';

export const api = axios.create({
  baseURL:         '/api',
  timeout:         30_000,
  withCredentials: true,    // Gửi kèm cookie access_token/refresh_token tự động
  headers:         { 'Content-Type': 'application/json' },
});

// ── Request interceptor: đính kèm Bearer token ────────────────────────────────
// Token ưu tiên: localStorage 'token' → localStorage 'access_token'
// Cookie access_token được trình duyệt gửi tự động qua withCredentials.
api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Refresh token rotation ────────────────────────────────────────────────────
// Khi access token hết hạn (401), thử refresh một lần rồi retry request gốc.
// Đồng thời queuing các request concurrent trong lúc đang refresh.
let _refreshing = false;
let _queue: Array<(token: string | null) => void> = [];

function _flushQueue(token: string | null) {
  _queue.forEach((cb) => cb(token));
  _queue = [];
}

async function _tryRefresh(): Promise<string | null> {
  const rt =
    localStorage.getItem('refresh_token') ||
    sessionStorage.getItem('refresh_token');
  if (!rt) return null;

  try {
    // Endpoint dùng refresh_token từ body (cookie được gửi tự động song song)
    const res = await axios.post(
      '/api/auth/refresh',
      { refresh_token: rt },
      { withCredentials: true },
    );
    const { access_token, token } = res.data?.data ?? res.data ?? {};
    const newToken = access_token || token || null;
    if (newToken) {
      localStorage.setItem('token', newToken);
      // Nếu server trả về refresh token mới thì lưu lại (rotation)
      const newRt = res.data?.data?.refresh_token || null;
      if (newRt) localStorage.setItem('refresh_token', newRt);
    }
    return newToken;
  } catch {
    // Refresh thất bại → xoá tokens, trả null
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('access_token');
    return null;
  }
}

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Chỉ thử refresh khi 401 và chưa retry lần nào
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (_refreshing) {
        // Đang refresh → queue request, đợi token mới
        return new Promise((resolve, reject) => {
          _queue.push((token) => {
            if (!token) { reject(err); return; }
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      _refreshing = true;
      const newToken = await _tryRefresh();
      _refreshing = false;
      _flushQueue(newToken);

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      // Refresh thất bại → redirect đăng nhập
      window.location.href = '/login';
      return Promise.reject(err);
    }

    return Promise.reject(err);
  },
);

// ── buildFormData — serialize nested object cho parseNestedFields middleware ───
// Khi upload file kèm JSON nested, backend dùng parseNestedFields để parse
// "personal.first_name" → { personal: { first_name } }.
//
// Ví dụ:
//   const fd = buildFormData({ 'personal.first_name': 'An', avatar: file });
//   api.patch('/hub/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
//
// Hoặc với object lồng nhau (tự động flatten):
//   buildFormData({ personal: { first_name: 'An' }, avatar: file })
//   → FormData("personal.first_name" = "An", "avatar" = file)
export function buildFormData(
  data: Record<string, unknown>,
  form?: FormData,
  prefix?: string,
): FormData {
  const fd = form ?? new FormData();

  for (const [key, value] of Object.entries(data)) {
    const fieldName = prefix ? `${prefix}.${key}` : key;

    if (value instanceof File || value instanceof Blob) {
      fd.append(fieldName, value);
    } else if (Array.isArray(value)) {
      // Arrays: serialize as JSON string (backend can JSON.parse)
      fd.append(fieldName, JSON.stringify(value));
    } else if (value !== null && typeof value === 'object') {
      // Nested object → recurse with dot-notation prefix
      buildFormData(value as Record<string, unknown>, fd, fieldName);
    } else if (value !== undefined && value !== null) {
      fd.append(fieldName, String(value));
    }
  }

  return fd;
}
