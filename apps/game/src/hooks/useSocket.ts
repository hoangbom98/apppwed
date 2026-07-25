/**
 * game/src/hooks/useSocket.ts
 * ─────────────────────────────────────────────────────────
 * Game-specific Socket.IO hook.
 *
 * Events handled:
 *   balance:update    → update wallet balance in walletStore
 *   notification      → dispatch toast + badge update
 *   announcement      → dispatch global announcement banner
 *   spin:result       → dispatch lucky wheel result
 *   mission:complete  → dispatch mission completion toast
 */
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore }   from '@ui';
import { useWalletStore } from '@ui';
import toast from 'react-hot-toast';

let _socket: Socket | null = null;

export function useSocket() {
  const { token, user }     = useAuthStore();
  const { setBalance }      = useWalletStore();
  const socketRef           = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const wsUrl = import.meta.env.VITE_WS_URL || '/';
    _socket = io(wsUrl, {
      auth:       { token },
      path:       '/socket.io',
      transports: ['websocket'],
    });
    socketRef.current = _socket;

    // ── Presence ────────────────────────────────────────────────────
    _socket.on('connect', () => {
      if (user?.id) _socket!.emit('subscribe_notifications', user.id);
    });

    // ── Wallet ──────────────────────────────────────────────────────
    _socket.on('balance:update', (data: { balance?: number; coins?: number }) => {
      if (data.balance !== undefined) setBalance(data.balance);
      if (data.coins   !== undefined) {
        (useWalletStore as any).getState().addCoins(data.coins);
      }
    });

    // ── Notifications ────────────────────────────────────────────────
    _socket.on('notification', (data: { title?: string; content?: string }) => {
      toast(data.title || data.content || 'Thông báo mới');
      window.dispatchEvent(new CustomEvent('socket:notification', { detail: data }));
    });

    // ── Announcements ────────────────────────────────────────────────
    _socket.on('announcement', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:announcement', { detail: data }));
    });

    // ── Lucky Wheel result ────────────────────────────────────────────
    _socket.on('spin:result', (data: { prize?: string }) => {
      window.dispatchEvent(new CustomEvent('socket:spin_result', { detail: data }));
    });

    // ── Mission completion ────────────────────────────────────────────
    _socket.on('mission:complete', (data: { name?: string; reward?: number }) => {
      toast.success(`Nhiệm vụ hoàn thành: ${data.name || ''} (+${data.reward || 0} coins)`);
      window.dispatchEvent(new CustomEvent('socket:mission_complete', { detail: data }));
    });

    return () => {
      _socket?.disconnect();
      _socket = null;
      socketRef.current = null;
    };
  }, [token, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Access the raw socket instance outside React (e.g. in game chat components). */
export const getSocket = () => _socket;
