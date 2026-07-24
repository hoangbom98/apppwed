import { create } from 'zustand';

export interface SwipeProfile {
  id: number;
  full_name: string;
  avatar: string | null;
  age: number;
  city: string;
  bio: string | null;
  distance: number;
  is_online: boolean;
  is_verified: boolean;
  vip_level: number;
  photos: string[];
  tags: string[];
}

export interface MatchItem {
  id: number;
  user: SwipeProfile;
  matched_at: string;
  last_message?: string;
  unread: number;
}

interface MatchState {
  deck: SwipeProfile[];
  matches: MatchItem[];
  newMatch: SwipeProfile | null;
  setDeck: (profiles: SwipeProfile[]) => void;
  removeTop: () => void;
  setMatches: (m: MatchItem[]) => void;
  setNewMatch: (p: SwipeProfile | null) => void;
}

export const useMatchStore = create<MatchState>()((set) => ({
  deck: [],
  matches: [],
  newMatch: null,

  setDeck: (profiles) => set({ deck: profiles }),
  removeTop: () => set((s) => ({ deck: s.deck.slice(1) })),
  setMatches: (m) => set({ matches: m }),
  setNewMatch: (p) => set({ newMatch: p }),
}));
