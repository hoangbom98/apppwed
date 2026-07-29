import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

// ── Products ──────────────────────────────────────────────────────────────────
export function useProducts(params?: { type?: string; category?: string; q?: string; page?: number }) {
  return useQuery({
    queryKey: ['store-products', params],
    queryFn: async () => {
      const { data } = await api.get('/store/products', { params });
      return data.data ?? data;
    },
  });
}

export function useProductDetail(slug: string) {
  return useQuery({
    queryKey: ['store-product', slug],
    queryFn: async () => {
      const { data } = await api.get(`/store/products/${slug}`);
      return data.data ?? data;
    },
    enabled: !!slug,
  });
}

// ── Orders ────────────────────────────────────────────────────────────────────
export function useOrders() {
  return useQuery({
    queryKey: ['store-orders'],
    queryFn: async () => {
      const { data } = await api.get('/store/orders');
      return data.data ?? data;
    },
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { items: { productId: string; quantity: number }[]; paymentMethod: string }) => {
      const { data } = await api.post('/store/checkout', payload);
      return data.data ?? data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-orders'] });
      qc.invalidateQueries({ queryKey: ['store-resources'] });
    },
  });
}

// ── My Resources ──────────────────────────────────────────────────────────────
export function useMyResources() {
  return useQuery({
    queryKey: ['store-resources'],
    queryFn: async () => {
      const { data } = await api.get('/store/resources');
      return data.data ?? data;
    },
  });
}

// ── API Keys ──────────────────────────────────────────────────────────────────
export function useAPIKeys() {
  return useQuery({
    queryKey: ['store-apikeys'],
    queryFn: async () => {
      const { data } = await api.get('/store/api-keys');
      return data.data ?? data;
    },
  });
}

export function useCreateAPIKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; productId: string }) => {
      const { data } = await api.post('/store/api-keys', payload);
      return data.data ?? data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-apikeys'] }),
  });
}

// ── Subscriptions ────────────────────────────────────────────────────────────
export function useSubscriptions() {
  return useQuery({
    queryKey: ['store-subscriptions'],
    queryFn: async () => {
      const { data } = await api.get('/store/subscriptions');
      return data.data ?? data;
    },
  });
}
