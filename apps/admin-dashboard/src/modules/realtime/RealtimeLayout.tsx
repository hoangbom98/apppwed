/**
 * RealtimeLayout.jsx  —  Route: /realtime
 *
 * Trang giám sát thời gian thực với:
 *   - Live Event Feed (WebSocket: admin:event, alert, transaction:new)
 *   - System Health: CPU/RAM/Uptime (poll 30s)
 *   - Online Users per project (poll 30s, SVG bars)
 *   - Recent 5 transactions realtime
 *
 * Hooks: useAdminSocket (đã có), useQuery
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Wifi, WifiOff, Users, Zap, Server, BarChart2 } from 'lucide-react';
import { useAdminSocket } from '../../core/hooks/useAdminSocket';
import api from '@admin/api/client';
import { fmtTime, fmtUptime, fmtVND, fmtBytes as fmtMB } from '@admin/modules/shared/utils/formatters';

const LEVEL_STYLE = {
  CRITICAL: { bg: 'bg-red-900/50 border-red-800',    dot: 'bg-red-400',    text: 'text-red-400',    icon: '!' },
  WARNING:  { bg: 'bg-yellow-900/40 border-yellow-800', dot: 'bg-yellow-400', text: 'text-yellow-400', icon: '!' },
  INFO:     { bg: 'bg-blue-900/30 border-blue-800',   dot: 'bg-blue-400',   text: 'text-blue-400',   icon: 'i' },
  DEPOSIT:  { bg: 'bg-green-900/30 border-green-800', dot: 'bg-green-400',  text: 'text-green-400',  icon: '+' },
  WITHDRAW: { bg: 'bg-orange-900/30 border-orange-800', dot: 'bg-orange-400', text: 'text-orange-400', icon: '-' },
  EVENT:    { bg: 'bg-gray-800/60 border-gray-700',   dot: 'bg-gray-400',   text: 'text-gray-400',   icon: '·' },
};

function getStyle(event) {
  if (event._type === 'alert')       return LEVEL_STYLE[event.level] ?? LEVEL_STYLE.INFO;
  if (event._type === 'transaction') return event.txType === 'deposit' ? LEVEL_STYLE.DEPOSIT : LEVEL_STYLE.WITHDRAW;
  return LEVEL_STYLE.EVENT;
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel 1: Live Event Feed
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FEED = 50;

function LiveFeed({ socket }) {
  const [events, setEvents] = useState([]);
  const [paused, setPaused]  = useState(false);
  const bufferRef = useRef([]);

  const addEvent = useCallback((event) => {
    if (paused) { bufferRef.current.push(event); return; }
    setEvents(prev => [event, ...prev].slice(0, MAX_FEED));
  }, [paused]);

  // Nhận events từ WebSocket
  useEffect(() => {
    if (!socket) return;

    const onAlert = (data) => addEvent({ ...data, _type: 'alert', _time: new Date() });
    const onAdminEvent = (data) => addEvent({ ...data, _type: 'admin_event', _time: new Date() });
    const onTransaction = (data) => addEvent({ ...data, _type: 'transaction', _time: new Date() });

    socket.on('alert',          onAlert);
    socket.on('admin:event',    onAdminEvent);
    socket.on('transaction:new', onTransaction);

    return () => {
      socket.off('alert',           onAlert);
      socket.off('admin:event',     onAdminEvent);
      socket.off('transaction:new', onTransaction);
    };
  }, [socket, addEvent]);

  // Flush buffer khi resume
  useEffect(() => {
    if (!paused && bufferRef.current.length > 0) {
      setEvents(prev => [...bufferRef.current.reverse(), ...prev].slice(0, MAX_FEED));
      bufferRef.current = [];
    }
  }, [paused]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
        <div className={`w-2 h-2 rounded-full ${socket ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
        <h3 className="text-sm font-semibold text-gray-200">Live Events Feed</h3>
        <span className="ml-1 text-xs text-gray-600">(tối đa {MAX_FEED} sự kiện)</span>
        <div className="ml-auto flex items-center gap-2">
          {socket
            ? <span className="text-xs text-green-400 flex items-center gap-1"><Wifi size={11} /> Đã kết nối</span>
            : <span className="text-xs text-gray-500 flex items-center gap-1"><WifiOff size={11} /> Chưa kết nối</span>
          }
          <button
            onClick={() => setPaused(p => !p)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${paused ? 'bg-yellow-900/40 text-yellow-400' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            onClick={() => setEvents([])}
            className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 text-gray-500 hover:text-red-400 transition-colors"
          >
            Xoá
          </button>
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-gray-600">
            <Activity size={28} className="mb-2 opacity-30" />
            <p className="text-sm">Chờ sự kiện realtime…</p>
            <p className="text-xs mt-1 opacity-60">WebSocket sẽ đẩy dữ liệu khi có hoạt động</p>
          </div>
        ) : (
          events.map((ev, i) => {
            const s = getStyle(ev);
            const label = ev.title ?? ev.type ?? ev.message ?? ev.action ?? 'Event';
            const detail = ev.message ?? ev.data?.username ?? ev.amount
              ? fmtVND(ev.amount) : null;

            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 px-3 py-2 rounded-xl border text-xs ${s.bg} ${i === 0 ? 'animate-[fadeIn_0.3s_ease-in]' : ''}`}
              >
                <span className="shrink-0 mt-0.5 text-sm">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${s.text} truncate`}>{label}</p>
                  {detail && <p className="text-gray-400 truncate">{detail}</p>}
                </div>
                <span className="text-gray-600 shrink-0 whitespace-nowrap">{fmtTime(ev._time)}</span>
              </div>
            );
          })
        )}
      </div>

      {paused && bufferRef.current.length > 0 && (
        <div className="px-4 py-2 bg-yellow-900/20 border-t border-yellow-900/40">
          <p className="text-xs text-yellow-400">
            ⏸ Đang tạm dừng — {bufferRef.current.length} sự kiện đang chờ
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel 2: System Health
// ─────────────────────────────────────────────────────────────────────────────

function SystemHealth() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn:  () => api.get('/admin/stats/system').then(r => r.data?.data ?? r.data),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  const rss        = data?.memory?.rss          ?? data?.rss ?? 0;
  const heapUsed   = data?.memory?.heapUsed     ?? data?.heapUsed ?? 0;
  const heapTotal  = data?.memory?.heapTotal    ?? data?.heapTotal ?? 1;
  const uptime     = data?.uptime               ?? data?.process?.uptime ?? 0;
  const nodeVer    = data?.nodeVersion           ?? data?.version ?? '—';
  const maintenance = data?.maintenance         ?? false;
  const heapPct    = Math.min(100, Math.round((heapUsed / heapTotal) * 100));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Server size={15} className="text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-200">System Health</h3>
        {!isLoading && dataUpdatedAt && (
          <span className="ml-auto text-xs text-gray-600">
            cập nhật {fmtTime(new Date(dataUpdatedAt))}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Heap usage */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Heap Memory</span>
              <span className="text-gray-300 font-mono">{fmtMB(heapUsed)} / {fmtMB(heapTotal)} ({heapPct}%)</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${heapPct > 80 ? 'bg-red-500' : heapPct > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${heapPct}%` }}
              />
            </div>
          </div>

          {/* RSS */}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">RSS (Total Memory)</span>
            <span className="text-gray-300 font-mono">{fmtMB(rss)}</span>
          </div>

          {/* Uptime */}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Uptime</span>
            <span className="text-green-400 font-mono">{fmtUptime(uptime)}</span>
          </div>

          {/* Node version */}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Node.js</span>
            <span className="text-gray-300 font-mono">{nodeVer}</span>
          </div>

          {/* Maintenance */}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Trạng thái</span>
            <span className={`font-semibold ${maintenance ? 'text-yellow-400' : 'text-green-400'}`}>
              {maintenance ? 'Bảo trì' : 'Hoạt động'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel 3: Online Users (SVG bars)
// ─────────────────────────────────────────────────────────────────────────────

const PROJECT_COLORS = {
  hub:     '#3b82f6',
  game:    '#f59e0b',
  trade:   '#10b981',
  dating:  '#ec4899',
  sports:  '#8b5cf6',
};

function OnlineUsers() {
  const { data, isLoading } = useQuery({
    queryKey: ['realtime-online'],
    queryFn:  () => api.get('/admin/monitor/online').then(r => r.data?.data ?? r.data),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  const byProject: Record<string, number> = data?.byProject ?? {};
  const total     = data?.total ?? 0;
  const entries   = Object.entries(byProject);
  const maxVal    = Math.max(...entries.map(([, v]) => v), 1);

  const BAR_H  = 60;
  const BAR_W  = 36;
  const GAP    = 12;
  const totalW = entries.length * (BAR_W + GAP);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Users size={15} className="text-green-400" />
        <h3 className="text-sm font-semibold text-gray-200">Online Users</h3>
        <span className="ml-auto text-xl font-black text-green-400">{total}</span>
      </div>

      {isLoading ? (
        <div className="h-20 bg-gray-800 rounded-lg animate-pulse" />
      ) : entries.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-4">Chưa có dữ liệu</p>
      ) : (
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${Math.max(totalW, 200)} ${BAR_H + 28}`} className="w-full" style={{ height: BAR_H + 28 }}>
            {entries.map(([proj, count], i) => {
              const x   = i * (BAR_W + GAP) + GAP / 2;
              const h   = Math.max(4, Math.round((count / maxVal) * BAR_H));
              const y   = BAR_H - h;
              const col = PROJECT_COLORS[proj] ?? '#6b7280';
              return (
                <g key={proj}>
                  <rect x={x} y={y} width={BAR_W} height={h} rx={4} fill={col} opacity={0.85} />
                  <text x={x + BAR_W / 2} y={BAR_H + 12} textAnchor="middle" fill="#9ca3af" fontSize="9">
                    {proj}
                  </text>
                  <text x={x + BAR_W / 2} y={y - 3} textAnchor="middle" fill={col} fontSize="10" fontWeight="bold">
                    {count}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel 4: Recent Transactions (realtime)
// ─────────────────────────────────────────────────────────────────────────────

function RecentTransactions({ socket }) {
  const [txList, setTxList] = useState([]);

  useEffect(() => {
    if (!socket) return;
    const handler = (tx) => {
      setTxList(prev => [{ ...tx, _time: new Date() }, ...prev].slice(0, 5));
    };
    socket.on('transaction:new', handler);
    return () => socket.off('transaction:new', handler);
  }, [socket]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap size={15} className="text-yellow-400" />
        <h3 className="text-sm font-semibold text-gray-200">Giao dịch gần đây</h3>
        <span className="ml-auto text-xs text-gray-600">realtime</span>
      </div>

      {txList.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-4">Chờ giao dịch mới…</p>
      ) : (
        <div className="space-y-2">
          {txList.map((tx, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={tx.type === 'deposit' ? 'text-green-400' : 'text-orange-400'}>
                {tx.type === 'deposit' ? '↓' : '↑'}
              </span>
              <span className="text-gray-400 truncate flex-1">{tx.username ?? tx.userId ?? '—'}</span>
              <span className={`font-semibold ${tx.type === 'deposit' ? 'text-green-400' : 'text-orange-400'}`}>
                {fmtVND(tx.amount)}
              </span>
              <span className="text-gray-600 whitespace-nowrap">{fmtTime(tx._time)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main layout
// ─────────────────────────────────────────────────────────────────────────────

export default function RealtimeLayout() {
  const socket = useAdminSocket();

  return (
    <div className="space-y-5 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart2 size={22} className="text-blue-400" />
            Giám sát Thời gian thực
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Live feed WebSocket, system health & online stats</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {socket
            ? (
              <span className="flex items-center gap-1.5 text-xs bg-green-900/30 border border-green-900/50 text-green-400 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                WebSocket đã kết nối
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs bg-gray-800 border border-gray-700 text-gray-500 px-3 py-1.5 rounded-full">
                <WifiOff size={11} />
                Chưa kết nối
              </span>
            )
          }
        </div>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ minHeight: '600px' }}>
        {/* Trái: Live Feed (chiếm 2/3) */}
        <div className="lg:col-span-2" style={{ minHeight: '500px' }}>
          <LiveFeed socket={socket} />
        </div>

        {/* Phải: panels */}
        <div className="space-y-4">
          <SystemHealth />
          <OnlineUsers />
          <RecentTransactions socket={socket} />
        </div>
      </div>
    </div>
  );
}
