// trade/src/store/cryptoStore.ts
// Store state cho Crypto Tracker: pairs cache + selected pair + WebSocket updates.
import { create } from 'zustand';
import type { TradePair, PriceUpdatePayload } from '@/types';

interface CryptoStore {
  pairs:        TradePair[];
  selectedPair: TradePair | null;

  setPairs:        (pairs: TradePair[]) => void;
  selectPair:      (pair: TradePair | null) => void;
  updatePairPrice: (symbol: string, update: PriceUpdatePayload) => void;
}

export const useCryptoStore = create<CryptoStore>()((set) => ({
  pairs:        [],
  selectedPair: null,

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
}));
