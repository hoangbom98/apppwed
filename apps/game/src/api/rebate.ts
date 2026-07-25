import api from '@/api/httpClient';

export interface RebateRecord {
  id: string;
  amount: number;
  validBet: number;
  rate: string;
  status: string;  // pending | claimable | claimed | expired
  betDate: string;
  gameType: string;
  createdAt: string;
}

export const getRebateStatus  = ()          => api.get('/game/rebate/status').then(r => r.data);
export const claimRebate      = ()          => api.post('/game/rebate/claim').then(r => r.data);
export const getRebateHistory = (page = 1) => api.get('/game/rebate/history', { params: { page } }).then(r => r.data);
export const getRebateRates   = ()          => api.get('/game/rebate/rates').then(r => r.data);
