import api from '@/api/httpClient';

export const getMiningMachines = ()             => api.get('/game/mining/machines').then(r => r.data);
export const getMiningMachine  = (id: string)   => api.get(`/game/mining/machines/${id}`).then(r => r.data);
export const getMyMining       = (params?: any) => api.get('/game/mining/my', { params }).then(r => r.data);
export const investMining      = (body: { machineId: string; quantity?: number; tradingPassword: string }) =>
  api.post('/game/mining/invest', body).then(r => r.data);
