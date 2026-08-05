// frontend/hub/src/hooks/useSocket.ts
// Hub real-time Socket.IO hook
// Events: balance | notification | announcement | system:maintenance
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = (import.meta.env.VITE_API_URL as string)?.replace('/api', '') || 'http://localhost:5000';

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useSocket() {
  const { token, isLoggedIn } = useAuthStore() as { token: string | null; isLoggedIn: boolean };
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !token) return;

    const socket = io(SOCKET_URL, {
      auth:       { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
    });

    socketRef.current = socket;

    // ── Connection lifecycle ────────────────────────────────────────────────
    socket.on('connect', () => {
      socket.emit('join:project', 'hub');
    });

    socket.on('disconnect', () => {
      // Intentionally silent
    });

    // ── Notification ────────────────────────────────────────────────────────
    socket.on('notification', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('hub:notification', { detail: data }));
    });

    // ── Announcement (site-wide broadcast) ─────────────────────────────────
    socket.on('announcement', (data: { title: string; message: string; type: string }) => {
      window.dispatchEvent(new CustomEvent('hub:announcement', { detail: data }));
    });

    // ── System maintenance notice ───────────────────────────────────────────
    socket.on('system:maintenance', (data: { scheduled: boolean; eta: string }) => {
      window.dispatchEvent(new CustomEvent('hub:maintenance', { detail: data }));
    });

    // ── Profile update (e.g., avatar change from another device) ───────────
    socket.on('profile:updated', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('hub:profile:updated', { detail: data }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLoggedIn, token]);

  return socketRef;
}

export default useSocket;
