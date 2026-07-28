import { create } from 'zustand';
import api from '../api/client';

const PROJECT = 'trade';
const TOKEN_KEY = `${PROJECT}_access_token`;
const USER_KEY  = `${PROJECT}_user`;

interface User {
  id: string;
  email: string;
  fullName?: string;
  avatar?: string;
  kycStatus: string;
  memberLevel: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
  })(),
  token: localStorage.getItem(TOKEN_KEY),
  isLoggedIn: !!localStorage.getItem(TOKEN_KEY),
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data: res } = await api.post(`/${PROJECT}/auth/login`, credentials);
      const payload = res.data ?? res;
      const token = payload.access_token ?? payload.token;
      const user  = payload.user ?? payload;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, token, isLoggedIn: true, isLoading: false });
      return user as User;
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, isLoggedIn: false });
  },

  fetchProfile: async () => {
    try {
      const { data: res } = await api.get(`/${PROJECT}/auth/me`);
      const user = res.data ?? res;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user: user as User, isLoggedIn: true });
    } catch {
      get().logout();
    }
  },
}));
