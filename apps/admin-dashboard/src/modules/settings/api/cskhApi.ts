// admin-dashboard/src/modules/settings/api/cskhApi.ts
// API helpers cho CSKH config — đọc/lưu qua /admin/cskh/:projectSlug
import client from '@admin/api/client';

export const CSKH_PROJECTS = ['game', 'hub', 'dating', 'sports', 'trade'] as const;

export type CskhProjectSlug = typeof CSKH_PROJECTS[number];

// Lấy config của một project
export const getCskhConfig = (projectSlug: string) =>
  client.get(`/admin/cskh/${projectSlug}`).then(r => r.data?.data ?? r.data);

// Lưu config của một project
export const saveCskhConfig = (projectSlug: string, body: object) =>
  client.put(`/admin/cskh/${projectSlug}`, body).then(r => r.data?.data ?? r.data);

// Lấy tất cả config (cho trang tổng quan)
export const getAllCskhConfigs = () =>
  client.get('/admin/cskh').then(r => r.data?.data ?? r.data);
