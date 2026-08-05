import api from '@admin/api/client';

export const getSocialStats = () =>
  api.get('/social/admin/stats').then(r => r.data?.data ?? r.data);

export const getSocialPosts = (params: Record<string, any>) =>
  api.get('/social/admin/posts', { params }).then(r => r.data);

export const getSocialUsers = (params: Record<string, any>) =>
  api.get('/social/admin/users', { params }).then(r => r.data);

export const getSocialReports = (params: Record<string, any>) =>
  api.get('/social/admin/reports', { params }).then(r => r.data);
