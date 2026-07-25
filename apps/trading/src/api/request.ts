import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL: string = import.meta.env?.VITE_API_BASE_URL ?? '/api';

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ───────────────────────────────────────────────────────
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────────────────────
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data as { code?: number; message?: string };
    // Standard response shape: { code: 200, data: ..., message: ... }
    if (res.code !== undefined && res.code !== 200 && res.code !== 0) {
      return Promise.reject(new Error(res.message ?? 'Error'));
    }
    return response.data;
  },
  (error: unknown) => {
    // Handle HTTP 401 — Unauthorized
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 401
    ) {
      // Redirect to login or trigger refresh token logic here
    }
    return Promise.reject(error);
  }
);

export default request;
