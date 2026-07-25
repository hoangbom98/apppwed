// frontend/shared-ui/hooks/useUnreadCount.js
// Combines API polling + socket realtime for notification unread count.
// Used by H5Header across all sub-projects.
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

const PROJECT = import.meta.env.VITE_PROJECT || 'hub';

/**
 * Returns the current unread notification count.
 * - Polls the REST endpoint every 60 seconds as fallback.
 * - Increments instantly when a socket:notification event fires.
 *
 * @returns {number} unreadCount
 */
export function useUnreadCount() {
  const { token, user } = useAuthStore();
  const qc = useQueryClient();
  const [socketDelta, setSocketDelta] = useState(0);

  // REST polling — enabled only when logged in
  const { data: apiCount = 0 } = useQuery({
    queryKey:             ['unreadCount', PROJECT],
    queryFn:              () =>
      api.get(`/${PROJECT}/notifications/unread-count`)
         .then(r => Number(r.data?.data?.count ?? r.data?.count ?? 0)),
    enabled:              !!token && !!user,
    staleTime:            30_000,
    refetchInterval:      60_000,
    refetchOnWindowFocus: false,
    retry:                false,
  });

  // Socket realtime — listen for window-level custom events dispatched by useSocket
  useEffect(() => {
    const onNotif = () => {
      setSocketDelta(d => d + 1);
    };
    const onReset = () => {
      setSocketDelta(0);
      qc.invalidateQueries({ queryKey: ['unreadCount', PROJECT] });
    };

    window.addEventListener('socket:notification', onNotif);
    window.addEventListener('socket:notifications:reset', onReset);
    return () => {
      window.removeEventListener('socket:notification', onNotif);
      window.removeEventListener('socket:notifications:reset', onReset);
    };
  }, [qc]);

  // Reset delta whenever a fresh API count arrives
  useEffect(() => {
    setSocketDelta(0);
  }, [apiCount]);

  return apiCount + socketDelta;
}
