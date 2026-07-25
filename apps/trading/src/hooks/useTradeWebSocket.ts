/**
 * useTradeWebSocket
 * ──────────────────────────────────────────────────────────────────
 * Subscribes to the shared Socket.io server for real-time trade data.
 * Uses the canonical useSocket from @ui (which is already authenticated).
 *
 * Events emitted to server:
 *   trade:subscribe   { symbols: string[] }  — subscribe to price updates
 *   trade:unsubscribe { symbols: string[] }  — unsubscribe
 *
 * Events received from server:
 *   trade:price_update   { symbol, lastPrice, priceChange, volume24h, high24h, low24h }
 *   trade:order_update   { order: TradeOrder }
 *   trade:balance_update { balances: AssetBalance[] }
 */
import { useEffect, useRef } from 'react';
import { getSocket } from '@ui/hooks/useSocket';
import { useTradeStore } from '@/store/tradeStore';
import type { PriceUpdatePayload, TradeOrder, AssetBalance } from '@/types';

/**
 * @param symbols  Array of symbols to subscribe, e.g. ['BTC/USDT','ETH/USDT'].
 *                 Pass nothing to auto-subscribe to all pairs currently in store.
 */
export function useTradeWebSocket(symbols?: string[]): void {
  const { pairs, updatePairPrice, updateOrder, setBalances } = useTradeStore();
  // Build the list of symbols to subscribe — stable reference via ref
  const subRef    = useRef<string[]>([]);
  const activeRef = useRef<string[]>([]);

  // Sync subscribed symbols into ref so the effect closure always sees current value
  subRef.current = symbols ?? pairs.map((p) => p.symbol);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const toSub = subRef.current.filter((s) => !activeRef.current.includes(s));
    if (toSub.length > 0) {
      socket.emit('trade:subscribe', { symbols: toSub });
      activeRef.current = [...activeRef.current, ...toSub];
    }

    // ── Real-time price updates ───────────────────────────────────────────────
    const onPriceUpdate = (data: PriceUpdatePayload) => {
      updatePairPrice(data.symbol, data);
    };

    // ── Order updates (filled / cancelled) ────────────────────────────────────
    const onOrderUpdate = (data: { order: TradeOrder }) => {
      updateOrder(data.order.id, data.order);
    };

    // ── Balance updates (after trade / deposit / withdrawal) ──────────────────
    const onBalanceUpdate = (data: { balances: AssetBalance[] }) => {
      if (Array.isArray(data.balances)) setBalances(data.balances);
    };

    socket.on('trade:price_update',   onPriceUpdate);
    socket.on('trade:order_update',   onOrderUpdate);
    socket.on('trade:balance_update', onBalanceUpdate);

    return () => {
      socket.off('trade:price_update',   onPriceUpdate);
      socket.off('trade:order_update',   onOrderUpdate);
      socket.off('trade:balance_update', onBalanceUpdate);

      if (activeRef.current.length > 0) {
        socket.emit('trade:unsubscribe', { symbols: activeRef.current });
        activeRef.current = [];
      }
    };
    // Re-run only when the pair count changes (new pairs loaded), not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs.length]);
}
