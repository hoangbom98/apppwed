import api from '@/api/client';

export const getSavingsVaultProducts = ()             => api.get('/game/savingsVault/products').then(r => r.data);
export const getMySavingsVault       = (params?: any) => api.get('/game/savingsVault/my', { params }).then(r => r.data);
export const investSavingsVault      = (body: { productId: string; amount: number }) =>
  api.post('/game/savingsVault/invest', body).then(r => r.data);
export const withdrawSavingsVault    = (holdingId: string) =>
  api.post('/game/savingsVault/withdraw', { holdingId }).then(r => r.data);
