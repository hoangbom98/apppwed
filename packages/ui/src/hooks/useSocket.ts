// packages/shared-ui/src/hooks/useSocket.ts
// Shared Socket.IO hook — wraps connection lifecycle
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface UseSocketOptions {
  url?:       string;
  token?:     string;
  namespace?: string;
  autoConnect?: boolean;
}

export function useSocket(opts: UseSocketOptions = {}) {
  const {
    url        = '/api',
    token      = localStorage.getItem('token') ?? undefined,
    namespace  = '',
    autoConnect = true,
  } = opts;

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!autoConnect) return;

    const socket = io(`${url}${namespace}`, {
      auth:       token ? { token } : undefined,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [url, namespace, token, autoConnect]);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  }, []);

  return { socket: socketRef.current, connected, emit, on };
}

// ── Singleton socket instance (for modules that need direct access) ───────────
let _globalSocket: Socket | null = null;

export function initSocket(url = '/', token?: string): Socket {
  if (_globalSocket?.connected) return _globalSocket;
  _globalSocket = io(url, {
    auth:       token ? { token } : undefined,
    transports: ['websocket', 'polling'],
  });
  return _globalSocket;
}

export function getSocket(): Socket | null {
  return _globalSocket;
}

export function disconnectSocket(): void {
  _globalSocket?.disconnect();
  _globalSocket = null;
}
