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
  // common optional fields
  fullName?:       string;
  full_name?:      string;    // snake_case alias
  phone?:          string;
  avatar?:         string;
  referralCode?:   string;
  referral_code?:  string;    // snake_case alias
  // VIP / level system
  vipLevel?:       number;
  vip_level?:      number;    // snake_case alias
  level?:          number;
  exp?:            number;
  // Dating-specific fields
  has_onboarded?:  boolean;
  is_verified?:    boolean;
  bio?:            string;
  dob?:            string;
  city?:           string;
  coins?:          number;
  diamonds?:       number;
  // Sports / game extras
  frozen?:         number;
  [key: string]:   any;       // allow app-specific extension without casts
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthState {
  user:      AuthUser | null;
  token:     string | null;
  isLoggedIn: boolean;
  isLoading:  boolean;

  // Two-arg login (user, token) — kept for hub compat
  login:     (userOrData: AuthUser | Record<string, any>, token?: string) => Promise<void>;
  logout:    () => void;
  register:  (data: Record<string, any>) => Promise<void>;
  fetchProfile: () => Promise<void>;
  setUser:   (user: Partial<AuthUser>) => void;

  // setAuth/clearAuth pattern (hub uses 3 args: user, accessToken, refreshToken)
  setAuth:   (user: AuthUser, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:       null,
  token:      localStorage.getItem('token'),
  isLoggedIn: !!localStorage.getItem('token'),
  isLoading:  false,

  login: async (userOrData, token) => {
    // If called with (user, token) directly — hub/legacy usage
    if (token !== undefined) {
      const u = userOrData as AuthUser;
      localStorage.setItem('token', token);
      set({ user: u, token, isLoggedIn: true });
      return;
    }
    // Called with form data — perform API login
    set({ isLoading: true });
    try {
      const res = await api.post('/game/auth/login', userOrData);
      const { token: t, user: u } = res.data.data ?? res.data;
      if (t) localStorage.setItem('token', t);
      set({ user: u, token: t, isLoggedIn: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isLoggedIn: false });
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/game/auth/register', data);
      const { token: t, user: u } = res.data.data ?? res.data;
      if (t) localStorage.setItem('token', t);
      set({ user: u, token: t, isLoggedIn: !!t });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/game/auth/me');
      const u = res.data.data ?? res.data;
      set({ user: u });
    } catch { /* token expired — ignore, logout will handle */ }
  },

  setUser: (partial) => {
    const current = get().user;
    if (current) set({ user: { ...current, ...partial } });
  },

  setAuth: (user, accessToken, _rt) => {
    localStorage.setItem('token', accessToken);
    set({ user, token: accessToken, isLoggedIn: true });
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isLoggedIn: false });
  },
}));

// ── UI ────────────────────────────────────────────────────────────────────────
interface UIState {
  loading:        boolean;
  sideOpen:       boolean;
  theme:          'light' | 'dark';
  // darkMode alias — used by game sub-project
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
      const { balance, frozen = 0 } = res.data.data ?? res.data;
      set({ balance: Number(balance) || 0, frozen: Number(frozen) || 0 });
    } catch { /* silently fail — keeps last known balance */ }
    finally { set({ isLoading: false }); }
  },

  reset: () => set({ balance: 0, frozen: 0 }),
}));
