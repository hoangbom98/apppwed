// @ts-nocheck
import axios from 'axios';
import { AUTH_KEYS, DEFAULT_PROJECT } from '../src/constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const project = import.meta.env.VITE_PROJECT || DEFAULT_PROJECT;
  const token = localStorage.getItem(`${project}_${AUTH_KEYS.ACCESS_TOKEN}`);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Project'] = project;
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  refreshQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const project = import.meta.env.VITE_PROJECT || DEFAULT_PROJECT;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem(`${project}_${AUTH_KEYS.REFRESH_TOKEN}`);
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${api.defaults.baseURL}/${project}/auth/refresh-token`,
          { refresh_token: refreshToken }
        );
        localStorage.setItem(`${project}_${AUTH_KEYS.ACCESS_TOKEN}`, data.access_token);
        processQueue(null, data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem(`${project}_${AUTH_KEYS.ACCESS_TOKEN}`);
        localStorage.removeItem(`${project}_${AUTH_KEYS.REFRESH_TOKEN}`);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
