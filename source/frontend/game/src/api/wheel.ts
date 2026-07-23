// game/src/api/wheel.ts — Lucky Wheel API
import api from './httpClient';

export const getWheel = () =>
  api.get('/game/wheel').then(r => r.data.data);

export const getMySpins = () =>
  api.get('/game/wheel/my-spins').then(r => r.data.data);

export const spinWheel = (isFree = true) =>
  api.post('/game/wheel/spin', { isFree }).then(r => r.data);

export const getSpinHistory = (page = 1) =>
  api.get('/game/wheel/history', { params: { page } }).then(r => r.data);
