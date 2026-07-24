import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response Interceptor
request.interceptors.response.use(
  response => {
    const res = response.data;
    // Assuming a standard response structure: { code: 200, data: ..., message: ... }
    if (res.code && res.code !== 200 && res.code !== 0) {
      // Handle business errors
      return Promise.reject(new Error(res.message || 'Error'));
    }
    return res;
  },
  error => {
    // Handle HTTP errors (e.g., 401 Unauthorized)
    if (error.response?.status === 401) {
      // Redirect to login or trigger refresh token logic here
    }
    return Promise.reject(error);
  }
);

export default request;
