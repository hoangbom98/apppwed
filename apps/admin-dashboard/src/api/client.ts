// frontend/admin-dashboard/src/api/client.ts
// Dedicated Axios instance for the admin dashboard.
// Uses a separate localStorage key ("admin_token") that is NEVER shared with
// any user-facing sub-project.
//
// Auto-injects X-Project header based on current URL path so the backend
// projectResolver middleware can resolve req.project without needing a
// manual header on every call site.
//   /game/rounds  → X-Project: game
//   /dating/users → X-Project: dating
//   /hub/news     → X-Project: hub
//   (no prefix)   → header omitted; backend falls back to admin
import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Project detection from current URL ────────────────────────────────────────
const PROJECT_PREFIXES = ['game', 'dating', 'sports', 'trade', 'hub', 'lkvip'] as const;
type ProjectPrefix = typeof PROJECT_PREFIXES[number];

function detectProjectFromPath(): ProjectPrefix | null {
  const parts = window.location.pathname.split('/').filter(Boolean);
  // pathname like /game/rounds → parts[0] === 'game'
  if (parts.length > 0 && PROJECT_PREFIXES.includes(parts[0] as ProjectPrefix)) {
    return parts[0] as ProjectPrefix;
  }
  return null;
}

// ── Axios instance ─────────────────────────────────────────────────────────────
const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  // Auth token
  const token = localStorage.getItem('admin_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;

  // X-Project — auto-detect from URL; can be overridden by passing the header explicitly
  if (!cfg.headers['X-Project']) {
    const project = detectProjectFromPath();
    if (project) cfg.headers['X-Project'] = project;
  }

  return cfg;
});

client.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
