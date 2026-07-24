/**
 * gameStore — Zustand store cho Hub game state
 * Quản lý categories, active category, search query
 */
import { create } from 'zustand';

interface Category { id: number; name: string; slug: string; icon?: string; }

interface GameState {
  categories:      Category[];
  activeCategory:  string | null;
  searchQuery:     string;
  setCategories:   (c: Category[]) => void;
  setActiveCategory: (c: string | null) => void;
  setSearch:       (q: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  categories:      [],
  activeCategory:  null,
  searchQuery:     '',
  setCategories:   (categories) => set({ categories }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setSearch:       (searchQuery) => set({ searchQuery }),
}));
