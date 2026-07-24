// game/src/api/checkin.ts — Daily check-in API
import api from './httpClient';

export const getCheckinConfig = () =>
  api.get('/game/checkin/config').then(r => r.data.data);

export const getCheckinStatus = () =>
  api.get('/game/checkin/status').then(r => r.data.data);

export const claimCheckin = () =>
  api.post('/game/checkin/claim').then(r => r.data);
