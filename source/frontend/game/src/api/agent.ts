import api from './httpClient';

export const getAgentInfo  = () => api.get('/game/agent/info').then(r => r.data.data);
export const getReferrals  = () => api.get('/game/agent/referrals').then(r => r.data.data);
