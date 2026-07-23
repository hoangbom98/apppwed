import api from './client';

export const getShopItems   = (category?: string) => api.get('/dating/shop/items', { params: { category } }).then(r => r.data);
export const buyItem        = (item_id: number) => api.post('/dating/shop/buy', { item_id }).then(r => r.data);
export const getGifts       = () => api.get('/dating/gifts').then(r => r.data);
export const sendGift       = (data: { receiver_id: number; gift_id: number; quantity?: number }) =>
  api.post('/dating/gifts/send', data).then(r => r.data);
