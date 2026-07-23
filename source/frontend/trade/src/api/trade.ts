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

// ── Investment ────────────────────────────────────────────────────────────────
export const getInvestmentPackages = (params?: object) =>
  api.get('/trade/investment/packages', { params }).then(r => r.data);
export const getInvestmentPackage   = (id: string) =>
  api.get(`/trade/investment/packages/${id}`).then(r => r.data);
export const buyInvestmentPackage   = (data: object) =>
  api.post('/trade/investment/buy', data).then(r => r.data);
export const getInvestmentHistory   = (params?: object) =>
  api.get('/trade/investment/history', { params }).then(r => r.data);

// ── Referral ──────────────────────────────────────────────────────────────────
export const getReferralCode        = () =>
  api.get('/trade/referral/my-code').then(r => r.data);
export const getReferralDownline    = (params?: object) =>
  api.get('/trade/referral/downline', { params }).then(r => r.data);
export const getReferralCommissions = (params?: object) =>
  api.get('/trade/referral/commissions', { params }).then(r => r.data);
export const getReferralStats       = () =>
  api.get('/trade/referral/stats').then(r => r.data);

// ── Wallet: company banks + deposit history ────────────────────────────────────
export const getCompanyBanks  = () =>
  api.get('/trade/wallet/company-banks').then(r => r.data);
export const getDepositHistory = (params?: object) =>
  api.get('/trade/wallet/deposits', { params }).then(r => r.data);

// ── Watchlist ─────────────────────────────────────────────────────────────────
export const getWatchlists    = () =>
  api.get('/trade/watchlists').then(r => r.data);
export const createWatchlist  = (name: string) =>
  api.post('/trade/watchlists', { name }).then(r => r.data);
export const deleteWatchlist  = (id: string) =>
  api.delete(`/trade/watchlists/${id}`).then(r => r.data);
export const addToWatchlist   = (id: string, symbolId: string) =>
  api.post(`/trade/watchlists/${id}/items`, { symbolId }).then(r => r.data);
export const removeFromWatchlist = (id: string, symbolId: string) =>
  api.delete(`/trade/watchlists/${id}/items/${symbolId}`).then(r => r.data);

// ── Price Alerts ──────────────────────────────────────────────────────────────
export const getPriceAlerts   = () =>
  api.get('/trade/alerts').then(r => r.data);
export const createPriceAlert = (data: object) =>
  api.post('/trade/alerts', data).then(r => r.data);
export const deletePriceAlert = (id: string) =>
  api.delete(`/trade/alerts/${id}`).then(r => r.data);
