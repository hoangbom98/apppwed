import api from '@/api/httpClient';

export const getYuebaoProducts  = ()             => api.get('/yuebao/products').then(r => r.data);
export const getMyYuebao        = (params?: any) => api.get('/yuebao/my', { params }).then(r => r.data);
export const investYuebao       = (body: { productId: string; amount: number }) =>
  api.post('/yuebao/invest', body).then(r => r.data);
