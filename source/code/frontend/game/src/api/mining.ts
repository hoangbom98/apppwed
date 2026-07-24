import api from '@/api/httpClient';

export const getMiningMachines  = ()             => api.get('/mining/machines').then(r => r.data);
export const getMiningMachine   = (id: string)   => api.get(`/mining/machines/${id}`).then(r => r.data);
export const getMyMining        = (params?: any) => api.get('/mining/my', { params }).then(r => r.data);
export const investMining       = (body: { machineId: string; quantity?: number; tradingPassword: string }) =>
  api.post('/mining/invest', body).then(r => r.data);
