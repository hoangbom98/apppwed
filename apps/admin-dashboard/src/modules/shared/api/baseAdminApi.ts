import client from '@admin/api/client';
import type { AxiosResponse } from 'axios';

/**
 * Standard resource CRUD helper.
 * Returns data directly to simplify component usage.
 */
export const resource = (path: string) => ({
  list:   (params?: Record<string, unknown>) => client.get(path, { params }).then((r: AxiosResponse) => r.data),
  get:    (id: number | string) => client.get(`${path}/${id}`).then((r: AxiosResponse) => r.data),
  create: (body: Record<string, unknown>) => client.post(path, body).then((r: AxiosResponse) => r.data),
  update: (id: number | string, b: Record<string, unknown>) => client.put(`${path}/${id}`, b).then((r: AxiosResponse) => r.data),
  remove: (id: number | string) => client.delete(`${path}/${id}`).then((r: AxiosResponse) => r.data),
  patch:  (id: number | string, b: Record<string, unknown>) => client.patch(`${path}/${id}`, b).then((r: AxiosResponse) => r.data),
});

/** Shared admin endpoints */
export const adminUsers = {
  list:   (params?: Record<string, unknown>) => client.get('/admin/users', { params }).then((r: AxiosResponse) => r.data),
  update: (id: number | string, b: Record<string, unknown>) => client.patch(`/admin/users/${id}/status`, b).then((r: AxiosResponse) => r.data),
  // Common pattern for many admin toggles
  toggleStatus: (id: number | string) => client.patch(`/admin/users/${id}/status`).then((r: AxiosResponse) => r.data),
};

export const adminStats = {
  get: (module?: string) => client.get('/admin/stats', { params: { module } }).then((r: AxiosResponse) => r.data?.data ?? r.data),
};

export default {
  resource,
  adminUsers,
  adminStats,
};
