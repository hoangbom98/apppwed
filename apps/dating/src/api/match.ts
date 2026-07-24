import api from './client';

export const getSwipeProfiles = () => api.get('/dating/match/profiles').then(r => r.data);
export const likeUser         = (id: number) => api.post(`/dating/match/like/${id}`).then(r => r.data);
export const nopeUser         = (id: number) => api.post(`/dating/match/nope/${id}`).then(r => r.data);
export const superLike        = (id: number) => api.post(`/dating/match/superlike/${id}`).then(r => r.data);
export const boostProfile     = () => api.post('/dating/match/boost').then(r => r.data);
export const getMatches       = () => api.get('/dating/match/list').then(r => r.data);
export const getFavorites     = () => api.get('/dating/match/favorites').then(r => r.data);
export const getWhoLikedMe    = () => api.get('/dating/match/liked-me').then(r => r.data);
export const removeFavorite   = (id: number) => api.delete(`/dating/match/favorites/${id}`).then(r => r.data);
