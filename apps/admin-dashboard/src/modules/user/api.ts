// @ts-nocheck
// user/api.ts — User module admin API helpers
import client from '@admin/api/client';

// Aggregate user statistics (total, betting, first-deposit, new users)
export const getUserStats = () =>
  client.get('/admin/user/statistics').then(r => r.data?.data ?? r.data);
