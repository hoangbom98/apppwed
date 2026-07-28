import axios from 'axios';

const PROJECT = import.meta.env.VITE_PROJECT || 'trade';
const TOKEN_KEY = `${PROJECT}_access_token`;
const REFRESH_KEY = `${PROJECT}_refresh_token`;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Project'] = PROJECT;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = localStorage.getItem(REFRESH_KEY);
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post(`/api/${PROJECT}/auth/refresh`, { refresh_token: refresh });
        localStorage.setItem(TOKEN_KEY, data.data?.access_token ?? data.access_token);
        orig.headers.Authorization = `Bearer ${localStorage.getItem(TOKEN_KEY)}`;
        return api(orig);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
