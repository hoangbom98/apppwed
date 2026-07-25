/**
 * usePrefetch.ts — shared-ui/hooks
 * ----------------------------------
 * React Query prefetch utilities for hover-intent and programmatic prefetching.
 * Reduces perceived latency — data is in cache by the time user navigates.
 *
 * Exports:
 *   usePrefetch         — hook that returns a prefetch trigger function
 *   prefetchOnHover     — spread onto any element's onMouseEnter / onFocus
 *
 * Usage (hook):
 *   const prefetch = usePrefetch(['posts', id], () => api.get(`/posts/${id}`));
 *   <Link to={`/posts/${id}`} onMouseEnter={prefetch}>Read More</Link>
 *
 * Usage (helper):
 *   <Link {...prefetchOnHover(queryClient, ['posts', id], () => api.get(`/posts/${id}`))}>
 *     Read More
 *   </Link>
 */

import { useCallback, useRef } from 'react';
import { useQueryClient, QueryClient } from '@tanstack/react-query';

export interface PrefetchOptions {
  /** Minimum time (ms) the user hovers before prefetch fires (default 100) */
  delay?:   number;
  /** React Query stale-time for the prefetched entry (ms, default 60_000) */
  staleTime?: number;
}

/**
 * Returns a stable callback that prefetches a query when called.
 * Fires after a short delay to avoid prefetching on accidental mouse-overs.
 *
 * @param queryKey  React Query key (same as used in useQuery)
 * @param fetcher   Async function that returns the data
 * @param options   { delay, staleTime }
 */
export function usePrefetch<TData = unknown>(
  queryKey:  readonly unknown[],
  fetcher:   () => Promise<TData>,
  options:   PrefetchOptions = {}
): () => void {
  const { delay = 100, staleTime = 60_000 } = options;
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn: fetcher,
        staleTime,
      });
    }, delay);
  }, [queryClient, queryKey, fetcher, delay, staleTime]);

  return prefetch;
}

/**
 * Spread this onto any element to automatically prefetch on hover/focus.
 * Stateless — create once per render and spread.
 *
 * @example
 *   const client = useQueryClient();
 *   <img {...prefetchOnHover(client, ['avatar', userId], () => fetchAvatar(userId))} />
 */
export function prefetchOnHover<TData = unknown>(
  queryClient: QueryClient,
  queryKey:    readonly unknown[],
  fetcher:     () => Promise<TData>,
  options:     PrefetchOptions = {}
): {
  onMouseEnter: () => void;
  onFocus:      () => void;
} {
  const { staleTime = 60_000 } = options;

  const trigger = () =>
    queryClient.prefetchQuery({ queryKey, queryFn: fetcher, staleTime });

  return {
    onMouseEnter: trigger,
    onFocus:      trigger,
  };
}
