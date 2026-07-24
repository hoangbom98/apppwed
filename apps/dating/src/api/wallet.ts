import api from './client';

export const getBalance      = () => api.get('/dating/wallet/balance').then(r => r.data);
export const getHistory      = (params?: any) => api.get('/dating/wallet/history', { params }).then(r => r.data);
export const deposit         = (data: { amount: number; method: string; currency?: string }) => api.post('/dating/wallet/deposit', data).then(r => r.data);
export const withdraw        = (data: { amount: number; bank_account: string }) => api.post('/dating/wallet/withdraw', data).then(r => r.data);
