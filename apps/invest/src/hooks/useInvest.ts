import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InvestPackage {
  id: string;
  name: string;
  description: string | null;
  minAmount: number;
  maxAmount: number;
  dailyProfit: number;   // percent per day
  duration: number;      // days
  totalSlots: number;
  usedSlots: number;
  isActive: boolean;
}

export interface Investment {
  id: string;
  packageId: string;
  amount: number;
  profitPaid: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  package: { name: string; dailyProfit: number; duration: number };
}

export interface Wallet {
  balance: number;
  frozen: number;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function usePackages() {
  return useQuery<InvestPackage[]>({
    queryKey: ['invest', 'packages'],
    queryFn: async () => {
      const { data } = await api.get('/trade/investment/packages');
      return data.data ?? data;
    },
  });
}

export function useMyInvestments(status?: string) {
  return useQuery<{ data: Investment[]; meta: { total: number; pages: number } }>({
    queryKey: ['invest', 'my', status],
    queryFn: async () => {
      const params: Record<string, string> = { page: '1', limit: '50' };
      if (status) params.status = status;
      const { data } = await api.get('/trade/investment/my', { params });
      return data;
    },
  });
}

export function useWallet() {
  return useQuery<Wallet>({
    queryKey: ['invest', 'wallet'],
    queryFn: async () => {
      const { data } = await api.get('/trade/wallet');
      return data.data ?? data;
    },
  });
}

export function useBuyInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { packageId: string; amount: number }) =>
      api.post('/trade/investment/buy', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invest', 'wallet'] });
      qc.invalidateQueries({ queryKey: ['invest', 'my'] });
      qc.invalidateQueries({ queryKey: ['invest', 'packages'] });
    },
  });
}
