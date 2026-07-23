// frontend/admin-dashboard/src/modules/ops/api.ts
// Auto-Ops Platform — API client helpers
import client from '@admin/api/client';

type APIParams = Record<string, any>;
type APIBody = Record<string, any>;

const BASE = '/admin/ops';

// ── Stats ──────────────────────────────────────────────────────────────────
export const opsApi = {
  getStats:              ()         => client.get(`${BASE}/stats`),
  getSegments:           (params: APIParams)   => client.get(`${BASE}/segments`, { params }),
  getSegmentDistribution:()         => client.get(`${BASE}/segments/distribution`),
  analyzeUser:           (userId: string | number)   => client.post(`${BASE}/users/${userId}/analyze`),

  getChurnAlerts:        (params: APIParams)   => client.get(`${BASE}/churn/alerts`, { params }),
  triggerChurnScan:      ()         => client.post(`${BASE}/churn/scan`),

  getTopCLV:             (limit: number)    => client.get(`${BASE}/clv/top`, { params: { limit } }),

  listTasks:             (params: APIParams)   => client.get(`${BASE}/tasks`, { params }),
  createTask:            (body: APIBody)     => client.post(`${BASE}/tasks`, body),
  completeTask:          (id: string | number)       => client.patch(`${BASE}/tasks/${id}/complete`),
  rebalanceTasks:        ()         => client.post(`${BASE}/tasks/rebalance`),

  getDailyReports:       (days: number)     => client.get(`${BASE}/reports/daily`, { params: { days } }),
  triggerDailyReport:    ()         => client.post(`${BASE}/reports/generate`),

  getCampaignStats:      (days: number)     => client.get(`${BASE}/campaigns/stats`, { params: { days } }),
  getCampaignLog:        (days: number)     => client.get(`${BASE}/campaigns/log`, { params: { days } }),
  runCampaigns:          ()         => client.post(`${BASE}/campaigns/run`),
  runMarketing:          ()         => client.post(`${BASE}/marketing/run`),

  getCashFlowForecast:   (days: number)     => client.get(`${BASE}/finance/forecast`, { params: { days } }),
  getCashReserve:        ()         => client.get(`${BASE}/finance/reserve`),

  listExpenses:          (params: APIParams)   => client.get(`${BASE}/finance/expenses`, { params }),
  submitExpense:         (body: APIBody)     => client.post(`${BASE}/finance/expenses`, body),

  runTicketAutoProcess:  ()         => client.post(`${BASE}/tickets/auto-process`),
};
