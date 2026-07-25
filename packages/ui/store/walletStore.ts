// @ts-nocheck
import { create } from 'zustand';
import api from '../api/client';

const project = import.meta.env.VITE_PROJECT || 'hub';

interface WalletState {
  balance: number;
  currency: string;
  coins: number;
  diamonds: number;
  isLoading: boolean;
  fetchBalance: () => Promise<void>;
  setBalance: (balance: number) => void;
  setCoinsAndDiamonds: (coins: number, diamonds: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => void;
  updateBalance: (balance: number) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  currency: 'VND',
  coins: 0,
  diamonds: 0,
  isLoading: false,

  fetchBalance: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/${project}/wallet/balance`);
      const data = res.data.data || res.data;
      set({
        balance: Number(data.balance || 0),
        coins: Number(data.coins || 0),
        diamonds: Number(data.diamonds || 0),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setBalance: (balance) => set({ balance }),
  setCoinsAndDiamonds: (coins, diamonds) => set({ coins, diamonds }),
  addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),
  spendCoins: (amount) => set((s) => ({ coins: Math.max(0, s.coins - amount) })),
  updateBalance: (balance) => set({ balance: Number(balance) }),
}));
