/**
 * sports/src/hooks/useSocket.ts
 * ─────────────────────────────────────────────────────────
 * Sports-specific Socket.IO hook.
 *
 * Events handled:
 *   balance:update    → update wallet balance in walletStore
 *   notification      → toast + badge
 *   announcement      → global banner
 *   match_update      → dispatch live score update (MatchDetail subscribes via join_match)
 *   sports_live_chat  → forwarded for StreamDetail live chat
 */
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore }   from '@ui';
import { useWalletStore } from '@ui';
import toast from 'react-hot-toast';

let _socket: Socket | null = null;

export function useSocket() {
  const { token, user } = useAuthStore();
  const { setBalance }  = useWalletStore();
  const socketRef       = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const wsUrl = import.meta.env.VITE_WS_URL || '/';
    _socket = io(wsUrl, {
      auth:       { token },
      path:       '/socket.io',
      transports: ['websocket'],
    });
    socketRef.current = _socket;

    // ── Presence ───────────────────────────────────────────────────
    _socket.on('connect', () => {
      if (user?.id) _socket!.emit('subscribe_notifications', user.id);
    });

    // ── Wallet ─────────────────────────────────────────────────────
    _socket.on('balance:update', (data: { balance?: number }) => {
      if (data.balance !== undefined) setBalance(data.balance);
    });

    // ── Notifications ───────────────────────────────────────────────
    _socket.on('notification', (data: { title?: string; content?: string }) => {
      toast(data.title || data.content || 'Thông báo mới', { icon: '🔔' });
      window.dispatchEvent(new CustomEvent('socket:notification', { detail: data }));
    });

    _socket.on('announcement', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:announcement', { detail: data }));
    });

    // ── Live match score updates ────────────────────────────────────
    // MatchDetail pages join room via getSocket().emit('join_match', matchId)
    _socket.on('match_update', (data: {
      matchId: string;
      homeScore?: number;
      awayScore?: number;
      status?: string;
      liveUpdates?: unknown[];
    }) => {
      window.dispatchEvent(new CustomEvent('socket:match_update', { detail: data }));
    });

    // ── Sports live stream chat ─────────────────────────────────────
    _socket.on('sports_live_chat', (data: unknown) => {
      window.dispatchEvent(new CustomEvent('socket:sports_live_chat', { detail: data }));
    });

    return () => {
      _socket?.disconnect();
      _socket = null;
      socketRef.current = null;
    };
  }, [token, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Access the raw socket instance — used by MatchDetail/StreamDetail to join rooms. */
export const getSocket = () => _socket;
