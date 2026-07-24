// Compat shim: @/api/apiDaiLy — re-exports from agencyLegacy canonical implementation
export * from './agencyLegacy';

// Additional paginated endpoints
import api from './httpClient';

export const getAgentTree       = () =>
  api.get('/game/agent/tree').then(r => r.data.data);

export const getAgentCommissions = (page = 1) =>
  api.get('/game/agent/commissions', { params: { page } }).then(r => r.data);

export const getReferralsPaginated = (page = 1) =>
  api.get('/game/agent/referrals', { params: { page } }).then(r => r.data);
