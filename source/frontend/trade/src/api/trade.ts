import api from './client';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login      = (data: { email: string; password: string }) =>
  api.post('/trade/auth/login',    data).then(r => r.data);
export const register   = (data: object) =>
  api.post('/trade/auth/register', data).then(r => r.data);
export const getMe      = () =>
  api.get('/trade/auth/me').then(r => r.data);

// ── Market / Pairs ─────────────────────────────────────────────────────────────
export const getPairs     = (params?: object) =>
  api.get('/trade/pairs',          { params }).then(r => r.data);
export const getPairBySymbol = (symbol: string) =>
  api.get(`/trade/pairs/${symbol}`).then(r => r.data);

// ── Orders ────────────────────────────────────────────────────────────────────
export const getOrders   = (params?: object) =>
  api.get('/trade/orders',         { params }).then(r => r.data);
export const getOrder    = (id: number) =>
  api.get(`/trade/orders/${id}`).then(r => r.data);
export const createOrder = (data: object) =>
  api.post('/trade/orders',        data).then(r => r.data);
export const cancelOrder = (id: number) =>
  api.delete(`/trade/orders/${id}`).then(r => r.data);

// ── Wallet ────────────────────────────────────────────────────────────────────
export const getWallet       = () =>
  api.get('/trade/wallet').then(r => r.data);
export const getWalletHistory = (params?: object) =>
  api.get('/trade/wallet/history', { params }).then(r => r.data);
export const createDeposit   = (data: object) =>
  api.post('/trade/wallet/deposit',  data).then(r => r.data);
export const createWithdrawal = (data: object) =>
  api.post('/trade/wallet/withdraw', data).then(r => r.data);

// ── KYC ───────────────────────────────────────────────────────────────────────
export const getKycStatus = () =>
  api.get('/trade/kyc').then(r => r.data);
export const submitKyc    = (data: object) =>
  api.post('/trade/kyc',  data).then(r => r.data);

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications  = () =>
  api.get('/trade/notifications').then(r => r.data);
export const getUnreadCount    = () =>
  api.get('/trade/notifications/unread-count').then(r => r.data);
export const markNotifRead     = (id: number) =>
  api.put(`/trade/notifications/${id}/read`).then(r => r.data);

// ── Positions ─────────────────────────────────────────────────────────────────
export const getPositions    = (params?: object) =>
  api.get('/trade/positions',         { params }).then(r => r.data);
export const getPositionById = (id: string) =>
  api.get(`/trade/positions/${id}`).then(r => r.data);
export const closePosition   = (id: string, data?: object) =>
  api.post(`/trade/positions/${id}/close`, data).then(r => r.data);

// ── Portfolio ─────────────────────────────────────────────────────────────────
export const getPortfolio = () =>
  api.get('/trade/portfolio').then(r => r.data);
