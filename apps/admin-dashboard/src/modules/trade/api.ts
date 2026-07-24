// frontend/admin-dashboard/src/modules/trade/api.ts
// Trade module admin API calls.
// User management routes go through /admin/* (cross-project).
// Content-specific routes go through /trade/admin/*.
import client from '@admin/api/client';

type APIParams = Record<string, any>;
type APIBody = Record<string, any>;

// ── Cross-project user management (via admin module) ─────────────────────────
export const adminTradeUsers = {
  list:   (params: APIParams) => client.get('/admin/users', { params: { ...params, project: 'trade' } }),
  update: (id: string | number, b: APIBody)  => client.patch(`/admin/users/${id}/status`, b),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── KYC queue (trade module admin routes) ─────────────────────────────────────
export const adminTradeKyc = {
  list:   (params: APIParams) => client.get('/trade/admin/kyc/pending', { params }),
  get:    (id: string | number)     => client.get(`/trade/admin/kyc/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, b: APIBody)  => client.put(`/trade/admin/kyc/${id}/approve`, b),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── Orders (view + status update) ────────────────────────────────────────────
export const adminTradeOrders = {
  list:   (params: APIParams) => client.get('/trade/admin/orders', { params }),
  get:    (id: string | number)     => client.get(`/trade/admin/orders/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, b: APIBody)  => client.patch(`/trade/admin/orders/${id}`, b),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── Wallets (view + adjustment) ────────────────────────────────────────────
export const adminTradeWallets = {
  list:   (params: APIParams) => client.get('/trade/admin/wallets', { params }),
  get:    (id: string | number)     => client.get(`/trade/admin/wallets/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, b: APIBody)  => client.patch(`/trade/admin/wallets/${id}`, b),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── Positions (view-only) ──────────────────────────────────────────────────
export const adminTradePositions = {
  list:   (params: APIParams) => client.get('/trade/admin/positions', { params }),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── Deposits (approve / reject) ───────────────────────────────────────────────
export const adminTradeDeposits = {
  list:   (params: APIParams) => client.get('/trade/admin/deposits',   { params }),
  get:    (id: string | number) => client.get(`/trade/admin/deposits/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── Withdrawals (approve / reject) ─────────────────────────────────────────────
export const adminTradeWithdrawals = {
  list:   (params: APIParams) => client.get('/trade/admin/withdrawals', { params }),
  get:    (id: string | number) => client.get(`/trade/admin/withdrawals/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

// ── Investment packages (CRUD) ─────────────────────────────────────────────────
export const adminTradePackages = {
  list:   (params: APIParams) => client.get('/trade/admin/investment/packages', { params }),
  get:    (id: string | number) => client.get(`/trade/admin/investment/packages/${id}`),
  create: (b: APIBody) => client.post('/trade/admin/investment/packages', b),
  update: (id: string | number, b: APIBody) => client.patch(`/trade/admin/investment/packages/${id}`, b),
  remove: (id: string | number) => client.delete(`/trade/admin/investment/packages/${id}`),
};

// ── Investments (list only) ────────────────────────────────────────────────────
export const adminTradeInvestments = {
  list:   (params: APIParams) => client.get('/trade/admin/investments', { params }),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

// Stats shortcut
export const getTradeStats = () =>
  client.get('/admin/stats').then(r => r.data?.data ?? r.data);
