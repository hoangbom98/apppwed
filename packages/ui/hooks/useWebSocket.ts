// @ts-nocheck
/**
 * useWebSocket.ts — Tầng 6: Generic WebSocket hook
 *
 * A production-ready Socket.IO hook with:
 *  - Auto-reconnect with exponential backoff
 *  - Room subscribe/unsubscribe management
 *  - Typed event listener registration
 *  - Connection status tracking
 *  - Graceful cleanup on unmount
 *
 * USAGE
 * ─────
 *   import { useWebSocket } from '@lkvip/ui';
 *
 *   // Game lobby: subscribe to price updates
 *   const { isConnected, on, emit, joinRoom, leaveRoom } = useWebSocket({
 *     url:   import.meta.env.VITE_WS_URL,
 *     token: accessToken,
 *   });
 *
 *   useEffect(() => {
 *     joinRoom('price:BTC/USDT');
 *     on('price:update', (data) => setPrice(data.price));
 *     return () => leaveRoom('price:BTC/USDT');
 *   }, []);
 *
 *   // Emit action
 *   emit('match:subscribe', { matchId: 123 });
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface UseWebSocketOptions {
  /** Socket.IO server URL, e.g. import.meta.env.VITE_WS_URL */
  url?: string;
  /** JWT access token — passed as socket.auth.token */
  token?: string | null;
  /** Socket.IO namespace path (default '/socket.io') */
  path?: string;
  /** Auto-connect on mount (default true) */
  autoConnect?: boolean;
  /** Max reconnection attempts (default 10) */
  reconnectionAttempts?: number;
}

export interface UseWebSocketReturn {
  /** Whether the socket is currently connected */
  isConnected: boolean;
  /** Number of reconnection attempts so far */
  reconnectCount: number;
  /** Register an event listener — auto-cleaned up on unmount */
  on: (event: string, handler: (...args: any[]) => void) => void;
  /** Remove a specific event listener */
  off: (event: string, handler: (...args: any[]) => void) => void;
  /** Emit an event with optional payload */
  emit: (event: string, data?: any) => void;
  /** Join a Socket.IO room */
  joinRoom: (room: string) => void;
  /** Leave a Socket.IO room */
  leaveRoom: (room: string) => void;
  /** Manually connect (if autoConnect=false or after disconnect) */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
  /** The underlying socket instance (use sparingly) */
  socket: Socket | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url               = (typeof window !== 'undefined' ? (window as any).__WS_URL__ : undefined) || '/',
    token             = null,
    path              = '/socket.io',
    autoConnect       = true,
    reconnectionAttempts = 10,
  } = options;

  const socketRef       = useRef<Socket | null>(null);
  const listenersRef    = useRef<Array<{ event: string; handler: (...args: any[]) => void }>>([]);
  const [isConnected,   setIsConnected]   = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);

  // ── Init socket ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoConnect) return;

    const s = io(url, {
      auth:                 { token },
      path,
      transports:           ['websocket', 'polling'],
      reconnection:         true,
      reconnectionAttempts,
      reconnectionDelay:    1_000,
      reconnectionDelayMax: 10_000,
      autoConnect:          true,
    });

    socketRef.current = s;

    s.on('connect',            () => { setIsConnected(true); setReconnectCount(0); });
    s.on('disconnect',         () => setIsConnected(false));
    s.on('reconnect',          (n: number) => setReconnectCount(n));
    s.on('reconnect_attempt',  (n: number) => setReconnectCount(n));

    return () => {
      // Remove all registered listeners
      for (const { event, handler } of listenersRef.current) {
        s.off(event, handler);
      }
      listenersRef.current = [];
      s.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, token]);

  // ── Public API ───────────────────────────────────────────────────────────

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    listenersRef.current.push({ event, handler });
  }, []);

  const off = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.off(event, handler);
    listenersRef.current = listenersRef.current.filter(
      (l) => !(l.event === event && l.handler === handler),
    );
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit('join_room', room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit('leave_room', room);
  }, []);

  const connect = useCallback(() => {
    socketRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return {
    isConnected,
    reconnectCount,
    on,
    off,
    emit,
    joinRoom,
    leaveRoom,
    connect,
    disconnect,
    socket: socketRef.current,
  };
}
