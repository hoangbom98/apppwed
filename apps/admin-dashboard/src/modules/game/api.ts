// frontend/admin-dashboard/src/modules/game/api.ts
// Game module admin API calls.
// User/finance routes go through /admin/* (cross-project).
// Game-specific routes go through /game/admin/*.
import client from '@admin/api/client';

type APIParams = Record<string, any>;
type APIBody = Record<string, any>;

// ── Cross-project user management (via admin module) ─────────────────────────
export const adminGameUsers = {
  list:   (params: APIParams) => client.get('/admin/users', { params: { ...params, project: 'game' } }),
  update: (id: string | number, b: APIBody)  => client.patch(`/admin/users/${id}/status`, b),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── Deposits / Withdrawals (via admin finance routes) ─────────────────────────
export const adminGameDeposits = {
  list:   (params: APIParams) => client.get('/admin/finance/deposits', { params }),
  update: (id: string | number, b: APIBody)  => client.patch(`/admin/finance/deposits/${id}/approve`, b),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminGameWithdrawals = {
  list:   (params: APIParams) => client.get('/admin/finance/withdrawals', { params }),
  update: (id: string | number, b: APIBody)  => client.patch(`/admin/finance/withdrawals/${id}/approve`, b),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── Game sessions / rounds (via game module admin routes) ─────────────────────
export const adminGameRounds = {
  list:   (params: APIParams) => client.get('/game/admin/rounds', { params }),
  get:    (id: string | number)     => client.get(`/game/admin/rounds/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, b: APIBody)  => client.patch(`/game/admin/rounds/${id}`, b),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── Game providers (full CRUD) ────────────────────────────────────────────────
export const adminGameProviders = {
  list:   (params: APIParams) => client.get('/game/admin/providers', { params }),
  get:    (id: string | number)     => client.get(`/game/admin/providers/${id}`),
  create: (body: APIBody)   => client.post('/game/admin/providers', body),
  update: (id: string | number, b: APIBody)  => client.put(`/game/admin/providers/${id}`, b),
  remove: (id: string | number)     => client.delete(`/game/admin/providers/${id}`),
};

// ── Lottery admin endpoints ────────────────────────────────────────────────────
export const adminLotteryDraws = {
  list:   (params: APIParams) => client.get('/game/lottery/draws', { params }),
  get:    (id: string | number)     => client.get(`/game/lottery/draws/${id}`),
  create: (body: APIBody)   => client.post('/game/lottery/admin/draws', body),
  update: (id: string | number, b: APIBody)  => client.post(`/game/lottery/admin/draws/${id}/result`, b),
  cancel: (id: string | number)     => client.post(`/game/lottery/admin/draws/${id}/cancel`),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminLotteryBets = {
  list:   (params: APIParams) => client.get('/game/lottery/admin/bets', { params }),
  refund: (id: string | number)     => client.patch(`/admin/lottery/bets/${id}/refund`),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── Lottery Types CRUD ────────────────────────────────────────────────────────
export const adminLotteryTypes = {
  list:   (params?: APIParams) => client.get('/game/lottery/types', { params }),
  create: (body: APIBody)      => client.post('/game/admin/lottery/types', body),
  update: (id: string | number, b: APIBody) => client.patch(`/game/admin/lottery/types/${id}`, b),
  remove: (id: string | number)             => client.delete(`/game/admin/lottery/types/${id}`),
};

// ── Game config (project registry) ────────────────────────────────────────────
export const getGameConfig = (project: string) =>
  client.get('/admin/game/config', { params: project ? { project } : {} }).then(r => r.data?.data ?? r.data);

export const updateGameConfig = (project: string, body: APIBody) =>
  client.put(`/admin/game/config/${project}`, body).then(r => r.data?.data ?? r.data);

// Stats shortcut
export const getGameStats = () =>
  client.get('/admin/stats').then(r => r.data?.data ?? r.data);
