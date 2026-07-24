import api from './client';

export const getStreams      = (params?: any) => api.get('/dating/live/streams', { params }).then(r => r.data);
export const getStream       = (id: number) => api.get(`/dating/live/${id}`).then(r => r.data);
export const startStream     = (data: { title: string; category?: string }) => api.post('/dating/live/start', data).then(r => r.data);
export const endStream       = (id: number) => api.post(`/dating/live/${id}/end`).then(r => r.data);
export const sendLiveGift    = (data: { stream_id: number; gift_id: number; quantity?: number }) =>
  api.post('/dating/live/gift', data).then(r => r.data);
export const getLiveRanking  = (streamId: number) => api.get(`/dating/live/${streamId}/ranking`).then(r => r.data);
export const joinStream      = (id: number) => api.post(`/dating/live/${id}/join`).then(r => r.data);
export const leaveStream     = (id: number) => api.post(`/dating/live/${id}/leave`).then(r => r.data);
