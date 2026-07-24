import { useState, useCallback } from 'react';

/**
 * useSort — manage table sort state
 * Usage:
 *   const { sortKey, sortOrder, getSortProps, toggleSort } = useSort('createdAt', 'desc');
 *   // sortProps for a column: getSortProps('name')
 *   // → { onClick: fn, 'aria-sort': 'ascending' | 'descending' | 'none' }
 */
export function useSort(defaultKey = '', defaultOrder = 'desc') {
  const [sortKey, setSortKey]     = useState(defaultKey);
  const [sortOrder, setSortOrder] = useState(defaultOrder);

  const toggleSort = useCallback((key) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  }, [sortKey]);

  const getSortProps = useCallback((key) => ({
    onClick:    () => toggleSort(key),
    'aria-sort': sortKey === key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none',
    style:      { cursor: 'pointer', userSelect: 'none' },
  }), [sortKey, sortOrder, toggleSort]);

  const reset = useCallback(() => {
    setSortKey(defaultKey);
    setSortOrder(defaultOrder);
  }, [defaultKey, defaultOrder]);

  return { sortKey, sortOrder, toggleSort, getSortProps, reset };
}

export default useSort;
