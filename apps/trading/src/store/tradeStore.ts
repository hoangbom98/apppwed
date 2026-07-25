// trade/src/store/tradeStore.ts
import { create } from 'zustand';
import type { TradePair, TradeOrder, AssetBalance, PriceUpdatePayload } from '@/types';

interface TradeStore {
  pairs:        TradePair[];
  selectedPair: TradePair | null;
  orders:       TradeOrder[];
  balances:     AssetBalance[];

  setPairs:        (pairs: TradePair[]) => void;
  selectPair:      (pair: TradePair)   => void;
  /**
   * Patch price fields on a single pair by symbol.
   * Called from useTradeWebSocket on every `trade:price_update` event.
   */
  updatePairPrice: (symbol: string, update: PriceUpdatePayload) => void;
  setOrders:       (orders: TradeOrder[]) => void;
  updateOrder:     (id: TradeOrder['id'], patch: Partial<TradeOrder>) => void;
  setBalances:     (balances: AssetBalance[]) => void;
}

export const useTradeStore = create<TradeStore>()((set) => ({
  pairs:        [],
  selectedPair: null,
  orders:       [],
  balances:     [],

  setPairs: (pairs) => set({ pairs }),

  selectPair: (pair) => set({ selectedPair: pair }),

  updatePairPrice: (symbol, update) =>
    set((state) => {
      const idx = state.pairs.findIndex((p) => p.symbol === symbol);
      if (idx === -1) return {};
      const pairs = [...state.pairs];
      pairs[idx] = { ...pairs[idx], ...update };
      const selectedPair =
        state.selectedPair?.symbol === symbol
          ? { ...state.selectedPair, ...update }
          : state.selectedPair;
      return { pairs, selectedPair };
    }),

  setOrders: (orders) => set({ orders }),

  updateOrder: (id, patch) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, ...patch } : o
      ),
    })),

  setBalances: (balances) => set({ balances }),
}));
