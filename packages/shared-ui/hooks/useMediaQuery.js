// frontend/shared-ui/hooks/useMediaQuery.js
import { useState, useEffect } from 'react';

/**
 * Returns true when the given CSS media query matches.
 * @param {string} query - e.g. '(max-width: 768px)'
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
