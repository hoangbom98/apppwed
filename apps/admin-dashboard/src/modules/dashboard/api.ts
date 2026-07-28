// @ts-nocheck
// dashboard/api.ts — Dashboard & cross-module stats helpers
import client from '@admin/api/client';

// Global admin stats (online users, today's P&L, balance, registrations…)
export const getDashboardStats = () =>
  client.get('/admin/dashboard/statistics').then(r => r.data?.data ?? r.data);
