import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  /** Đăng nhập — lưu token + user vào store */
  login: (token: string, user?: AuthUser) => void;
  /** Đăng xuất — xoá toàn bộ auth state */
  logout: () => void;
  /** Kiểm tra token còn trong localStorage và sync vào store */
  hydrate: (tokenKey?: string) => void;
}

/**
 * Zustand auth store dùng chung cho tất cả SPA trong monorepo LKVIP.
 * Mỗi SPA dùng tokenKey riêng để không xung đột:
 *   - Landing/Omnis: tokenKey = 'accessToken'
 *   - Admin dashboard: tokenKey = 'admin_token'
 *   - Persist key: 'lkvip-auth' (chung — đổi nếu cần isolate)
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,

      login: (token, user) => set({
        isAuthenticated: true,
        token,
        user: user ?? null,
      }),

      logout: () => {
        // Xoá tất cả token keys phổ biến
        ['accessToken', 'refreshToken', 'admin_token', 'admin_refresh_token',
         'userRole', 'lkvip-token'].forEach(k => localStorage.removeItem(k));
        set({ isAuthenticated: false, token: null, user: null });
      },

      hydrate: (tokenKey = 'accessToken') => {
        const token = localStorage.getItem(tokenKey);
        if (token) {
          set({ isAuthenticated: true, token });
        } else {
          set({ isAuthenticated: false, token: null });
        }
      },
    }),
    {
      name: 'lkvip-auth',
      // Chỉ persist những field cần thiết, không persist isLoading
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
