import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // Theme & Sidebar
  darkMode: typeof window !== 'undefined' ? localStorage.getItem('theme') === 'dark' : false,
  sidebarOpen: false,
  
  // Tabs & Modal Panels
  activeTab: 'home',
  isGiftPanelOpen: false,
  isFilterOpen: false,
  isCommentOpen: false,
  commentTargetId: null,

  toggleDarkMode: () => {
    const next = !useUIStore.getState().darkMode;
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next);
    }
    localStorage.setItem('theme', next ? 'dark' : 'light');
    set({ darkMode: next });
  },
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setActiveTab: (tab) => set({ activeTab: tab }),
  openGiftPanel: () => set({ isGiftPanelOpen: true }),
  closeGiftPanel: () => set({ isGiftPanelOpen: false }),
  openFilter: () => set({ isFilterOpen: true }),
  closeFilter: () => set({ isFilterOpen: false }),
  openComment: (id) => set({ isCommentOpen: true, commentTargetId: id }),
  closeComment: () => set({ isCommentOpen: false, commentTargetId: null }),
}));

// Apply theme on load
if (typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
}
