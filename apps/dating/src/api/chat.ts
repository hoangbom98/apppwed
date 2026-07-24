import api from './client';

export const getConversations  = () => api.get('/dating/chat/conversations').then(r => r.data);
export const getMessages       = (userId: number, params?: any) => api.get(`/dating/chat/${userId}/messages`, { params }).then(r => r.data);
export const sendMessage       = (data: { receiver_id: number; content: string; type?: string; media_url?: string }) =>
  api.post('/dating/chat/send', data).then(r => r.data);
export const recallMessage     = (id: number) => api.put(`/dating/chat/${id}/recall`).then(r => r.data);
export const deleteMessage     = (id: number) => api.delete(`/dating/chat/${id}`).then(r => r.data);
export const translateMessage  = (id: number) => api.post(`/dating/chat/${id}/translate`).then(r => r.data);
export const markSeen          = (userId: number) => api.post(`/dating/chat/${userId}/seen`).then(r => r.data);
