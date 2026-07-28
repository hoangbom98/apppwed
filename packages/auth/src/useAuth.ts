/**
 * useAuth — shared React hook for authentication state.
 *
 * Manages: login, logout, token refresh, user profile fetch.
 * Persists access + refresh tokens via TokenManager.
 * Compatible with all LKVIP sub-apps (hub, game, trade, dating, sports).
 */
import { useState, useCallback } from 'react';
import { TokenManager } from './TokenManager';
import apiClient from './apiClient';

export interface AuthUser {
  id:              string;
  email:           string;
  phone?:          string;
  fullName?:       string;
  avatar?:         string;
  role:            string;
  kycStatus?:      string;
  twoFactorEnabled?: boolean;
  [key: string]: unknown;
}

export interface LoginCredentials {
  email?:    string;
  phone?:    string;
  username?: string;
  password:  string;
  twoFactorCode?: string;
}

export interface AuthState {
  user:        AuthUser | null;
  token:       string | null;
  isLoggedIn:  boolean;
  isLoading:   boolean;
  error:       string | null;
  login:       (creds: LoginCredentials, project?: string) => Promise<void>;
  logout:      () => Promise<void>;
  fetchProfile:() => Promise<void>;
}

/**
 * @param project — project key: 'hub' | 'game' | 'trade' | 'dating' | 'sports'
 *                  Used to select the correct auth endpoint: /api/<project>/auth/login
 */
export function useAuth(project: string = 'hub'): AuthState {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [token,     setToken]     = useState<string | null>(TokenManager.getAccessToken());
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const login = useCallback(async (creds: LoginCredentials, proj = project) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.post(`/${proj}/auth/login`, creds);
      const { accessToken, refreshToken, user: u } = res.data;
      TokenManager.setTokens(accessToken, refreshToken);
      setToken(accessToken);
      setUser(u ?? null);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Đăng nhập thất bại';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post(`/${project}/auth/logout`).catch(() => {/* ignore */});
    } finally {
      TokenManager.clearTokens();
      setToken(null);
      setUser(null);
    }
  }, [project]);

  const fetchProfile = useCallback(async () => {
    if (!TokenManager.hasToken()) return;
    try {
      const res = await apiClient.get(`/${project}/auth/profile`);
      setUser(res.data?.data ?? res.data ?? null);
    } catch { /* token may be invalid — ignore */ }
  }, [project]);

  return {
    user,
    token,
    isLoggedIn: Boolean(token),
    isLoading,
    error,
    login,
    logout,
    fetchProfile,
  };
}
