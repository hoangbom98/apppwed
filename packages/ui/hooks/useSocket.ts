// @ts-nocheck
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';

let socket = null;

export const useSocket = () => {
  const { token, user } = useAuthStore();
  const { setBalance, setCoinsAndDiamonds } = useWalletStore();

  useEffect(() => {
    if (!token) return;

    socket = io(import.meta.env.VITE_WS_URL || '/', {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      if (user?.id) {
        socket.emit('subscribe_notifications', user.id);
      }
    });

    socket.on('balance:update', (data) => {
      if (data.coins !== undefined && data.diamonds !== undefined) {
        setCoinsAndDiamonds(data.coins, data.diamonds);
      } else if (data.balance !== undefined) {
        setBalance(data.balance);
      }
    });

    socket.on('notification', (data) => {
      window.dispatchEvent(new CustomEvent('socket:notification', { detail: data }));
    });

    socket.on('announcement', (data) => {
      window.dispatchEvent(new CustomEvent('socket:announcement', { detail: data }));
    });

    socket.on('match:new', (data) => {
      window.dispatchEvent(new CustomEvent('socket:match', { detail: data }));
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [token, user]);

  return socket;
};

export const getSocket = () => socket;
