import api from './client';

export const getDailyStatus  = () => api.get('/dating/daily/status').then(r => r.data);
export const checkin         = () => api.post('/dating/daily/checkin').then(r => r.data);
export const getMissions     = () => api.get('/dating/daily/missions').then(r => r.data);
export const spin            = () => api.post('/dating/daily/spin').then(r => r.data);
export const getLevel        = () => api.get('/dating/level').then(r => r.data);
export const getAchievements = () => api.get('/dating/level/achievements').then(r => r.data);
