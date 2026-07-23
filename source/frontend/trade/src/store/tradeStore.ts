import { create } from 'zustand';

interface Pair {
  id:           number;
  symbol:       string;
  baseAsset:    string;
  quoteAsset:   string;
  lastPrice:    number;
  priceChange:  number;
  volume24h:    number;
  high24h:      number;
  low24h:       number;
}

interface Order {
  id:          number;
  symbol:      string;
  side:        'buy' | 'sell';
  type:        string;
  price:       number;
  quantity:    number;
  filled:      number;
  status:      string;
  createdAt:   string;
}

interface Balance { asset: string; free: number; locked: number; }

interface TradeStore {
  pairs:        Pair[];
  selectedPair: Pair | null;
  orders:       Order[];
  balances:     Balance[];

  setPairs:        (pairs: Pair[]) => void;
  selectPair:      (pair: Pair) => void;
  updatePairPrice: (symbol: string, update: Partial<Omit<Pair, 'id' | 'symbol' | 'baseAsset' | 'quoteAsset'>>) => void;
  setOrders:       (orders: Order[]) => void;
  setBalances:     (balances: Balance[]) => void;
}

export const useTradeStore = create<TradeStore>()((set) => ({
  pairs:        [],
  selectedPair: null,
  orders:       [],
  balances:     [],

  setPairs: (pairs) => set({ pairs }),

  selectPair: (pair) => set({ selectedPair: pair }),

  /** Patch price fields on a single pair by symbol (for WebSocket updates) */
  updatePairPrice: (symbol, update) =>
    set(state => {
      const idx = state.pairs.findIndex(p => p.symbol === symbol);
      if (idx === -1) return {};
      const pairs = [...state.pairs];
      pairs[idx] = { ...pairs[idx], ...update };

      // Also update selectedPair if it matches
      const selectedPair =
        state.selectedPair?.symbol === symbol
          ? { ...state.selectedPair, ...update }
          : state.selectedPair;

      return { pairs, selectedPair };
    }),

  setOrders:   (orders)   => set({ orders }),
  setBalances: (balances) => set({ balances }),
}));
