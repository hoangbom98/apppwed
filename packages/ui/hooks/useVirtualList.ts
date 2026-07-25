// @ts-nocheck
/**
 * useVirtualList.ts — shared-ui/hooks
 * -------------------------------------
 * Lightweight virtual list hook — renders only visible rows.
 * Zero external dependency (no @tanstack/react-virtual required).
 *
 * Usage:
 *   const parentRef = useRef<HTMLDivElement>(null);
 *   const { virtualItems, totalHeight, measureRef } = useVirtualList({
 *     count: items.length,
 *     getScrollElement: () => parentRef.current,
 *     estimateSize: () => 80,   // estimated item height in px
 *     overscan: 5,
 *   });
 *
 *   return (
 *     <div ref={parentRef} style={{ height: 600, overflowY: 'auto' }}>
 *       <div style={{ height: totalHeight, position: 'relative' }}>
 *         {virtualItems.map(item => (
 *           <div key={item.index}
 *             style={{ position: 'absolute', top: 0, left: 0, width: '100%',
 *                      transform: `translateY(${item.start}px)` }}>
 *             {items[item.index]}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface VirtualItem {
  index:  number;
  start:  number;
  end:    number;
  size:   number;
  key:    number;
}

export interface UseVirtualListOptions {
  count:            number;
  getScrollElement: () => HTMLElement | null;
  estimateSize:     (index: number) => number;
  overscan?:        number;
}

export interface UseVirtualListResult {
  virtualItems: VirtualItem[];
  totalHeight:  number;
}

export function useVirtualList({
  count,
  getScrollElement,
  estimateSize,
  overscan = 3,
}: UseVirtualListOptions): UseVirtualListResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const frameRef = useRef<number>(0);

  // Keep track of measured sizes
  const measuredSizes = useRef<Map<number, number>>(new Map());
  const getSizeOf = useCallback(
    (i: number) => measuredSizes.current.get(i) ?? estimateSize(i),
    [estimateSize]
  );

  // Precompute offsets
  const offsets = useRef<number[]>([]);
  useEffect(() => {
    const acc: number[] = [0];
    for (let i = 0; i < count; i++) {
      acc.push(acc[i] + getSizeOf(i));
    }
    offsets.current = acc;
  }, [count, getSizeOf]);

  const totalHeight = offsets.current[count] ?? 0;

  // Attach scroll & resize listeners
  useEffect(() => {
    const el = getScrollElement();
    if (!el) return;

    const onScroll = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => setScrollTop(el.scrollTop));
    };
    const ro = new ResizeObserver(() => setContainerHeight(el.clientHeight));

    setContainerHeight(el.clientHeight);
    el.addEventListener('scroll', onScroll, { passive: true });
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [getScrollElement]);

  // Binary search for start index
  const findStartIndex = (top: number) => {
    const offs = offsets.current;
    let lo = 0, hi = count - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (offs[mid + 1] < top) lo = mid + 1;
      else hi = mid;
    }
    return Math.max(0, lo - overscan);
  };

  const startIndex = findStartIndex(scrollTop);
  const endIndex = (() => {
    const offs = offsets.current;
    const limit = scrollTop + containerHeight;
    let i = startIndex;
    while (i < count && (offs[i] ?? 0) < limit) i++;
    return Math.min(count - 1, i + overscan);
  })();

  const virtualItems: VirtualItem[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const start = offsets.current[i] ?? 0;
    const size  = getSizeOf(i);
    virtualItems.push({ index: i, start, end: start + size, size, key: i });
  }

  return { virtualItems, totalHeight };
}
