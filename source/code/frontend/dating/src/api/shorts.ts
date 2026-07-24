import api from './client';

export const getShorts      = (params?: any) => api.get('/dating/shorts', { params }).then(r => r.data);
export const likeShort      = (id: number) => api.post(`/dating/shorts/${id}/like`).then(r => r.data);
export const commentShort   = (id: number, content: string) => api.post(`/dating/shorts/${id}/comment`, { content }).then(r => r.data);
export const shareShort     = (id: number) => api.post(`/dating/shorts/${id}/share`).then(r => r.data);
export const giftShort      = (data: { short_id: number; gift_id: number }) => api.post('/dating/shorts/gift', data).then(r => r.data);
export const uploadShort    = (data: FormData) => api.post('/dating/shorts/upload', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data);
