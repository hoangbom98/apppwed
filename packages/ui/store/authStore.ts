// @ts-nocheck
import { create } from 'zustand';
import api from '../api/client';

const project = import.meta.env.VITE_PROJECT || 'hub';
const tokenKey = `${project}_access_token`;
const refreshTokenKey = `${project}_refresh_token`;
const userKey = `${project}_user`;

export const useAuthStore = create((set, get) => ({
  user: (() => {
    try {
      return JSON.parse(localStorage.getItem(userKey) || 'null');
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem(tokenKey) || null,
  isLoggedIn: !!localStorage.getItem(tokenKey),
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await api.post(`/${project}/auth/login`, credentials);
      const data = res.data.data || res.data;
      const finalToken = data.access_token || data.token;
      const user = data.user || data;

      localStorage.setItem(tokenKey, finalToken);
      if (data.refresh_token) {
        localStorage.setItem(refreshTokenKey, data.refresh_token);
      }
      localStorage.setItem(userKey, JSON.stringify(user));
      set({ user, token: finalToken, isLoggedIn: true, isLoading: false });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await api.post(`/${project}/auth/register`, payload);
      const data = res.data.data || res.data;
      const finalToken = data.access_token || data.token;
      const user = data.user || data;

      localStorage.setItem(tokenKey, finalToken);
      if (data.refresh_token) {
        localStorage.setItem(refreshTokenKey, data.refresh_token);
      }
      localStorage.setItem(userKey, JSON.stringify(user));
      set({ user, token: finalToken, isLoggedIn: true, isLoading: false });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(refreshTokenKey);
    localStorage.removeItem(userKey);
    set({ user: null, token: null, isLoggedIn: false });
  },

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem(tokenKey, accessToken);
    if (refreshToken) {
      localStorage.setItem(refreshTokenKey, refreshToken);
    }
    localStorage.setItem(userKey, JSON.stringify(user));
    set({ user, token: accessToken, isLoggedIn: true });
  },

  clearAuth: () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(refreshTokenKey);
    localStorage.removeItem(userKey);
    set({ user: null, token: null, isLoggedIn: false });
  },

  setUser: (u) => set((s) => ({ user: s.user ? { ...s.user, ...u } : null })),

  fetchProfile: async () => {
    try {
      const res = await api.get(`/${project}/auth/profile`);
      const user = res.data.data || res.data.user || res.data;
      localStorage.setItem(userKey, JSON.stringify(user));
      set({ user });
    } catch {
      get().logout();
    }
  },
}));
