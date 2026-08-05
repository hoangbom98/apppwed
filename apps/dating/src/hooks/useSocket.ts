/**
 * dating/src/hooks/useSocket.ts
 * ─────────────────────────────────────────────────────────
 * Dating-specific Socket.IO hook.
 *
 * Events handled:
 *   balance:update   → update coins in walletStore
 *   notification     → dispatch toast + badge update
 *   announcement     → global banner
 *   match:new        → dispatch new match event (toast + badge)
 *   message:new      → dispatch new chat message event
 *   typing:start/stop→ forwarded via CustomEvent for ChatRoom to pick up
 *   call:incoming    → forwarded via CustomEvent for IncomingCallOverlay
 *   call:answer/ice-candidate/call:end → forwarded for WebRTC signaling
 *   live:chat        → forwarded for LiveRoom
 */
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, useWalletStore } from '@ui';
import toast from 'react-hot-toast';

let socketInstance: Socket | null = null;

export function useSocket() {
  const { token, user } = useAuthStore();
  const socketRef       = useRef<Socket | null>(null);
  const { setCoinsAndDiamonds } = useWalletStore() as unknown as { setCoinsAndDiamonds: (coins: number, diamonds: number) => void };

  useEffect(() => {
    if (!token) return;

    const wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      return;
    }

    socketInstance = io(wsUrl, {
      auth:       { token },
      path:       '/socket.io',
      transports: ['polling', 'websocket'], // Allow fallback
    });
    socketRef.current = socketInstance;

    // ── Presence ───────────────────────────────────────────────────
    socketInstance.on('connect', () => {
      if (user?.id) socketInstance?.emit('subscribe_notifications', user.id);
    });

    // ── Wallet / Coins ─────────────────────────────────────────────
    socketInstance.on('balance:update', (data: { coins?: number; diamonds?: number; balance?: number }) => {
      if (data.coins !== undefined && data.diamonds !== undefined) {
        setCoinsAndDiamonds(data.coins, data.diamonds);
      } else if (data.coins !== undefined) {
        setCoinsAndDiamonds(data.coins, 0);
      }
    });

    // ── Notifications ───────────────────────────────────────────────
    socketInstance.on('notification', (data: { title?: string; content?: string; type?: string }) => {
      // Show toast for non-chat notifications only
      if (data.type !== 'message') {
        toast(data.title || data.content || 'Thông báo mới', { icon: '🔔' });
      }
      window.dispatchEvent(new CustomEvent('socket:notification', { detail: data }));
    });

    socketInstance.on('announcement', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:announcement', { detail: data }));
    });

    // ── Match ───────────────────────────────────────────────────────
    socketInstance.on('match:new', (data: { matchId?: string; user?: { fullName?: string; avatar?: string } }) => {
      toast.success(`Bạn có kết đôi mới với ${data.user?.fullName || 'ai đó'}! 💕`);
      window.dispatchEvent(new CustomEvent('socket:match_new', { detail: data }));
    });

    // ── Chat ────────────────────────────────────────────────────────
    socketInstance.on('message:new', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:message_new', { detail: data }));
    });
    socketInstance.on('message:seen', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:message_seen', { detail: data }));
    });
    socketInstance.on('typing:start', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:typing_start', { detail: data }));
    });
    socketInstance.on('typing:stop', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:typing_stop', { detail: data }));
    });

    // ── WebRTC Calls ────────────────────────────────────────────────
    socketInstance.on('call:incoming', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:call_incoming', { detail: data }));
    });
    socketInstance.on('call:answer', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:call_answer', { detail: data }));
    });
    socketInstance.on('call:ice-candidate', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:ice_candidate', { detail: data }));
    });
    socketInstance.on('call:end', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:call_end', { detail: data }));
    });

    // ── Live stream chat ─────────────────────────────────────────────
    socketInstance.on('live:chat', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:live_chat', { detail: data }));
    });

    return () => {
      socketInstance?.disconnect();
      socketInstance = null;
      socketRef.current = null;
    };
  }, [token, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Access the raw socket instance (e.g. for sending WebRTC signals from CallPage). */
export const getSocket = () => _socket;
