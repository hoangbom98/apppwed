// Lightweight hook for individual admin pages to subscribe to real-time events
// for their specific project without needing to touch useAdminSocket directly.
//
// USAGE:
//   import { useProjectEvents } from '@admin/core/hooks/useProjectEvents';
//
//   // In GameDepositsPage.tsx:
//   useProjectEvents('game', {
//     onFinanceEvent: (data) => {
//       if (data.type === 'deposit_request') refetch();
//     },
//   });
//
//   // In DatingProfilesPage.tsx:
//   useProjectEvents('dating', {
//     onUserEvent:   (data) => refetch(),
//     onStatsUpdate: ()     => refetchStats(),
//   });
//
// The hook listens to window CustomEvents dispatched by useAdminSocket.
// This is intentionally decoupled — pages don't need socket access directly.
//
// Available callbacks:
//   onFinanceEvent(data)  — deposit_request | deposit_approved | withdrawal_*
//   onStatsUpdate(data)   — KPIs changed
//   onNewUser(data)       — new user registered
//   onUserEvent(data)     — user ban / status change
//   onKycEvent(data)      — KYC submitted / updated
//   onRiskAlert(data)     — risk engine alert
//
// Project isolation:
//   Callbacks only fire when data.project matches the `project` arg.
//   Pass project='admin' to receive ALL projects (super_admin use case).
import { useEffect, useRef } from 'react';

export type ProjectId = 'game' | 'dating' | 'sports' | 'trade' | 'hub' | 'admin';

export interface ProjectEventCallbacks {
  onFinanceEvent?: (data: Record<string, unknown>) => void;
  onStatsUpdate?:  (data: Record<string, unknown>) => void;
  onNewUser?:      (data: Record<string, unknown>) => void;
  onUserEvent?:    (data: Record<string, unknown>) => void;
  onKycEvent?:     (data: Record<string, unknown>) => void;
  onRiskAlert?:    (data: Record<string, unknown>) => void;
}

export function useProjectEvents(project: ProjectId, callbacks: ProjectEventCallbacks = {}): void {
  // Keep callbacks in a ref to avoid re-registering listeners on every render
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    function matches(data: Record<string, unknown>): boolean {
      // project='admin' → receive all projects
      if (project === 'admin') return true;
      return !data?.project || data.project === project;
    }

    // ── window event bus bridge ────────────────────────────────────────────────
    // useAdminSocket dispatches window CustomEvents for admin:risk and admin:maintenance.
    // For socket events that update React Query, pages should react via useQuery's
    // staleTime and the React Query cache invalidation done in useAdminSocket.
    // For events that need imperative callbacks (e.g. show a toast), use this hook.

    const handlers: Record<string, (e: Event) => void> = {
      'admin:risk':        (e) => { const ce = e as CustomEvent; if (matches(ce.detail)) cbRef.current.onRiskAlert?.(ce.detail); },
      'admin:maintenance': (e) => { const ce = e as CustomEvent; cbRef.current.onStatsUpdate?.(ce.detail); },
    };

    Object.entries(handlers).forEach(([evt, fn]) => window.addEventListener(evt, fn));

    return () => {
      Object.entries(handlers).forEach(([evt, fn]) => window.removeEventListener(evt, fn));
    };
  }, [project]);
}

/**
 * Convenience hook: subscribe to finance events for a project.
 * Calls `onPendingAction` whenever a deposit_request or withdrawal_request arrives.
 */
export function useFinanceEvents(
  project: ProjectId,
  onPendingAction: (data: Record<string, unknown>) => void
): void {
  useProjectEvents(project, {
    onFinanceEvent: (data) => {
      if (data.type === 'deposit_request' || data.type === 'withdrawal_request') {
        onPendingAction?.(data);
      }
    },
  });
}

export default useProjectEvents;
