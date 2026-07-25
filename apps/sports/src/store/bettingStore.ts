// frontend/sports/src/store/bettingStore.ts
// Manages sports betting slip, active bets, and wallet state
import { create } from 'zustand';

export interface BetSelection {
  matchId:    number;
  matchLabel: string;  // e.g. "Man Utd vs Arsenal"
  market:     string;  // e.g. "1X2", "BTTS", "O/U 2.5"
  selection:  string;  // e.g. "Home", "Yes", "Over"
  odds:       number;
  stake?:     number;
}

export interface PlacedBet {
  id:        string;
  selections: BetSelection[];
  totalStake: number;
  potentialWin: number;
  status:    'pending' | 'won' | 'lost' | 'void' | 'settled';
  placedAt:  string;
}

interface BettingStore {
  // Bet slip
  slip:          BetSelection[];
  totalStake:    number;
  potentialWin:  number;

  // History
  placedBets:    PlacedBet[];
  walletBalance: number;

  // Actions
  addToSlip:      (selection: BetSelection)        => void;
  removeFromSlip: (matchId: number, market: string) => void;
  setStake:       (matchId: number, market: string, stake: number) => void;
  clearSlip:      ()                               => void;

  setPlacedBets:    (bets: PlacedBet[])  => void;
  addPlacedBet:     (bet: PlacedBet)     => void;
  updateBetStatus:  (id: string, status: PlacedBet['status']) => void;
  setWalletBalance: (balance: number)    => void;
}

export const useBettingStore = create<BettingStore>()((set, _get) => ({
  slip:          [],
  totalStake:    0,
  potentialWin:  0,
  placedBets:    [],
  walletBalance: 0,

  addToSlip: (selection) => {
    set((s) => {
      const exists = s.slip.some(
        (x) => x.matchId === selection.matchId && x.market === selection.market,
      );
      if (exists) return s;
      const slip = [...s.slip, { ...selection, stake: selection.stake ?? 0 }];
      return { slip, ..._calcTotals(slip) };
    });
  },

  removeFromSlip: (matchId, market) => {
    set((s) => {
      const slip = s.slip.filter((x) => !(x.matchId === matchId && x.market === market));
      return { slip, ..._calcTotals(slip) };
    });
  },

  setStake: (matchId, market, stake) => {
    set((s) => {
      const slip = s.slip.map((x) =>
        x.matchId === matchId && x.market === market ? { ...x, stake } : x,
      );
      return { slip, ..._calcTotals(slip) };
    });
  },

  clearSlip: () => set({ slip: [], totalStake: 0, potentialWin: 0 }),

  setPlacedBets:   (bets)           => set({ placedBets: bets }),
  addPlacedBet:    (bet)            => set((s) => ({ placedBets: [bet, ...s.placedBets] })),
  updateBetStatus: (id, status)     => set((s) => ({
    placedBets: s.placedBets.map((b) => b.id === id ? { ...b, status } : b),
  })),
  setWalletBalance: (walletBalance) => set({ walletBalance }),
}));

/** Internal helper: sum stakes and compute parlay potential win */
function _calcTotals(slip: BetSelection[]) {
  const totalStake   = slip.reduce((acc, s) => acc + (s.stake ?? 0), 0);
  const combinedOdds = slip.reduce((acc, s) => acc * s.odds, 1);
  const potentialWin = totalStake * combinedOdds;
  return { totalStake, potentialWin };
}
