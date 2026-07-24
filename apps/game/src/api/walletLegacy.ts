import api from './httpClient';

export const getBalance         = () => api.get('/game/balance').then(r => r.data.data);
export const createDeposit      = (d: any) => api.post('/game/deposit', d).then(r => r.data);
export const getDepositHistory  = (p?: any) => api.get('/game/deposit/history', { params: p }).then(r => r.data);
export const createWithdraw     = (d: any) => api.post('/game/withdraw', d).then(r => r.data);
export const getWithdrawHistory = (p?: any) => api.get('/game/withdraw/history', { params: p }).then(r => r.data);
export const getTransactions    = (p?: any) => api.get('/game/transactions', { params: p }).then(r => r.data);
