import { create } from 'zustand';

export interface LiveChatMessage {
  id: string;
  user_id: number;
  username: string;
  avatar: string | null;
  content: string;
  created_at: string;
}

export interface GiftAnimation {
  id: string;
  gift_name: string;
  gift_icon: string;
  sender: string;
  quantity: number;
}

interface LiveState {
  viewerCount: number;
  chatMessages: LiveChatMessage[];
  giftQueue: GiftAnimation[];
  pkScores: { left: number; right: number } | null;
  isStreaming: boolean;
  setViewerCount: (n: number) => void;
  addChatMessage: (msg: LiveChatMessage) => void;
  pushGift: (g: GiftAnimation) => void;
  shiftGift: () => void;
  setPkScores: (s: { left: number; right: number }) => void;
  setStreaming: (b: boolean) => void;
}

export const useLiveStore = create<LiveState>()((set) => ({
  viewerCount: 0,
  chatMessages: [],
  giftQueue: [],
  pkScores: null,
  isStreaming: false,

  setViewerCount: (n) => set({ viewerCount: n }),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages.slice(-100), msg] })),
  pushGift: (g) => set((s) => ({ giftQueue: [...s.giftQueue, g] })),
  shiftGift: () => set((s) => ({ giftQueue: s.giftQueue.slice(1) })),
  setPkScores: (scores) => set({ pkScores: scores }),
  setStreaming: (b) => set({ isStreaming: b }),
}));
