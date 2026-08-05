import api from '@admin/api/client';

export const getProdevsStats = () =>
  api.get('/admin/prodevs/stats').then(r => r.data?.data ?? r.data);

export const getProdevsProjects = (params?: Record<string, any>) =>
  api.get('/admin/prodevs/projects', { params }).then(r => r.data?.data ?? r.data ?? []);

export const getProdevsTemplates = () =>
  api.get('/admin/prodevs/templates').then(r => r.data?.data ?? r.data ?? []);

export const getAIConfig = () =>
  api.get('/admin/prodevs/ai-config').then(r => r.data?.data ?? r.data);

export const saveAIConfig = (body: Record<string, any>) =>
  api.put('/admin/prodevs/ai-config', body).then(r => r.data);
