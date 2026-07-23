import api from './client';

export const search         = (q: string, type?: string) => api.get('/dating/search', { params: { q, type } }).then(r => r.data);
export const searchUsers    = (q: string, params?: any) => api.get('/dating/search/users', { params: { q, ...params } }).then(r => r.data);
export const searchHashtags = (q: string) => api.get('/dating/search/hashtags', { params: { q } }).then(r => r.data);
