// frontend/trade/src/store/positionStore.ts
// Manages open positions & portfolio summary in real-time
import { create } from 'zustand';

export interface Position {
  id:           string;
  symbol:       string;
  side:         'long' | 'short';
  entryPrice:   number;
  currentPrice: number;
  quantity:     number;
  pnl:          number;
  pnlPercent:   number;
  leverage:     number;
  liquidation:  number | null;
  openedAt:     string;
}

export interface Portfolio {
  totalBalance:       number;
  availableBalance:   number;
  unrealizedPnl:      number;
  totalPositionValue: number;
  winRate:            number;
}

interface PositionStore {
  positions:   Position[];
  portfolio:   Portfolio | null;

  setPositions:     (positions: Position[]) => void;
  addPosition:      (position: Position)    => void;
  removePosition:   (id: string)            => void;
  updatePosition:   (id: string, update: Partial<Position>) => void;
  updatePnl:        (symbol: string, currentPrice: number)  => void;
  setPortfolio:     (portfolio: Portfolio)  => void;
}

export const usePositionStore = create<PositionStore>()((set) => ({
  positions: [],
  portfolio: null,

  setPositions: (positions) => set({ positions }),

  addPosition: (position) =>
    set((s) => ({ positions: [...s.positions, position] })),

  removePosition: (id) =>
    set((s) => ({ positions: s.positions.filter((p) => p.id !== id) })),

  updatePosition: (id, update) =>
    set((s) => ({
      positions: s.positions.map((p) => p.id === id ? { ...p, ...update } : p),
    })),

  /** Recalculate PnL for all positions matching a symbol when market price updates */
  updatePnl: (symbol, currentPrice) =>
    set((s) => ({
      positions: s.positions.map((p) => {
        if (p.symbol !== symbol) return p;
        const diff      = p.side === 'long'
          ? currentPrice - p.entryPrice
          : p.entryPrice - currentPrice;
        const pnl       = diff * p.quantity;
        const pnlPercent = p.entryPrice > 0
          ? (diff / p.entryPrice) * 100 * (p.leverage ?? 1)
          : 0;
        return { ...p, currentPrice, pnl, pnlPercent };
      }),
    })),

  setPortfolio: (portfolio) => set({ portfolio }),
}));
