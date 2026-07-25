// @ts-nocheck
/**
 * useBalance.ts — Tầng 6: Real-time balance hook
 *
 * Fetches the user's balance from API on mount, then keeps it in sync
 * via WebSocket balance:update events.
 *
 * Works with both:
 *  - Simple user.balance (game, sports, dating, hub)
 *  - Multi-currency wallet (trade — returns VND wallet by default)
 *
 * USAGE
 * ─────
 *   import { useBalance } from '@lkvip/ui';
 *
 *   // Game lobby header
 *   const { balance, isLoading, refresh } = useBalance({
 *     basePath: '/api/game',
 *     currency: 'VND',
 *   });
 *   return <span>{formatVND(balance)}</span>;
 *
 *   // Force refresh after deposit
 *   await deposit();
 *   refresh();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { getSocket } from './useSocket';

export interface UseBalanceOptions {
  /** API prefix for this project, e.g. '/api/game' */
  basePath?: string;
  /** Currency for multi-wallet projects (default: 'VND') */
  currency?: string;
  /** Polling interval in ms as fallback when socket is unavailable (0 = disabled) */
  pollIntervalMs?: number;
}

export interface UseBalanceReturn {
  /** Current balance as a number */
  balance: number;
  /** Frozen / locked balance (if available) */
  frozen: number;
  /** True while initial fetch is in progress */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually re-fetch balance from server */
  refresh: () => Promise<void>;
}

export function useBalance(options: UseBalanceOptions = {}): UseBalanceReturn {
  const {
    basePath       = '/api/game',
    currency       = 'VND',
    pollIntervalMs = 0,
  } = options;

  const { token } = useAuthStore();

  const [balance,   setBalance]   = useState(0);
  const [frozen,    setFrozen]    = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch from API ───────────────────────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`${basePath}/wallet/balance`, {
        params: { currency },
      });
      setBalance(Number(data.data?.balance ?? data.balance ?? 0));
      setFrozen(Number(data.data?.frozen   ?? data.frozen   ?? 0));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [token, basePath, currency]);

  // ── Mount: fetch + subscribe to socket ───────────────────────────────────
  useEffect(() => {
    fetchBalance();

    // Subscribe to real-time balance updates via shared socket
    const socket = getSocket();
    if (socket) {
      const handler = (data: any) => {
        if (data?.balance !== undefined) setBalance(Number(data.balance));
        if (data?.frozen  !== undefined) setFrozen(Number(data.frozen));
      };
      socket.on('balance:update', handler);
      return () => { socket.off('balance:update', handler); };
    }

    // Fallback: polling if socket not available
    if (pollIntervalMs > 0) {
      pollRef.current = setInterval(fetchBalance, pollIntervalMs);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, basePath]);

  return { balance, frozen, isLoading, error, refresh: fetchBalance };
}
