import api from './httpClient';

export const getVipInfo     = () => api.get('/game/vip/level').then(r => r.data.data);
export const getVipLevels   = () => api.get('/game/vip/levels').then(r => r.data.data);
export const claimDaily     = () => api.post('/game/vip/claim/daily').then(r => r.data.data);
export const claimMonthly   = () => api.post('/game/vip/claim/monthly').then(r => r.data.data);
