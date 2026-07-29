import axios from "axios";

const PROJECT   = "hub";
const TOKEN_KEY = `${PROJECT}_access_token`;
const REFRESH_KEY = `${PROJECT}_refresh_token`;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["X-Project"] = PROJECT;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null;
        if (!refresh) throw new Error("no refresh token");
        const { data } = await axios.post("/api/hub/auth/refresh-token", { refresh_token: refresh });
        const newToken = data.data?.access_token ?? data.access_token;
        if (typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, newToken);
        }
        orig.headers.Authorization = `Bearer ${newToken}`;
        return api(orig);
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem(TOKEN_KEY);
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
