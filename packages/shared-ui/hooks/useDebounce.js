// frontend/shared-ui/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of `value` that only updates after `delay` ms of inactivity.
 * @template T
 * @param {T}      value
 * @param {number} delay  milliseconds
 * @returns {T}
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
