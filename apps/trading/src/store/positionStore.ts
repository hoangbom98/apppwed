// trade/src/store/positionStore.ts
// Manages open positions & portfolio summary in real-time
import { create } from 'zustand';
import type { TradePosition, Portfolio } from '@/types';

// Re-export for consumers that import directly from this file
export type { TradePosition, Portfolio };

interface PositionStore {
  positions: TradePosition[];
  portfolio: Portfolio | null;

  setPositions:   (positions: TradePosition[]) => void;
  addPosition:    (position: TradePosition)    => void;
  removePosition: (id: string)                 => void;
  updatePosition: (id: string, update: Partial<TradePosition>) => void;
  /** Recalculate PnL for all positions matching a symbol when market price updates */
  updatePnl:      (symbol: string, currentPrice: number) => void;
  setPortfolio:   (portfolio: Portfolio) => void;
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
      positions: s.positions.map((p) => (p.id === id ? { ...p, ...update } : p)),
    })),

  updatePnl: (symbol, currentPrice) =>
    set((s) => ({
      positions: s.positions.map((p) => {
        const pSymbol = typeof p.symbol === 'string' ? p.symbol : p.symbol.code;
        if (pSymbol !== symbol) return p;
        const entryPrice = typeof p.entryPrice === 'string'
          ? parseFloat(p.entryPrice)
          : p.entryPrice;
        const diff       = p.side === 'long'
          ? currentPrice - entryPrice
          : entryPrice - currentPrice;
        const qty        = typeof p.quantity === 'string'
          ? parseFloat(p.quantity)
          : p.quantity;
        const pnl        = diff * qty;
        const pnlPercent = entryPrice > 0
          ? (diff / entryPrice) * 100 * (p.leverage ?? 1)
          : 0;
        return { ...p, currentPrice, pnl, pnlPercent };
      }),
    })),

  setPortfolio: (portfolio) => set({ portfolio }),
}));
