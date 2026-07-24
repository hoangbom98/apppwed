import api from './client';

export const getStories     = () => api.get('/dating/stories').then(r => r.data);
export const createStory    = (data: FormData) => api.post('/dating/stories/create', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data);
export const viewStory      = (id: number) => api.post(`/dating/stories/${id}/view`).then(r => r.data);
export const deleteStory    = (id: number) => api.delete(`/dating/stories/${id}`).then(r => r.data);
