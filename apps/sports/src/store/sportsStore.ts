import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SportsState {
  favouriteTeams:   number[];
  favouriteLeagues: number[];
  unreadCount:      number;
  toggleFavTeam:    (id: number) => void;
  toggleFavLeague:  (id: number) => void;
  setFavourites:    (teams: number[], leagues: number[]) => void;
  setUnreadCount:   (n: number) => void;
  incrementUnread:  () => void;
  decrementUnread:  () => void;
}

export const useSportsStore = create<SportsState>()(
  persist(
    (set) => ({
      favouriteTeams:   [],
      favouriteLeagues: [],
      unreadCount:      0,

      toggleFavTeam: (id) =>
        set((s) => ({
          favouriteTeams: s.favouriteTeams.includes(id)
            ? s.favouriteTeams.filter((t) => t !== id)
            : [...s.favouriteTeams, id],
        })),

      toggleFavLeague: (id) =>
        set((s) => ({
          favouriteLeagues: s.favouriteLeagues.includes(id)
            ? s.favouriteLeagues.filter((l) => l !== id)
            : [...s.favouriteLeagues, id],
        })),

      setFavourites: (teams, leagues) => set({ favouriteTeams: teams, favouriteLeagues: leagues }),

      setUnreadCount:  (n) => set({ unreadCount: n }),
      incrementUnread: ()  => set((s) => ({ unreadCount: s.unreadCount + 1 })),
      decrementUnread: ()  => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
    }),
    {
      name:        'sports-prefs',
      storage:     createJSONStorage(() => localStorage),
      // Only persist favourites — unreadCount resets on each session
      partialize:  (s) => ({ favouriteTeams: s.favouriteTeams, favouriteLeagues: s.favouriteLeagues }),
    }
  )
);
