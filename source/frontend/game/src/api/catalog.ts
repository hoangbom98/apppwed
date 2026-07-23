import api from './httpClient';

export const getCategories = () => api.get('/game/categories').then(r => r.data.data);
export const getGames      = (params?: any) => api.get('/game/games', { params }).then(r => r.data);
export const getGameBySlug = (slug: string) => api.get(`/game/games/${slug}`).then(r => r.data.data);
export const startSession  = (game_id: number) => api.post('/game/sessions', { game_id }).then(r => r.data.data);
