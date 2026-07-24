import api from './httpClient';

export const login        = (data: any) => api.post('/game/auth/login', data).then(r => r.data);
export const register     = (data: any) => api.post('/game/auth/register', data).then(r => r.data);
export const refreshToken = (rt: string) => api.post('/game/auth/refresh-token', { refresh_token: rt }).then(r => r.data);
export const logout       = (rt?: string) => api.post('/game/auth/logout', { refresh_token: rt });
export const getProfile   = () => api.get('/game/profile').then(r => r.data.data);
export const updateProfile = (d: any) => api.put('/game/profile', d).then(r => r.data.data);
export const changePassword = (d: any) => api.put('/game/profile/password', d).then(r => r.data);
