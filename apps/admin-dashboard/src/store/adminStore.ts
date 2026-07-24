// frontend/admin-dashboard/src/store/adminStore.ts
// Admin-only Zustand store. NEVER shared with user-facing sub-projects.
//
// Architecture:
//   useAuthStore   — authentication state (token, user). Persisted to localStorage.
//   useGameStore   — Game module: pagination, filters, selectedId. Reset on module leave.
//   useDatingStore — Dating module: same pattern.
//   useSportsStore — Sports module.
//   useTradeStore  — Trade module.
//   useHubStore    — Hub module.
//
// Convention:
//   - Every store exposes a `reset()` action.
//   - React Query owns server-side data; these stores own UI state (filters, pagination, selection).
//   - Cache keys must be prefixed with the project id: ['game', 'rounds', page, filters]
//     to prevent cross-module data bleed when switching projects.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@admin/api/client';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: number;
  email: string;
  username?: string;
  fullName?: string;
  role: string;
  modules?: string[];
  status?: string;
  lastLogin?: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ user: AdminUser; token: string }>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// ── Auth Store ─────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:      null,
      token:     null,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/admin/auth/login', credentials);
          // Backend returns: { success: true, data: { admin: {...}, token, refreshToken } }
          const payload = res.data?.data ?? res.data;
          const { token, admin } = payload;
          // Normalise: store uses 'user' internally, backend calls it 'admin'
          const user: AdminUser = admin;
          localStorage.setItem('admin_token', token);
          set({ user, token, isLoading: false });
          return { user, token };
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('admin_token');
        set({ user: null, token: null });
      },

      isAuthenticated: () => !!(get().token),
    }),
    {
      name:       'admin-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

// ── Module Store Factory ───────────────────────────────────────────────────────
// Creates a lightweight UI-state store for a sub-project module.
// Server data lives in React Query; this store owns: page, filters, selectedId.
interface ModuleState {
  page:       number;
  limit:      number;
  filters:    Record<string, unknown>;
  selectedId: number | null;
  search:     string;
  setPage:    (page: number) => void;
  setLimit:   (limit: number) => void;
  setFilters: (filters: Record<string, unknown>) => void;
  setSearch:  (search: string) => void;
  select:     (id: number | null) => void;
  reset:      () => void;
}

function createModuleStore(_moduleName: string) {
  return create<ModuleState>((set) => ({
    page:       1,
    limit:      15,
    filters:    {},
    selectedId: null,
    search:     '',

    setPage:    (page)    => set({ page }),
    setLimit:   (limit)   => set({ limit }),
    setFilters: (filters) => set({ filters, page: 1 }), // reset page on filter change
    setSearch:  (search)  => set({ search, page: 1 }),
    select:     (id)      => set({ selectedId: id }),

    /**
     * Full reset — call this when navigating away from the module or on logout.
     * This prevents stale filter/page state from surfacing when the user returns.
     */
    reset: () => set({
      page: 1, limit: 15, filters: {}, selectedId: null, search: '',
    }),
  }));
}

// ── Per-Module Stores ──────────────────────────────────────────────────────────
export const useGameStore   = createModuleStore('game');
export const useDatingStore = createModuleStore('dating');
export const useSportsStore = createModuleStore('sports');
export const useTradeStore  = createModuleStore('trade');
export const useHubStore    = createModuleStore('hub');

// ── Module Store Map (for programmatic reset by project id) ────────────────────
type ProjectId = 'game' | 'dating' | 'sports' | 'trade' | 'hub';

const MODULE_STORE_MAP: Record<ProjectId, ReturnType<typeof createModuleStore>> = {
  game:   useGameStore,
  dating: useDatingStore,
  sports: useSportsStore,
  trade:  useTradeStore,
  hub:    useHubStore,
};

/**
 * Resets the UI state for a specific module.
 * Call this when the user switches away from a module to prevent stale state.
 */
export function resetModuleStore(projectId: ProjectId): void {
  MODULE_STORE_MAP[projectId]?.getState().reset();
}

/**
 * Resets ALL module stores at once.
 * Call this on logout or complete project context change.
 */
export function resetAllModuleStores(): void {
  Object.values(MODULE_STORE_MAP).forEach(store => store.getState().reset());
}
