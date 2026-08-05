// frontend/hub/src/api/hub.ts
// All API call helpers for Hub
import api from './client';

/* ── Public ───────────────────────────────── */
export const getCategories   = (type?: string) => api.get('/hub/categories', { params: { type } });
export const getGames        = (p: object)  => api.get('/hub/games', { params: p });
export const getGameBySlug   = (slug: string)     => api.get(`/hub/games/${slug}`);
export const getWebsites     = (p: object)  => api.get('/hub/websites', { params: p });
export const getTools        = (p: object)  => api.get('/hub/tools', { params: p });
export const getToolBySlug   = (slug: string)     => api.get(`/hub/tools/${slug}`);
export const getNewsList     = (p: object)  => api.get('/hub/news', { params: p });
export const getNewsBySlug   = (slug: string)     => api.get(`/hub/news/${slug}`);
export const getPage         = (slug: string)     => api.get(`/hub/pages/${slug}`);
export const getBanners      = (p: object)  => api.get('/hub/banners', { params: p });
export const getMenu         = (location: string) => api.get(`/hub/menus/${location}`);
export const search          = (q: string)        => api.get('/hub/search', { params: { q } });
export const getCourses        = (p: object)  => api.get('/hub/courses', { params: p });
export const submitFeedback  = (body: object)     => api.post('/hub/feedback', body);

/* ── Auth ─────────────────────────────────── */
export const register       = (body: object) => api.post('/hub/auth/register', body);
export const login          = (body: object) => api.post('/hub/auth/login', body);
export const refreshToken   = (rt: string)   => api.post('/hub/auth/refresh-token', { refresh_token: rt });
export const logout         = (rt?: string)  => api.post('/hub/auth/logout', rt ? { refresh_token: rt } : {});

/* ── Social OAuth ─────────────────────────── */
// Redirect URLs — trình duyệt navigate đến backend, backend redirect về frontend
// với ?oauth=success sau khi set cookies. Dùng trực tiếp làm href= trong <a>.
export const GOOGLE_OAUTH_URL   = `${api.defaults.baseURL?.replace('/api','') || ''}/api/hub/auth/google`;
export const FACEBOOK_OAUTH_URL = `${api.defaults.baseURL?.replace('/api','') || ''}/api/hub/auth/facebook`;

/* ── Profile ──────────────────────────────── */
export const getProfile         = () => api.get('/hub/profile');
// updateProfile hỗ trợ cả JSON lẫn FormData (khi có file avatar).
// Nếu body là FormData, Content-Type tự động multipart/form-data.
// Dùng buildFormData() từ @ui để serialize nested fields cho parseNestedFields middleware.
export const updateProfile      = (body: object | FormData) =>
  api.put('/hub/profile', body, body instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
export const changePassword     = (body: object) => api.put('/hub/profile/password', body);
export const getFavorites       = () => api.get('/hub/favorites');
export const addFavorite        = (body: object) => api.post('/hub/favorites', body);
export const removeFavorite     = (id: number)   => api.delete(`/hub/favorites/${id}`);
export const getNotifications   = () => api.get('/hub/notifications');
export const markNotifRead      = (id: number)   => api.put(`/hub/notifications/${id}/read`);

/* ── App Catalog ──────────────────────────────── */
export const getAppCatalog = () => api.get('/hub/app-catalog');
