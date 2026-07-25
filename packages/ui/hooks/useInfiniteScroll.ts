// @ts-nocheck
/**
 * useInfiniteScroll.ts — shared-ui/hooks
 * ----------------------------------------
 * IntersectionObserver-based infinite scroll trigger hook.
 * Fires `onLoadMore` when the sentinel element enters the viewport.
 *
 * Zero dependencies — no external library needed.
 *
 * Usage:
 *   const { sentinelRef, isFetching } = useInfiniteScroll({
 *     onLoadMore: fetchNextPage,
 *     hasMore: hasNextPage,
 *     threshold: 0.5,
 *   });
 *
 *   return (
 *     <div>
 *       {items.map(...)}
 *       <div ref={sentinelRef} />
 *       {isFetching && <Spinner />}
 *     </div>
 *   );
 */

import { useRef, useEffect, useCallback, useState } from 'react';

export interface UseInfiniteScrollOptions {
  /** Called when sentinel enters viewport */
  onLoadMore:   () => void | Promise<void>;
  /** False → sentinel is not observed (no more pages) */
  hasMore:      boolean;
  /** IntersectionObserver threshold 0-1 (default 0.1) */
  threshold?:   number;
  /** Extra bottom margin (px, default 100) — fires earlier */
  rootMargin?:  string;
  /** Debounce delay before firing (ms, default 100) */
  debounce?:    number;
}

export interface UseInfiniteScrollResult {
  /** Attach to the sentinel div at the bottom of the list */
  sentinelRef: React.RefObject<HTMLDivElement>;
  /** True while onLoadMore is in-flight */
  isFetching:  boolean;
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  threshold  = 0.1,
  rootMargin = '0px 0px 100px 0px',
  debounce   = 100,
}: UseInfiniteScrollOptions): UseInfiniteScrollResult {
  const sentinelRef = useRef<HTMLDivElement>(null!);
  const [isFetching, setIsFetching] = useState(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setIsFetching(true);
    try {
      await onLoadMore();
    } finally {
      fetchingRef.current = false;
      setIsFetching(false);
    }
  }, [onLoadMore, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => loadMore(), debounce);
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hasMore, loadMore, threshold, rootMargin, debounce]);

  return { sentinelRef, isFetching };
}
