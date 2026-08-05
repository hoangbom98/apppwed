import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Property } from '@/data/properties';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface PropertyFilters {
  search?: string;
  type?: string;
  category?: string;
  beds?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedProperties {
  properties: Property[];
  totalPages: number;
  currentPage: number;
  total: number;
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

/** Danh sách bất động sản công khai (có filter + phân trang) */
export function useProperties(filters: PropertyFilters = {}) {
  return useQuery<PaginatedProperties>({
    queryKey: ['properties', filters],
    queryFn: async () => {
      const { data } = await api.get('/api/public/properties', filters as Record<string, unknown>);
      return data;
    },
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

/** Chi tiết một bất động sản theo ID hoặc slug */
export function usePropertyDetail(id: string) {
  return useQuery<Property>({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/public/properties/${id}`);
      return data.property ?? data;
    },
    enabled: !!id,
    staleTime: 120_000,
  });
}

/** Stats công khai cho trang chủ */
export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/public/stats');
      return data;
    },
    staleTime: 300_000,
  });
}

/** Gửi yêu cầu liên hệ */
export function useSubmitInquiry() {
  return useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      phone?: string;
      message: string;
      propertyId?: string;
    }) => api.post('/api/public/inquiry', payload),
  });
}

// ── Admin hooks ────────────────────────────────────────────────────────────────

/** Admin: tất cả properties (có phân trang) */
export function useAdminProperties(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['admin-properties', page, limit],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/properties', { page, limit } as Record<string, unknown>);
      return data;
    },
  });
}

/** Admin: tạo property mới */
export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.postForm('/api/dashboard/properties', formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-properties'] }),
  });
}

/** Admin: cập nhật property */
export function useUpdateProperty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.postForm(`/api/dashboard/properties/${id}`, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-properties'] });
      qc.invalidateQueries({ queryKey: ['property', id] });
    },
  });
}

/** Admin: xóa property */
export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/dashboard/properties/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-properties'] }),
  });
}
