// @ts-nocheck
/**
 * finance/api.ts — Group Finance API helpers
 * Tất cả calls đến /api/admin/group-finance/*
 */
import api from '@admin/api/client';
import type { AxiosResponse } from 'axios';

const r = <T>(p: Promise<AxiosResponse<{ data: T }>>) =>
  p.then(res => res.data?.data ?? res.data);

// ── Fee Configs ──────────────────────────────────────────────────────────────
export const feeConfigApi = {
  list:        ()              => r(api.get('/admin/group-finance/fee-configs')),
  bySource:    (src: string)   => r(api.get(`/admin/group-finance/fee-configs/source/${src}`)),
  upsert:      (body: object)  => r(api.post('/admin/group-finance/fee-configs', body)),
  seed:        ()              => r(api.post('/admin/group-finance/fee-configs/seed')),
  toggle:      (id: string, isActive: boolean) =>
    r(api.patch(`/admin/group-finance/fee-configs/${id}/toggle`, { isActive })),
  delete:      (id: string)    => r(api.delete(`/admin/group-finance/fee-configs/${id}`)),
};

// ── P&L + Project Balances ───────────────────────────────────────────────────
export const groupFinanceApi = {
  pnl:              (from: string, to: string) =>
    r(api.get('/admin/group-finance/pnl', { params: { from, to } })),
  projectBalances:  ()             => r(api.get('/admin/group-finance/project-balances')),
  loans:            (status?: string) =>
    r(api.get('/admin/group-finance/loans', { params: status ? { status } : undefined })),
  feeLogs:          (params: object) =>
    r(api.get('/admin/group-finance/fee-logs', { params })),
  runInterest:      ()             => r(api.post('/admin/group-finance/interest/run')),
};
