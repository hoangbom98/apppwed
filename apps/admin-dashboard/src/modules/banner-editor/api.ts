// @ts-nocheck
// apps/admin-dashboard/src/modules/banner-editor/api.ts
// Thin API wrappers for the Smart Banner Editor endpoints.
import api from '@admin/api/client';

const BASE = '/admin/banner';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BannerLayer {
  id: string;
  templateId: string;
  type: 'background' | 'image' | 'text' | 'button';
  name: string;
  data: Record<string, unknown> | null;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  zIndex: number;
}

export interface BannerTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  width: number;
  height: number;
  background: string | null;
  isActive: boolean;
  layers: BannerLayer[];
  _count?: { layers: number; images: number };
}

export interface GeneratedImage {
  id: string;
  templateId: string;
  url: string;
  storagePath: string;
  width: number;
  height: number;
  format: string;
  variantData: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
}

// ── Template API ──────────────────────────────────────────────────────────────

export const bannerTemplateApi = {
  list: (params?: Record<string, unknown>) =>
    api.get(`${BASE}/templates`, { params }).then(r => r.data),

  get: (id: string) =>
    api.get(`${BASE}/templates/${id}`).then(r => r.data?.data as BannerTemplate),

  create: (body: Partial<BannerTemplate>) =>
    api.post(`${BASE}/templates`, body).then(r => r.data),

  update: (id: string, body: Partial<BannerTemplate>) =>
    api.put(`${BASE}/templates/${id}`, body).then(r => r.data),

  remove: (id: string) =>
    api.delete(`${BASE}/templates/${id}`).then(r => r.data),
};

// ── Layer API ─────────────────────────────────────────────────────────────────

export const bannerLayerApi = {
  add: (templateId: string, body: Partial<BannerLayer>) =>
    api.post(`${BASE}/templates/${templateId}/layers`, body).then(r => r.data),

  update: (layerId: string, body: Partial<BannerLayer>) =>
    api.patch(`${BASE}/layers/${layerId}`, body).then(r => r.data),

  remove: (layerId: string) =>
    api.delete(`${BASE}/layers/${layerId}`).then(r => r.data),
};

// ── Generation API ────────────────────────────────────────────────────────────

export const bannerGenerateApi = {
  single: (templateId: string, variantData: Record<string, unknown>, format = 'png') =>
    api.post(`${BASE}/templates/${templateId}/generate`, { variantData, format }).then(r => r.data),

  batch: (templateId: string, variants: Record<string, unknown>[], format = 'png') =>
    api.post(`${BASE}/templates/${templateId}/batch`, { variants, format }).then(r => r.data),

  listImages: (templateId: string, params?: Record<string, unknown>) =>
    api.get(`${BASE}/templates/${templateId}/images`, { params }).then(r => r.data),

  deleteImage: (imageId: string) =>
    api.delete(`${BASE}/images/${imageId}`).then(r => r.data),
};
