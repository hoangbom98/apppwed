import client from '@admin/api/client';
import type { AxiosResponse } from 'axios';

type APIParams = Record<string, unknown>;
type APIBody   = Record<string, unknown>;

export const adminGameUsers = {
  list:   (params: APIParams) => client.get('/admin/users', { params: { ...params, project: 'game' } }),
  update: (id: string | number, b: APIBody) => client.patch(`/admin/users/${id}/status`, b),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminGameDeposits = {
  list:   (params: APIParams) => client.get('/admin/finance/deposits', { params }),
  update: (id: string | number, b: APIBody) => client.patch(`/admin/finance/deposits/${id}/approve`, b),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminGameWithdrawals = {
  list:   (params: APIParams) => client.get('/admin/finance/withdrawals', { params }),
  update: (id: string | number, b: APIBody) => client.patch(`/admin/finance/withdrawals/${id}/approve`, b),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminGameRounds = {
  list:   (params: APIParams) => client.get('/game/admin/rounds', { params }),
  get:    (id: string | number) => client.get(`/game/admin/rounds/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, b: APIBody) => client.patch(`/game/admin/rounds/${id}`, b),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminGameProviders = {
  list:   (params: APIParams) => client.get('/game/admin/providers', { params }),
  get:    (id: string | number) => client.get(`/game/admin/providers/${id}`),
  create: (body: APIBody)       => client.post('/game/admin/providers', body),
  update: (id: string | number, b: APIBody) => client.put(`/game/admin/providers/${id}`, b),
  remove: (id: string | number) => client.delete(`/game/admin/providers/${id}`),
};

export const adminLotteryDraws = {
  list:   (params: APIParams) => client.get('/game/lottery/draws', { params }),
  get:    (id: string | number) => client.get(`/game/lottery/draws/${id}`),
  create: (body: APIBody)       => client.post('/game/lottery/admin/draws', body),
  update: (id: string | number, b: APIBody) => client.post(`/game/lottery/admin/draws/${id}/result`, b),
  cancel: (id: string | number) => client.post(`/game/lottery/admin/draws/${id}/cancel`),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminLotteryBets = {
  list:   (params: APIParams) => client.get('/game/lottery/admin/bets', { params }),
  refund: (id: string | number) => client.patch(`/admin/lottery/bets/${id}/refund`),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminLotteryTypes = {
  list:   (params?: APIParams)              => client.get('/game/lottery/types', { params }),
  create: (body: APIBody)                   => client.post('/game/admin/lottery/types', body),
  update: (id: string | number, b: APIBody) => client.patch(`/game/admin/lottery/types/${id}`, b),
  remove: (id: string | number)             => client.delete(`/game/admin/lottery/types/${id}`),
};

export const getGameStats = () =>
  client.get('/admin/stats').then(r => r.data?.data ?? r.data);
