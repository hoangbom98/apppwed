// game/src/store/index.ts
// Unified store exports — English names preferred.
// All Zustand stores available from a single import.

// Auth store
export { useAuthStore }   from './authStore';

// Wallet store
export { useWalletStore } from './walletStore';

// UI / theme store
export { useUIStore }     from './uiStore';

// Game catalog store
export { useGameStore }   from './gameStore';

// Legacy Vietnamese store aliases — kept for backwards compatibility
export { useAuthStore   as useDangNhapStore }   from './authStore';
export { useWalletStore as useViTienStore }      from './walletStore';
export { useUIStore     as useGiaoDienStore }    from './uiStore';
export { useGameStore   as useGameDataStore }    from './gameStore';
