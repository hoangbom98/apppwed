// game/src/api/missions.ts — Daily missions API
import api from './httpClient';

export const getMissions = () =>
  api.get('/game/missions').then(r => r.data.data);

export const claimMission = (templateId: string) =>
  api.post(`/game/missions/${templateId}/claim`).then(r => r.data);
