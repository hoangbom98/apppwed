import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useSportsStore } from '../store/sportsStore';

let socket: Socket | null = null;

export const useSocket = () => {
  const { token, user } = useAuthStore();
  const { incrementUnread } = useSportsStore();
  const initialised = useRef(false);

  useEffect(() => {
    if (!token || initialised.current) return;
    initialised.current = true;

    socket = io(import.meta.env.VITE_WS_URL || '/', {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      if (user?.id) socket!.emit('subscribe_notifications', user.id);
    });

    socket.on('match_update', (data) => {
      window.dispatchEvent(new CustomEvent('sports:match_update', { detail: data }));
    });

    socket.on('sports_live_chat', (msg) => {
      window.dispatchEvent(new CustomEvent('sports:live_chat', { detail: msg }));
    });

    socket.on('notification', () => {
      incrementUnread();
      window.dispatchEvent(new CustomEvent('sports:notification'));
    });

    return () => {
      socket?.disconnect();
      socket = null;
      initialised.current = false;
    };
  }, [token, user]);

  return socket;
};

export const getSocket = () => socket;
