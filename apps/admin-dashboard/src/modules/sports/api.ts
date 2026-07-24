// frontend/admin-dashboard/src/modules/sports/api.ts
// Sports module admin API calls.
import client from '@admin/api/client';

type APIParams = Record<string, any>;
type APIBody = Record<string, any>;

// ── Cross-project user management (via admin module) ─────────────────────────
export const adminSportsUsers = {
  list:   (params: APIParams) => client.get('/admin/users', { params: { ...params, project: 'sports' } }),
  update: (id: string | number, b: APIBody)  => client.patch(`/admin/users/${id}/status`, b),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── Sports content management (via sports module admin routes) ────────────────
const resource = (path: string) => ({
  list:   (params: APIParams) => client.get(path, { params }),
  get:    (id: string | number)     => client.get(`${path}/${id}`),
  create: (body: APIBody)   => client.post(path, body),
  update: (id: string | number, b: APIBody)  => client.put(`${path}/${id}`, b),
  remove: (id: string | number)     => client.delete(`${path}/${id}`),
});

export const adminLeagues  = resource('/sports/admin/leagues');
export const adminTeams    = resource('/sports/admin/teams');
export const adminMatches  = resource('/sports/admin/matches');
export const adminArticles = resource('/sports/admin/articles');

// ── Betting (view-only from admin) ────────────────────────────────────────────
export const adminBets = {
  list:   (params: APIParams) => client.get('/sports/admin/bets', { params }),
  update: (id: string | number, b: APIBody)  => client.patch(`/sports/admin/bets/${id}/settle`, b),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const getSportsStats = () =>
  client.get('/admin/stats').then(r => r.data?.data ?? r.data);
