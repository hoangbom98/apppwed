import client from '@admin/api/client';

type APIParams = Record<string, unknown>;
type APIBody   = Record<string, unknown>;

export const adminTradeUsers = {
  list:   (params: APIParams) => client.get('/admin/users', { params: { ...params, project: 'trade' } }),
  update: (id: string | number, b: APIBody) => client.patch(`/admin/users/${id}/status`, b),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminTradeKyc = {
  list:   (params: APIParams) => client.get('/trade/admin/kyc/pending', { params }),
  get:    (id: string | number) => client.get(`/trade/admin/kyc/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, b: APIBody) => client.put(`/trade/admin/kyc/${id}/approve`, b),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminTradeOrders = {
  list:   (params: APIParams) => client.get('/trade/admin/orders', { params }),
  get:    (id: string | number) => client.get(`/trade/admin/orders/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, b: APIBody) => client.patch(`/trade/admin/orders/${id}`, b),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminTradeWallets = {
  list:   (params: APIParams) => client.get('/trade/admin/wallets', { params }),
  get:    (id: string | number) => client.get(`/trade/admin/wallets/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, b: APIBody) => client.patch(`/trade/admin/wallets/${id}`, b),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminTradeDeposits = {
  list: (params: APIParams) => client.get('/trade/admin/deposits', { params }),
  get:  (id: string | number) => client.get(`/trade/admin/deposits/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminTradeWithdrawals = {
  list: (params: APIParams) => client.get('/trade/admin/withdrawals', { params }),
  get:  (id: string | number) => client.get(`/trade/admin/withdrawals/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminTradePackages = {
  list:   (params: APIParams) => client.get('/trade/admin/investment/packages', { params }),
  get:    (id: string | number) => client.get(`/trade/admin/investment/packages/${id}`),
  create: (b: APIBody) => client.post('/trade/admin/investment/packages', b),
  update: (id: string | number, b: APIBody) => client.patch(`/trade/admin/investment/packages/${id}`, b),
  remove: (id: string | number) => client.delete(`/trade/admin/investment/packages/${id}`),
};

export const adminTradeInvestments = {
  list:   (params: APIParams) => client.get('/trade/admin/investments', { params }),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const getTradeStats = () =>
  client.get('/admin/stats').then(r => r.data?.data ?? r.data);
