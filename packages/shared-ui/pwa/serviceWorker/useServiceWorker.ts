import { useState, useEffect, useCallback } from 'react';
import { ServiceWorkerManager } from './ServiceWorkerManager';

interface SWStatus {
  isSupported: boolean;
  isRegistered: boolean;
  hasController: boolean;
  updateAvailable: boolean;
}

/**
 * React hook — registers the service worker and exposes status + actions.
 *
 * @param swPath  Path to the service worker file (default: '/sw.js')
 *
 * Usage:
 *   const { isRegistered, updateAvailable, applyUpdate } = useServiceWorker();
 */
export function useServiceWorker(swPath = '/sw.js') {
  const manager = ServiceWorkerManager.getInstance();

  const [status, setStatus] = useState<SWStatus>({
    ...manager.getStatus(),
    updateAvailable: false,
  });

  useEffect(() => {
    // Register on mount
    manager.register(swPath).then(() => {
      setStatus({ ...manager.getStatus(), updateAvailable: false });
    });

    // Listen for update-available event dispatched by ServiceWorkerManager
    const onUpdate = () => {
      setStatus((s) => ({ ...s, updateAvailable: true }));
    };
    document.addEventListener('sw:update-available', onUpdate);
    return () => document.removeEventListener('sw:update-available', onUpdate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Tell the waiting SW to activate and reload the page */
  const applyUpdate = useCallback(() => {
    manager.skipWaiting();
    window.location.reload();
  }, [manager]);

  return {
    ...status,
    applyUpdate,
    clearCache: () => manager.clearCache(),
  };
}
