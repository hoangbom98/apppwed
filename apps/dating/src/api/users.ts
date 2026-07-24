import api from './client';

export const getHomeData   = () => api.get('/dating/users/home').then(r => r.data);
export const getDiscovery  = (params: Record<string, any>) => api.get('/dating/users/discovery', { params }).then(r => r.data);
export const getUserById   = (id: number) => api.get(`/dating/users/${id}`).then(r => r.data);
export const reportUser    = (id: number, reason: string) => api.post(`/dating/users/${id}/report`, { reason }).then(r => r.data);
export const blockUser     = (id: number) => api.post(`/dating/users/${id}/block`).then(r => r.data);
