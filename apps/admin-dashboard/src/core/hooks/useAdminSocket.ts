// frontend/admin-dashboard/src/core/hooks/useAdminSocket.ts
// Admin dashboard real-time Socket.IO hook — PROJECT-AWARE.
//
// Architecture:
//   On connect  → emits `admin:join_project` with the project derived from
//                 current URL path.
//   super_admin → joins admin:all + all project rooms (handled by backend).
//   admin       → joins only project:{currentProject} room.
//
// Room membership determines which admin:* events are received:
//   admin:finance_event  — new deposit / withdrawal pending approval
//   admin:stats_update   — dashboard KPIs changed
//   admin:new_user       — new user registered in this project
//   admin:user_event     — user ban / status change
//   admin:kyc_event      — new KYC submission (trade, hub)
//   admin:risk_alert     — risk engine alert
//   system:maintenance   — platform-wide maintenance broadcast
//
// React Query integration:
//   Every event invalidates only the cache keys belonging to the
//   affected project — not all projects at once.
import { useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@admin/store/adminStore';

const SOCKET_URL =
  (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace('/api', '');

// ── Detect current project from URL path ───────────────────────────────────────
// /game/rounds  → 'game'
// /dating/users → 'dating'
// (root, /mine) → 'admin'
const PROJECT_PREFIXES = ['game', 'dating', 'sports', 'trade', 'hub'] as const;
type ProjectPrefix = typeof PROJECT_PREFIXES[number];

function detectProject(): ProjectPrefix | 'admin' {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return PROJECT_PREFIXES.includes(parts[0] as ProjectPrefix)
    ? (parts[0] as ProjectPrefix)
    : 'admin';
}

// ── Per-project React Query key invalidation map ───────────────────────────────
const PROJECT_QUERY_KEYS: Record<string, string[]> = {
  game:   ['game-admin-deposits', 'game-admin-withdrawals', 'game-rounds', 'game-users'],
  dating: ['dating-profiles', 'dating-matches', 'dating-users'],
  sports: ['sports-bets', 'sports-users'],
  trade:  ['trade-orders', 'trade-kyc', 'trade-wallets', 'trade-users'],
  hub:    ['hub-users'],
};

function invalidateProject(qc: QueryClient, project: string): void {
  const keys = PROJECT_QUERY_KEYS[project] ?? [];
  keys.forEach(key => qc.invalidateQueries({ queryKey: [key] }));
  // Always refresh the dashboard stats
  qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
  qc.invalidateQueries({ queryKey: ['admin-finance-stats'] });
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useAdminSocket(): MutableRefObject<Socket | null> {
  const { token }    = useAuthStore();
  const isAuthenticated = !!token;
  const qc              = useQueryClient();
  const socketRef       = useRef<Socket | null>(null);

  // Re-join the correct project room whenever the URL changes.
  const joinProjectRoom = useCallback((socket: Socket) => {
    const project = detectProject();
    socket.emit('admin:join_project', { project });
    if (import.meta.env.DEV) {
      console.warn(`[Admin Socket] joined project room: ${project}`);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io(SOCKET_URL, {
      auth:                 { token },
      transports:           ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay:    3000,
    });

    socketRef.current = socket;

    // ── Connection ───────────────────────────────────────────────────────────
    socket.on('connect', () => {
      joinProjectRoom(socket);
      if (import.meta.env.DEV) console.warn('[Admin Socket] connected:', socket.id);
    });

    // ── Finance events (deposit / withdrawal) ────────────────────────────────
    socket.on('admin:finance_event', (data: Record<string, unknown>) => {
      const project = data?.project as string | undefined;
      if (project) {
        invalidateProject(qc, project);
        if (typeof data.type === 'string' && data.type.includes('deposit'))    qc.invalidateQueries({ queryKey: [`${project}-admin-deposits`] });
        if (typeof data.type === 'string' && data.type.includes('withdrawal')) qc.invalidateQueries({ queryKey: [`${project}-admin-withdrawals`] });
      } else {
        invalidateProject(qc, detectProject());
      }
      if ((data.type === 'deposit_request' || data.type === 'withdrawal_request') &&
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted') {
        new Notification('LKVIP Admin', {
          body: `[${String(data.project ?? '').toUpperCase()}] ${
            data.type === 'deposit_request' ? 'Yêu cầu nạp tiền mới' : 'Yêu cầu rút tiền mới'
          } — ${Number(data.amount ?? 0).toLocaleString('vi')} ₫`,
          tag: `lkvip-finance-${data.project}`,
        });
      }
    });

    // ── Stats update ─────────────────────────────────────────────────────────
    socket.on('admin:stats_update', (data: Record<string, unknown>) => {
      const project = (data?.project as string) || detectProject();
      invalidateProject(qc, project);
    });

    // ── New user registered ───────────────────────────────────────────────────
    socket.on('admin:new_user', (data: Record<string, unknown>) => {
      const project = (data?.project as string) || detectProject();
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      qc.invalidateQueries({ queryKey: [`${project}-users`] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    });

    // ── User status / ban event ───────────────────────────────────────────────
    socket.on('admin:user_event', (data: Record<string, unknown>) => {
      const project = (data?.project as string) || detectProject();
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      qc.invalidateQueries({ queryKey: [`${project}-users`] });
    });

    // ── KYC event ────────────────────────────────────────────────────────────
    socket.on('admin:kyc_event', (data: Record<string, unknown>) => {
      const project = (data?.project as string) || 'trade';
      qc.invalidateQueries({ queryKey: [`${project}-kyc`] });
    });

    // ── Risk alert ────────────────────────────────────────────────────────────
    socket.on('admin:risk_alert', (data: Record<string, unknown>) => {
      window.dispatchEvent(new CustomEvent('admin:risk', { detail: data }));
      qc.invalidateQueries({ queryKey: ['admin-risk'] });
    });

    // ── System maintenance ────────────────────────────────────────────────────
    socket.on('system:maintenance', (data: Record<string, unknown>) => {
      window.dispatchEvent(new CustomEvent('admin:maintenance', { detail: data }));
    });

    // ── Cron job status update ────────────────────────────────────────────────
    // Emitted by cronController when a job is toggled or run-now is triggered.
    // Payload: { id, name, status, lastRunAt, durationMs? }
    socket.on('admin:cron_status', (data: Record<string, unknown>) => {
      qc.invalidateQueries({ queryKey: ['cron-jobs'] });
      window.dispatchEvent(new CustomEvent('admin:cron_status', { detail: data }));
      if (import.meta.env.DEV) console.warn('[Admin Socket] cron_status:', data);
    });

    // ── Notification sent via queue ───────────────────────────────────────────
    // Emitted by notificationQueue processor after a notification is dispatched.
    // Payload: { templateType, channel, userId?, project?, sentAt }
    socket.on('admin:notif_sent', (data: Record<string, unknown>) => {
      qc.invalidateQueries({ queryKey: ['notif-logs'] });
      window.dispatchEvent(new CustomEvent('admin:notif_sent', { detail: data }));
    });

    // ── Online admin count broadcast ──────────────────────────────────────────
    // Emitted by socket handler on connect/disconnect.
    // Payload: { count: number }
    socket.on('admin:online_count', (data: { count: number }) => {
      window.dispatchEvent(new CustomEvent('admin:online_count', { detail: data }));
    });

    // ── Errors / reconnect ────────────────────────────────────────────────────
    socket.on('connect_error', (err: Error) => {
      if (import.meta.env.DEV) console.warn('[Admin Socket] connection error:', err.message);
      window.dispatchEvent(new CustomEvent('admin:socket_error', { detail: { message: err.message } }));
    });

    socket.on('reconnect_failed', () => {
      console.error('[Admin Socket] Failed to reconnect — please refresh the page');
      window.dispatchEvent(new CustomEvent('admin:socket_reconnect_failed'));
    });

    socket.on('disconnect', (reason: string) => {
      if (import.meta.env.DEV) console.warn('[Admin Socket] disconnected:', reason);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, qc, joinProjectRoom]);

  // Re-join room when URL changes (user navigates between modules).
  useEffect(() => {
    if (!socketRef.current) return;
    const rejoin = () => {
      if (socketRef.current?.connected) joinProjectRoom(socketRef.current);
    };
    window.addEventListener('popstate',   rejoin);
    window.addEventListener('hashchange', rejoin);
    return () => {
      window.removeEventListener('popstate',   rejoin);
      window.removeEventListener('hashchange', rejoin);
    };
  }, [joinProjectRoom]);

  return socketRef;
}

export default useAdminSocket;
