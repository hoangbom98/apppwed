import api from './httpClient';

export const getPromotions = () => api.get('/game/promotions').then(r => r.data.data);
export const getPromotion  = (id: number) => api.get(`/game/promotions/${id}`).then(r => r.data.data);
