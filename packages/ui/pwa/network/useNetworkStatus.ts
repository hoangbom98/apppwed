import { useState, useEffect } from 'react';

/**
 * useNetworkStatus — returns real-time online/offline status.
 *
 * Usage:
 *   const { isOnline, isOffline } = useNetworkStatus();
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}

/**
 * useOffline — simpler variant, returns just a boolean.
 *
 * Usage:
 *   const offline = useOffline();
 *   if (offline) return <OfflineBanner />;
 */
export function useOffline(): boolean {
  const { isOffline } = useNetworkStatus();
  return isOffline;
}
