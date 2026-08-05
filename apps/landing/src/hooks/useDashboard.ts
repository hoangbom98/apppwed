import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Admin Dashboard stats ──────────────────────────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/stats');
      return data as {
        totalProperties: number;
        totalInquiries: number;
        activeListings: number;
        newInquiries: number;
      };
    },
    staleTime: 60_000,
  });
}

export function useViewsChart() {
  return useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/views-chart');
      return data;
    },
    staleTime: 300_000,
  });
}

// ── Inquiries ──────────────────────────────────────────────────────────────────
export interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  propertyTitle?: string;
  status: 'new' | 'in-progress' | 'resolved';
  createdAt: string;
}

export function useInquiries(page = 1) {
  return useQuery({
    queryKey: ['inquiries', page],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/inquiries', { page } as Record<string, unknown>);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useRecentInquiries() {
  return useQuery({
    queryKey: ['recent-inquiries'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/recent-messages');
      return (data.messages ?? []) as Inquiry[];
    },
    staleTime: 60_000,
  });
}

export function useUpdateInquiryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Inquiry['status'] }) =>
      api.patch(`/api/dashboard/inquiries/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inquiries'] });
      qc.invalidateQueries({ queryKey: ['recent-inquiries'] });
    },
  });
}

// ── KYC ───────────────────────────────────────────────────────────────────────
export interface KycRecord {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export function useKycList(status?: string) {
  return useQuery({
    queryKey: ['kyc-list', status],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/kyc', status ? { status } as Record<string, unknown> : undefined);
      return (data.records ?? data) as KycRecord[];
    },
  });
}

export function useUpdateKycStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      api.patch(`/api/dashboard/kyc/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kyc-list'] }),
  });
}

// ── Social Channels ───────────────────────────────────────────────────────────
export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const { data } = await api.get('/api/public/channels');
      return (data.channels ?? data) as Array<{
        _id: string;
        name: string;
        platform: string;
        url: string;
        isActive: boolean;
      }>;
    },
    staleTime: 300_000,
  });
}

export function useAdminChannels() {
  return useQuery({
    queryKey: ['admin-channels'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/channels');
      return data.channels ?? data;
    },
  });
}
