import api from './client';

export const getVipPlans   = () => api.get('/dating/vip/plans').then(r => r.data);
export const subscribeVip  = (plan_id: string) => api.post('/dating/vip/subscribe', { plan_id }).then(r => r.data);
