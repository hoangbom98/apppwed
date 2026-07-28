import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Wallet {
  userId: string;
  balance: number;
  frozen: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

export interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: string;
  status: string;
  createdAt: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useWallet() {
  return useQuery<Wallet>({
    queryKey: ['bank', 'wallet'],
    queryFn: async () => {
      const { data } = await api.get('/trade/wallet');
      return data.data ?? data;
    },
  });
}

export function useTransactions(page = 1, type?: string) {
  return useQuery<{ data: Transaction[]; meta: { total: number; pages: number } }>({
    queryKey: ['bank', 'transactions', page, type],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (type) params.type = type;
      const { data } = await api.get('/trade/wallet/history', { params });
      return data;
    },
  });
}

export function useBankAccounts() {
  return useQuery<BankAccount[]>({
    queryKey: ['bank', 'accounts'],
    queryFn: async () => {
      const { data } = await api.get('/trade/bank-accounts');
      return data.data ?? data;
    },
  });
}

export function useWithdrawals(page = 1) {
  return useQuery<{ data: Withdrawal[]; meta: { total: number; pages: number } }>({
    queryKey: ['bank', 'withdrawals', page],
    queryFn: async () => {
      const { data } = await api.get('/trade/wallet/history', { params: { page, limit: 20, type: 'withdraw' } });
      return data;
    },
  });
}

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amount: number; fee?: number; method: string; bankInfo?: object }) =>
      api.post('/trade/wallet/withdraw', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank', 'wallet'] });
      qc.invalidateQueries({ queryKey: ['bank', 'withdrawals'] });
    },
  });
}

export function useCreateDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amount: number; method: string }) =>
      api.post('/trade/deposit', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank', 'wallet'] });
    },
  });
}

export function useAddBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { bankName: string; accountNumber: string; accountName: string }) =>
      api.post('/trade/bank-accounts', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank', 'accounts'] }),
  });
}

export function useSetDefaultAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/trade/bank-accounts/${id}/default`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank', 'accounts'] }),
  });
}
