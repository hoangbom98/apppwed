import api from './client';

export const getFeed           = (params?: any) => api.get('/dating/feed', { params }).then(r => r.data);
export const createPost        = (data: FormData) => api.post('/dating/feed/post', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data);
export const likePost          = (id: number) => api.post(`/dating/feed/${id}/like`).then(r => r.data);
export const unlikePost        = (id: number) => api.delete(`/dating/feed/${id}/like`).then(r => r.data);
export const getComments       = (id: number) => api.get(`/dating/feed/${id}/comments`).then(r => r.data);
export const addComment        = (id: number, content: string) => api.post(`/dating/feed/${id}/comments`, { content }).then(r => r.data);
export const deletePost        = (id: number) => api.delete(`/dating/feed/${id}`).then(r => r.data);
