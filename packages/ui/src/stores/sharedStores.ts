// @ts-nocheck
// packages/shared-ui/src/stores/sharedStores.ts
import { create } from 'zustand';
import { api }    from '../api/apiClient';

// ── User shape — extended to support all sub-project needs ─────────────────────
export interface AuthUser {
  id:              string;
  username:        string;
  email:           string;
  balance:         number;
  role:            string;
  fullName?:       string;
  full_name?:      string;
  phone?:          string;
  avatar?:         string;
  referralCode?:   string;
  referral_code?:  string;
  vipLevel?:       number;
  vip_level?:      number;
  level?:          number;
  exp?:            number;
  has_onboarded?:  boolean;
  is_verified?:    boolean;
  bio?:            string;
  dob?:            string;
  city?:           string;
  coins?:          number;
  diamonds?:       number;
  frozen?:         number;
  [key: string]:   any;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Xóa token khỏi localStorage VÀ xóa cookie phía client (fallback) */
function _clearTokenStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.removeItem('refresh_token');
  // Xóa cookie access_token / refresh_token (chỉ hoạt động với cookie không httpOnly)
  // httpOnly cookies được xóa bởi backend qua clearAuthCookies() khi gọi /auth/logout
  document.cookie = 'access_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
}

/** Lưu tokens vào localStorage */
function _saveTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem('token', accessToken);
  localStorage.setItem('access_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthState {
  user:         AuthUser | null;
  token:        string | null;
  refreshToken: string | null;
  isLoggedIn:   boolean;
  isLoading:    boolean;

  login:        (userOrData: AuthUser | Record<string, any>, token?: string) => Promise<void>;
  logout:       () => Promise<void>;
  register:     (data: Record<string, any>) => Promise<void>;
  fetchProfile: () => Promise<void>;
  setUser:      (user: Partial<AuthUser>) => void;

  // setAuth/clearAuth — hub & OAuth callbacks truyền đủ 3 tham số
  setAuth:      (user: AuthUser, accessToken: string, refreshToken?: string) => void;
  clearAuth:    () => void;

  // OAuth social login callback — gọi sau khi backend redirect về frontend
  // với query params: ?oauth=success&project=hub
  handleOAuthCallback: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:         null,
  token:        localStorage.getItem('token') || localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token') || null,
  isLoggedIn:   !!(localStorage.getItem('token') || localStorage.getItem('access_token')),
  isLoading:    false,

  // ── login ─────────────────────────────────────────────────────────────────
  login: async (userOrData, token) => {
    if (token !== undefined) {
      // Gọi trực tiếp với (user, token) — legacy/hub usage
      const u = userOrData as AuthUser;
      _saveTokens(token);
      set({ user: u, token, isLoggedIn: true });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await api.post('/game/auth/login', userOrData);
      const d   = res.data?.data ?? res.data;
      const t   = d?.access_token || d?.token || null;
      const rt  = d?.refresh_token || null;
      if (t) _saveTokens(t, rt ?? undefined);
      set({ user: d?.user ?? d, token: t, refreshToken: rt, isLoggedIn: !!t });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── logout — xóa token local + gọi backend để xóa httpOnly cookie ─────────
  logout: async () => {
    const rt = get().refreshToken;
    try {
      await api.post('/auth/logout', { refresh_token: rt ?? undefined });
    } catch { /* ignore — always clear local state */ }
    _clearTokenStorage();
    set({ user: null, token: null, refreshToken: null, isLoggedIn: false });
  },

  // ── register ──────────────────────────────────────────────────────────────
  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/game/auth/register', data);
      const d   = res.data?.data ?? res.data;
      const t   = d?.access_token || d?.token || null;
      const rt  = d?.refresh_token || null;
      if (t) _saveTokens(t, rt ?? undefined);
      set({ user: d?.user ?? d, token: t, refreshToken: rt, isLoggedIn: !!t });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── fetchProfile ──────────────────────────────────────────────────────────
  fetchProfile: async () => {
    try {
      const res = await api.get('/game/auth/me');
      const u = res.data?.data ?? res.data;
      set({ user: u });
    } catch { /* token expired — logout will handle */ }
  },

  setUser: (partial) => {
    const current = get().user;
    if (current) set({ user: { ...current, ...partial } });
  },

  // ── setAuth — dùng sau khi login/register thành công (hub, OAuth) ─────────
  setAuth: (user, accessToken, refreshToken) => {
    _saveTokens(accessToken, refreshToken);
    set({
      user,
      token:        accessToken,
      refreshToken: refreshToken ?? get().refreshToken,
      isLoggedIn:   true,
    });
  },

  clearAuth: () => {
    _clearTokenStorage();
    set({ user: null, token: null, refreshToken: null, isLoggedIn: false });
  },

  // ── handleOAuthCallback ───────────────────────────────────────────────────
  // Gọi khi frontend load lại sau OAuth redirect.
  // Backend đã set cookies access_token + refresh_token (httpOnly).
  // Frontend chỉ cần fetch /auth/me để lấy user info.
  // Token được gửi qua cookie — withCredentials:true đảm bảo cookie kèm theo.
  handleOAuthCallback: async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') !== 'success') return;

    set({ isLoading: true });
    try {
      // Cookie đã được set bởi backend — gọi /me để lấy user
      const res = await api.get('/auth/me');
      const user = res.data?.data ?? res.data;
      // Token trong cookie không accessible từ JS (httpOnly) → không lưu vào localStorage
      // Auth sẽ hoạt động thuần qua cookie + withCredentials
      set({ user, isLoggedIn: true });
      // Xóa query params OAuth khỏi URL
      window.history.replaceState({}, '', window.location.pathname);
    } catch {
      set({ isLoggedIn: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));

// ── UI ────────────────────────────────────────────────────────────────────────
interface UIState {
  loading:        boolean;
  sideOpen:       boolean;
  theme:          'light' | 'dark';
  darkMode:       boolean;
  setLoading:     (v: boolean) => void;
  toggleSide:     () => void;
  setTheme:       (t: 'light' | 'dark') => void;
  toggleDarkMode: () => void;
}
export const useUIStore = create<UIState>((set) => ({
  loading:        false,
  sideOpen:       false,
  theme:          'dark',
  darkMode:       true,
  setLoading:     (loading)  => set({ loading }),
  toggleSide:     ()         => set((s) => ({ sideOpen: !s.sideOpen })),
  setTheme:       (theme)    => set({ theme, darkMode: theme === 'dark' }),
  toggleDarkMode: ()         => set((s) => ({
    darkMode: !s.darkMode,
    theme:    s.darkMode ? 'light' : 'dark',
  })),
}));

// ── Wallet ────────────────────────────────────────────────────────────────────
interface WalletState {
  balance:      number;
  frozen:       number;
  currency:     string;
  isLoading:    boolean;
  setBalance:   (balance: number, frozen?: number) => void;
  fetchBalance: () => Promise<void>;
  reset:        () => void;
}
export const useWalletStore = create<WalletState>((set) => ({
  balance:      0,
  frozen:       0,
  currency:     'VND',
  isLoading:    false,

  setBalance: (balance, frozen = 0) => set({ balance, frozen }),

  fetchBalance: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/game/wallet/balance');
      const { balance, frozen = 0 } = res.data?.data ?? res.data;
      set({ balance: Number(balance) || 0, frozen: Number(frozen) || 0 });
    } catch { /* silently fail — keeps last known balance */ }
    finally { set({ isLoading: false }); }
  },

  reset: () => set({ balance: 0, frozen: 0 }),
}));
