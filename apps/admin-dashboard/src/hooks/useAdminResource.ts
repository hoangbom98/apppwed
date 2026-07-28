/**
 * apps/admin-dashboard/src/hooks/useAdminResource.ts
 *
 * Shared hooks để loại bỏ boilerplate TanStack Query lặp lại toàn dự án.
 *
 * Quy ước response backend (shared/utils/response.ts):
 *   success: { success, data, message, timestamp }
 *   paginate: { success, data: T[], meta: { total, page, limit, pages }, timestamp }
 *
 * Usage:
 *   const { rows, total, page, setPage, isLoading } =
 *     usePaginatedQuery('game-admin-rounds', adminGameRounds.list, { status: 'finished' });
 *
 *   const save = useAdminMutation(adminGameProviders.create, {
 *     invalidate: ['game-admin-providers'],
 *     successMsg: 'Đã tạo provider',
 *   });
 */
import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { App } from 'antd';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  rows:       T[];
  total:      number;
  page:       number;
  setPage:    (p: number) => void;
  isLoading:  boolean;
  refetch:    () => void;
}

export interface MutationOptions {
  /** Query keys to invalidate on success */
  invalidate?: QueryKey[];
  successMsg?: string;
  errorMsg?:   string;
  onSuccess?:  (data: any) => void;
  onError?:    (err: any) => void;
}

// ── Unwrap backend envelope ────────────────────────────────────────────────────
function unwrap(r: any): any {
  // Backend returns { data: T, success: true, ... } via success() / ok()
  // Paginated: { data: T[], meta: {...} }
  const inner = r?.data ?? r;
  if (inner?.success !== undefined) return inner.data ?? inner;
  return inner;
}

function unwrapPaginated(r: any): { rows: any[]; total: number } {
  const inner = r?.data ?? r;
  // Paginated envelope: { data: [], meta: { total } }
  if (Array.isArray(inner?.data)) {
    return { rows: inner.data, total: inner.meta?.total ?? inner.total ?? inner.data.length };
  }
  // Flat array fallback
  if (Array.isArray(inner)) return { rows: inner, total: inner.length };
  return { rows: [], total: 0 };
}

// ── usePaginatedQuery ─────────────────────────────────────────────────────────
/**
 * Paginated list query with automatic unwrapping.
 *
 * @param baseKey  - TanStack Query key prefix (string or array)
 * @param fetcher  - (params: any) => Promise<AxiosResponse>
 * @param filters  - extra filter params merged with { page, limit }
 * @param options  - TanStack query options overrides
 */
export function usePaginatedQuery<T = any>(
  baseKey:  string | any[],
  fetcher:  (params: Record<string, any>) => Promise<any>,
  filters:  Record<string, any> = {},
  options:  { limit?: number; staleTime?: number; enabled?: boolean } = {},
): PaginatedResult<T> {
  const [page, setPage] = useState(1);
  const limit  = options.limit ?? 20;
  const qKey   = Array.isArray(baseKey) ? [...baseKey, page, filters] : [baseKey, page, filters];

  const { data, isLoading, refetch } = useQuery({
    queryKey:  qKey,
    queryFn:   () => fetcher({ ...filters, page, limit }).then(r => r.data ?? r),
    staleTime: options.staleTime ?? 15_000,
    enabled:   options.enabled !== false,
  });

  const { rows, total } = unwrapPaginated(data);

  return { rows: rows as T[], total, page, setPage, isLoading, refetch };
}

// ── useAdminQuery ─────────────────────────────────────────────────────────────
/**
 * Non-paginated query — wraps useQuery with auto-unwrap.
 *
 * @param queryKey  - TanStack Query key
 * @param fetcher   - () => Promise<AxiosResponse>
 * @param options   - TanStack query options overrides
 */
export function useAdminQuery<T = any>(
  queryKey: QueryKey,
  fetcher:  () => Promise<any>,
  options:  { staleTime?: number; refetchInterval?: number; enabled?: boolean } = {},
) {
  const query = useQuery({
    queryKey,
    queryFn:   () => fetcher().then(r => unwrap(r.data ?? r)),
    staleTime: options.staleTime ?? 30_000,
    refetchInterval: options.refetchInterval,
    enabled:   options.enabled !== false,
  });

  return { ...query, data: query.data as T | undefined };
}

// ── useAdminMutation ──────────────────────────────────────────────────────────
/**
 * Mutation with automatic invalidation and toast feedback.
 *
 * @example
 *   const del = useAdminMutation(id => adminProviders.remove(id), {
 *     invalidate: ['game-admin-providers'],
 *     successMsg: 'Đã xoá',
 *   });
 *   del.mutate(row.id);
 */
export function useAdminMutation<TVariables = any, TData = any>(
  mutFn:   (vars: TVariables) => Promise<any>,
  opts:    MutationOptions = {},
) {
  const qc = useQueryClient();
  const { message } = App.useApp();

  return useMutation<TData, Error, TVariables>({
    mutationFn: mutFn,
    onSuccess: (data) => {
      if (opts.invalidate?.length) {
        opts.invalidate.forEach(key => qc.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] }));
      }
      if (opts.successMsg) message.success(opts.successMsg);
      opts.onSuccess?.(data);
    },
    onError: (err: any) => {
      const msg = opts.errorMsg ?? err?.response?.data?.message ?? 'Có lỗi xảy ra';
      message.error(msg);
      opts.onError?.(err);
    },
  });
}

// ── useConfirmAction ──────────────────────────────────────────────────────────
/**
 * Returns a function that shows AntD modal.confirm before executing action.
 *
 * @example
 *   const confirmDelete = useConfirmAction({
 *     title:  'Xoá mục này?',
 *     okType: 'danger',
 *     action: (id) => delMut.mutateAsync(id),
 *   });
 *   <Button onClick={() => confirmDelete(row.id)}>Xoá</Button>
 */
export function useConfirmAction<T = any>(opts: {
  title:    string;
  content?: string | ((arg: T) => string);
  okText?:  string;
  okType?:  'danger' | 'primary';
  action:   (arg: T) => Promise<any> | void;
}) {
  const { modal } = App.useApp();

  return (arg: T) => {
    const content = typeof opts.content === 'function' ? opts.content(arg) : opts.content;
    modal.confirm({
      title:    opts.title,
      content,
      okText:   opts.okText ?? 'Xác nhận',
      okType:   opts.okType ?? 'primary',
      cancelText: 'Huỷ',
      onOk: () => opts.action(arg),
    });
  };
}
