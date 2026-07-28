// __APPNAME__/src/hooks/useAuth.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth, isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  const logout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  return { user, accessToken, setAuth, logout, isLoggedIn };
}
