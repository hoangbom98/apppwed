import api from './httpClient';

export const getNotifications  = (p?: any) => api.get('/game/notifications', { params: p }).then(r => r.data);
export const getUnreadCount    = (): Promise<number> =>
  api.get('/game/notifications/unread-count').then(r => r.data?.data?.count ?? 0);
export const markRead          = (id: number) => api.put(`/game/notifications/${id}/read`);
export const markAllRead       = () => api.put('/game/notifications/read-all');
