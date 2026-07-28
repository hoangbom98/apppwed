// __APPNAME__/src/store/authStore.ts
// Zustand auth store — hỗ trợ access_token + refresh_token theo backend v2.
// Persisted vào localStorage (access_token, refresh_token lưu riêng để
// apiClient có thể đọc khi refresh mà không cần store).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id:       number | string;
  username: string;
  email:    string;
  role?:    string;
  avatar?:  string;
}

interface AuthState {
  user:         User | null;
  accessToken:  string | null;
  refreshToken: string | null;

  /** Lưu tokens + user sau khi login/register thành công */
  setAuth:    (user: User, accessToken: string, refreshToken?: string) => void;
  /** Xóa toàn bộ auth state (logout) */
  clearAuth:  () => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => {
        // Lưu vào localStorage để apiClient interceptor đọc được khi refresh
        localStorage.setItem('token', accessToken);
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        set({ user, accessToken, refreshToken: refreshToken ?? null });
      },

      clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Xóa client-accessible cookie (không phải httpOnly)
        document.cookie = 'access_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        set({ user: null, accessToken: null, refreshToken: null });
      },

      isLoggedIn: () => !!get().accessToken,
    }),
    {
      name: '__APPNAME___auth',
      partialize: (s) => ({
        user:         s.user,
        accessToken:  s.accessToken,
        refreshToken: s.refreshToken,
      }),
    },
  ),
);
