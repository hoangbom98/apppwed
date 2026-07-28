// frontend/admin-dashboard/src/api/client.ts
// Dedicated Axios instance for the admin dashboard.
//
// Token storage key: "admin_token" (NEVER shared with user-facing sub-projects).
// Token sources (priority order):
//   1. localStorage "admin_token"          — primary (Bearer header)
//   2. Cookie "admin_access_token"         — fallback for browser SPA (GAP-3)
//
// Auto-inject X-Project header from current URL path so projectResolver
// middleware can resolve req.project without manual header on every call.
//
// Refresh token rotation (GAP — backend v2):
//   On 401, retry once with localStorage "admin_refresh_token".
import axios, {
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Project detection from current URL ────────────────────────────────────────
const PROJECT_PREFIXES = ['game', 'dating', 'sports', 'trade', 'hub', 'lkvip'] as const;
type ProjectPrefix = typeof PROJECT_PREFIXES[number];

function detectProjectFromPath(): ProjectPrefix | null {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length > 0 && PROJECT_PREFIXES.includes(parts[0] as ProjectPrefix)) {
    return parts[0] as ProjectPrefix;
  }
  return null;
}

// ── Axios instance ─────────────────────────────────────────────────────────────
const client = axios.create({
  baseURL:         API_BASE,
  withCredentials: true,   // Gửi kèm cookie admin_access_token tự động
});

// ── Request interceptor ────────────────────────────────────────────────────────
client.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  // Auth: localStorage Bearer token
  const token = localStorage.getItem('admin_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;

  // X-Project: auto-detect from URL
  if (!cfg.headers['X-Project']) {
    const project = detectProjectFromPath();
    if (project) cfg.headers['X-Project'] = project;
  }

  return cfg;
});

// ── Refresh token rotation ─────────────────────────────────────────────────────
let _refreshing = false;
let _queue: Array<(token: string | null) => void> = [];

function _flushQueue(token: string | null) {
  _queue.forEach(cb => cb(token));
  _queue = [];
}

async function _tryAdminRefresh(): Promise<string | null> {
  const rt = localStorage.getItem('admin_refresh_token');
  if (!rt) return null;
  try {
    const res      = await axios.post(`${API_BASE}/admin/auth/refresh`, { refresh_token: rt }, { withCredentials: true });
    const { access_token, token } = res.data?.data ?? res.data ?? {};
    const newToken = access_token || token || null;
    if (newToken) {
      localStorage.setItem('admin_token', newToken);
      const newRt = res.data?.data?.refresh_token || null;
      if (newRt) localStorage.setItem('admin_refresh_token', newRt);
    }
    return newToken;
  } catch {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    return null;
  }
}

// ── Response interceptor ───────────────────────────────────────────────────────
client.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _queue.push(token => {
            if (!token) { reject(err); return; }
            original.headers.Authorization = `Bearer ${token}`;
            resolve(client(original));
          });
        });
      }

      _refreshing = true;
      const newToken = await _tryAdminRefresh();
      _refreshing = false;
      _flushQueue(newToken);

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original);
      }

      // Refresh thất bại → về trang login
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    return Promise.reject(err);
  },
);

export default client;
