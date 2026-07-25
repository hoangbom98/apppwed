import api from '@/api/httpClient';

export const getYuebaoProducts = ()             => api.get('/game/yuebao/products').then(r => r.data);
export const getMyYuebao       = (params?: any) => api.get('/game/yuebao/my', { params }).then(r => r.data);
export const investYuebao      = (body: { productId: string; amount: number }) =>
  api.post('/game/yuebao/invest', body).then(r => r.data);
export const withdrawYuebao    = (holdingId: string) =>
  api.post('/game/yuebao/withdraw', { holdingId }).then(r => r.data);
