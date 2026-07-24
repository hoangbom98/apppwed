import api from '@/api/httpClient';

// Wallet transfer between sub-wallets or to other users
export const getWalletBalance = () => api.get('/wallet').then(r => r.data);
export const transferFunds    = (body: { toUsername: string; amount: number; tradingPassword: string }) =>
  api.post('/wallet/transfer', body).then(r => r.data);
export const getTransferHistory = (params?: any) =>
  api.get('/wallet/history', { params: { ...params, type: 'transfer' } }).then(r => r.data);
