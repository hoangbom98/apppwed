// @ts-nocheck
// frontend/admin-dashboard/src/modules/dating/api.ts
// Dating module admin API calls.
import client from '@admin/api/client';

// ── Types ────────────────────────────────────────────────────────────────────
type APIParams = Record<string, any>;
type APIBody = Record<string, any>;

// ── Cross-project user management (via admin module) ─────────────────────────
export const adminDatingUsers = {
  list:   (params: APIParams) => client.get('/admin/users', { params: { ...params, project: 'dating' } }),
  update: (id: string | number, body: APIBody)  => client.patch(`/admin/users/${id}/status`, body),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── Dating content management (via dating module admin routes) ─────────────
const resource = (path: string) => ({
  list:   (params: APIParams) => client.get(path, { params }),
  get:    (id: string | number)     => client.get(`${path}/${id}`),
  create: (body: APIBody)   => client.post(path, body),
  update: (id: string | number, body: APIBody)  => client.put(`${path}/${id}`, body),
  remove: (id: string | number)     => client.delete(`${path}/${id}`),
});

// Profiles (read + moderate — no create)
export const adminDatingProfiles = {
  list:   (params: APIParams) => client.get('/dating/admin/profiles', { params }),
  get:    (id: string | number)     => client.get(`/dating/admin/profiles/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, body: APIBody)  => client.patch(`/dating/admin/profiles/${id}`, body),
  remove: (id: string | number)     => client.delete(`/dating/admin/profiles/${id}`),
};

// Matches (read + delete only)
export const adminDatingMatches = {
  list:   (params: APIParams) => client.get('/dating/admin/matches', { params }),
  get:    (id: string | number)     => client.get(`/dating/admin/matches/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: (id: string | number)     => client.delete(`/dating/admin/matches/${id}`),
};

// Gifts (full CRUD)
export const adminDatingGifts = resource('/dating/admin/gifts');

// Moments (read + moderate)
export const adminDatingMoments = {
  list:   (params: APIParams) => client.get('/dating/admin/moments', { params }),
  get:    (id: string | number)     => client.get(`/dating/admin/moments/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, body: APIBody)  => client.patch(`/dating/admin/moments/${id}`, body),
  remove: (id: string | number)     => client.delete(`/dating/admin/moments/${id}`),
};

// Reports / violations (review + update status)
export const adminDatingReports = {
  list:   (params: APIParams) => client.get('/dating/admin/reports', { params }),
  get:    (id: string | number)     => client.get(`/dating/admin/reports/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, body: APIBody)  => client.patch(`/dating/admin/reports/${id}`, body),
  remove: () => Promise.reject(new Error('Not supported')),
};

// Live sessions (view-only)
export const adminDatingLive = {
  list:   (params: APIParams) => client.get('/dating/admin/live', { params }),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: (id: string | number)     => client.delete(`/dating/admin/live/${id}`),
};

// Stats shortcut
export const getDatingStats = () =>
  client.get('/admin/stats').then(r => r.data?.data ?? r.data);
