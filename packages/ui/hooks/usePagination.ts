// @ts-nocheck
import { useState, useCallback } from 'react';

/**
 * usePagination — manage pagination state
 * Usage:
 *   const { page, limit, offset, setPage, setLimit, reset } = usePagination();
 */
export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage]   = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const offset = (page - 1) * limit;

  const goTo = useCallback((p) => setPage(Math.max(1, p)), []);

  const next = useCallback(() => setPage((p) => p + 1), []);
  const prev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
  }, [initialPage, initialLimit]);

  return { page, limit, offset, setPage: goTo, setLimit, next, prev, reset };
}

export default usePagination;
