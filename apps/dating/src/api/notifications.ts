import api from './client';

export const getNotifications = (params?: any) => api.get('/dating/notifications', { params }).then(r => r.data);
export const markRead         = (id: number) => api.put(`/dating/notifications/${id}/read`).then(r => r.data);
export const markAllRead      = () => api.put('/dating/notifications/read-all').then(r => r.data);
export const getUnreadCount   = () => api.get('/dating/notifications/unread-count').then(r => r.data);
