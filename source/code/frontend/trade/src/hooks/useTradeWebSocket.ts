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
 *   trade:price_update  { symbol, lastPrice, priceChange, volume24h, high24h, low24h }
 *   trade:order_update  { order }
 *   trade:balance_update { balances }
 */
import { useEffect, useRef } from 'react';
import { getSocket } from '@ui/hooks/useSocket';
import { useTradeStore } from '@/store/tradeStore';

interface PriceUpdate {
  symbol:      string;
  lastPrice:   number;
  priceChange: number;
  volume24h:   number;
  high24h:     number;
  low24h:      number;
}

/**
 * @param symbols   Array of symbols to subscribe, e.g. ['BTC/USDT','ETH/USDT']
 *                  Pass empty array or nothing to subscribe to all pairs in the store.
 */
export function useTradeWebSocket(symbols?: string[]) {
  const { pairs, updatePairPrice, setOrders, setBalances } = useTradeStore();
  const subSymbols = symbols ?? pairs.map(p => p.symbol);
  const prevSymbols = useRef<string[]>([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // ── Subscribe ─────────────────────────────────────────────────────
    const toSub = subSymbols.filter(s => !prevSymbols.current.includes(s));
    if (toSub.length > 0) {
      socket.emit('trade:subscribe', { symbols: toSub });
      prevSymbols.current = [...prevSymbols.current, ...toSub];
    }

    // ── Real-time price updates ───────────────────────────────────────
    const onPriceUpdate = (data: PriceUpdate) => {
      updatePairPrice(data.symbol, {
        lastPrice:   data.lastPrice,
        priceChange: data.priceChange,
        volume24h:   data.volume24h,
        high24h:     data.high24h,
        low24h:      data.low24h,
      });
    };

    // ── Order updates (when a pending order is filled/cancelled) ──────
    const onOrderUpdate = (data: { order: any }) => {
      // Refetch orders is simpler; update in-store if we have the order
      useTradeStore.setState(state => {
        const idx = state.orders.findIndex(o => o.id === data.order.id);
        if (idx === -1) return {};
        const orders = [...state.orders];
        orders[idx] = { ...orders[idx], ...data.order };
        return { orders };
      });
    };

    // ── Balance updates (after deposit / withdrawal / trade) ──────────
    const onBalanceUpdate = (data: { balances: any[] }) => {
      if (data.balances) setBalances(data.balances);
    };

    socket.on('trade:price_update',   onPriceUpdate);
    socket.on('trade:order_update',   onOrderUpdate);
    socket.on('trade:balance_update', onBalanceUpdate);

    return () => {
      socket.off('trade:price_update',   onPriceUpdate);
      socket.off('trade:order_update',   onOrderUpdate);
      socket.off('trade:balance_update', onBalanceUpdate);

      // Unsubscribe symbols that are no longer needed
      if (prevSymbols.current.length > 0) {
        socket.emit('trade:unsubscribe', { symbols: prevSymbols.current });
        prevSymbols.current = [];
      }
    };
  }, [JSON.stringify(subSymbols)]); // eslint-disable-line
}
