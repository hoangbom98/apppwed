// frontend/shared-ui/hooks/useAuth.js
// Generic auth hook.  Each project configures its own basePath.
// Usage: const auth = useAuth({ basePath: '/game/auth' });
import { useState, useCallback } from 'react';
import api from '../api/client';

/**
 * @param {{ basePath: string }} options
 * basePath should be like '/hub/auth', '/game/auth', etc.
 */
export function useAuth({ basePath = '/hub/auth' } = {}) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(`${basePath}/login`, credentials);
      localStorage.setItem('access_token',  data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  const register = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(`${basePath}/register`, payload);
      localStorage.setItem('access_token',  data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  const logout = useCallback(async () => {
    const refresh_token = localStorage.getItem('refresh_token');
    try { await api.post(`${basePath}/logout`, { refresh_token }); } catch { /* ignore */ }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  }, [basePath]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  };
}
