/**
 * useCryptoWebSocket
 * ──────────────────────────────────────────────────────────────────
 * Subscribe real-time price updates từ Socket.io server.
 * Dùng shared getSocket() từ @ui và sync vào cryptoStore.
 */
import { useEffect, useRef } from 'react';
import { getSocket } from '@ui/hooks/useSocket';
import { useCryptoStore } from '@/store/cryptoStore';
import type { PriceUpdatePayload } from '@/types';

export function useCryptoWebSocket(symbols?: string[]): void {
  const { pairs, updatePairPrice } = useCryptoStore();

  const subRef    = useRef<string[]>([]);
  const activeRef = useRef<string[]>([]);

  subRef.current = symbols ?? pairs.map((p) => p.symbol);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const toSub = subRef.current.filter((s) => !activeRef.current.includes(s));
    if (toSub.length > 0) {
      socket.emit('trade:subscribe', { symbols: toSub });
      activeRef.current = [...activeRef.current, ...toSub];
    }

    const onPriceUpdate = (data: PriceUpdatePayload) => {
      updatePairPrice(data.symbol, data);
    };

    socket.on('trade:price_update', onPriceUpdate);

    return () => {
      socket.off('trade:price_update', onPriceUpdate);
      if (activeRef.current.length > 0) {
        socket.emit('trade:unsubscribe', { symbols: activeRef.current });
        activeRef.current = [];
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs.length]);
}
