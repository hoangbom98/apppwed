import api from './client';

export const getCommunityTopics  = () => api.get('/dating/community/topics').then(r => r.data);
export const getPosts            = (topic?: string, params?: any) => api.get('/dating/community/posts', { params: { topic, ...params } }).then(r => r.data);
export const createPost          = (data: { title: string; content: string; topic: string }) =>
  api.post('/dating/community/posts', data).then(r => r.data);
export const likePost            = (id: number) => api.post(`/dating/community/posts/${id}/like`).then(r => r.data);
export const commentPost         = (id: number, content: string) =>
  api.post(`/dating/community/posts/${id}/comments`, { content }).then(r => r.data);
export const getEvents           = () => api.get('/dating/events').then(r => r.data);
export const getPartyRooms       = () => api.get('/dating/party/rooms').then(r => r.data);
export const joinPartyRoom       = (id: number) => api.post(`/dating/party/${id}/join`).then(r => r.data);
export const getReferralInfo     = () => api.get('/dating/referral').then(r => r.data);
export const getReferralHistory  = () => api.get('/dating/referral/history').then(r => r.data);
