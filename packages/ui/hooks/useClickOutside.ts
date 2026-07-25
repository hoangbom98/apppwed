// @ts-nocheck
import { useEffect, useRef } from 'react';

/**
 * useClickOutside — fires callback when click occurs outside ref element
 * Usage:
 *   const ref = useClickOutside(() => setOpen(false));
 *   return <div ref={ref}>...</div>
 */
export function useClickOutside(callback) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback(event);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [callback]);

  return ref;
}

export default useClickOutside;
