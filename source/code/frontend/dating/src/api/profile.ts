import api from './client';

export const updateProfile    = (data: any) => api.put('/dating/profile', data).then(r => r.data);
export const getProfileStats  = () => api.get('/dating/profile/me/stats').then(r => r.data);
export const getAlbum         = (userId?: number) => api.get(`/dating/profile/${userId || 'me'}/album`).then(r => r.data);
export const uploadPhoto   = (form: FormData) => api.post('/dating/profile/album', form, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data);
export const deletePhoto   = (id: number) => api.delete(`/dating/profile/album/${id}`).then(r => r.data);
export const followUser    = (id: number) => api.post(`/dating/profile/${id}/follow`).then(r => r.data);
export const unfollowUser  = (id: number) => api.delete(`/dating/profile/${id}/follow`).then(r => r.data);
