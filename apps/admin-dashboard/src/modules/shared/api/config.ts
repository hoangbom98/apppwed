// @ts-nocheck
// frontend/admin-dashboard/src/modules/shared/api/config.ts
// Config API helper — uses the admin-specific API client.
import client from '@admin/api/client';
import type { AxiosResponse } from 'axios';

/** Fetch all ProjectConfig rows (all projects, all modules). Legacy use only. */
export const fetchAllConfigs = () =>
  client.get('/admin/config').then((r: AxiosResponse) => r.data?.data ?? r.data);

/** Fetch configs for a specific project (optionally filtered by module). */
export const fetchProjectConfigs = (projectCode: string, module: string | null = null) =>
  client
    .get('/admin/ui-config', { params: { project: projectCode, ...(module && { module }) } })
    .then((r: AxiosResponse) => r.data?.data ?? r.data ?? []);

/** Bulk update configs for a project. */
export const updateProjectConfigs = (projectCode: string, updates: unknown[]) =>
  client.put('/admin/ui-config', { project: projectCode, updates }).then((r: AxiosResponse) => r.data);

/** Legacy bulk update without project wrapper (Config.tsx). */
export const updateConfig = (updates: unknown[]) =>
  client.put('/admin/config', { updates }).then((r: AxiosResponse) => r.data);
