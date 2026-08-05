import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

// ── API helpers (admin endpoints) ─────────────────────────────────────────────
const adminApi = {
  // Stats
  getStats: () =>
    Promise.all([
      api.get('/sports/admin/matches',  { params: { limit: 1 } }),
      api.get('/sports/admin/leagues',  { params: { limit: 1 } }),
      api.get('/sports/admin/teams',    { params: { limit: 1 } }),
      api.get('/sports/admin/bets',     { params: { limit: 1 } }),
      api.get('/sports/admin/users',    { params: { limit: 1 } }),
    ]).then(([m, l, t, b, u]) => ({
      matches: m.data.total ?? m.data.data?.length ?? 0,
      leagues: l.data.total ?? l.data.data?.length ?? 0,
      teams:   t.data.total ?? t.data.data?.length ?? 0,
      bets:    b.data.total ?? b.data.data?.length ?? 0,
      users:   u.data.total ?? u.data.data?.length ?? 0,
    })),

  // Leagues
  getLeagues:   (p?: object) => api.get('/sports/admin/leagues',  { params: p }).then(r => r.data),
  updateLeague: (id: string, data: object) => api.put(`/sports/admin/leagues/${id}`, data).then(r => r.data),
  deleteLeague: (id: string) => api.delete(`/sports/admin/leagues/${id}`).then(r => r.data),

  // Matches
  getMatches:   (p?: object) => api.get('/sports/admin/matches',  { params: p }).then(r => r.data),
  updateMatch:  (id: string, data: object) => api.put(`/sports/admin/matches/${id}`, data).then(r => r.data),
  createMatch:  (data: object) => api.post('/sports/admin/matches', data).then(r => r.data),

  // Bets
  getBets:      (p?: object) => api.get('/sports/admin/bets',     { params: p }).then(r => r.data),
  updateBet:    (id: string, data: object) => api.put(`/sports/admin/bets/${id}`, data).then(r => r.data),

  // Users
  getUsers:     (p?: object) => api.get('/sports/admin/users',    { params: p }).then(r => r.data),
  updateUser:   (id: string, data: object) => api.put(`/sports/admin/users/${id}`, data).then(r => r.data),
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'matches' | 'leagues' | 'bets' | 'users';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => n?.toLocaleString('vi-VN');
const fmtDate = (s: string) =>
  s ? new Date(s).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const statusBadge: Record<string, string> = {
  scheduled: 'bg-blue-900 text-blue-300',
  live:       'bg-red-900 text-red-300 animate-pulse',
  halftime:   'bg-yellow-900 text-yellow-300',
  finished:   'bg-gray-700 text-gray-400',
  cancelled:  'bg-red-900 text-red-400',
  postponed:  'bg-orange-900 text-orange-400',
  pending:    'bg-yellow-900 text-yellow-300',
  won:        'bg-green-900 text-green-300',
  lost:       'bg-red-900 text-red-400',
  void:       'bg-gray-700 text-gray-400',
  active:     'bg-green-900 text-green-300',
  suspended:  'bg-orange-900 text-orange-400',
  banned:     'bg-red-900 text-red-400',
  open:       'bg-blue-900 text-blue-300',
  closed:     'bg-gray-700 text-gray-400',
};
const badge = (s: string) =>
  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${statusBadge[s] || 'bg-gray-700 text-gray-400'}`}>{s}</span>;

// ── Sub-components ────────────────────────────────────────────────────────────

/** Stat card tile */
function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

/** Inline edit row for match status / score */
function MatchRow({ match, onUpdate }: { match: any; onUpdate: (id: string, d: object) => void }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus]   = useState(match.status);
  const [hs, setHs]           = useState<string>(match.homeScore ?? '');
  const [as_, setAs]          = useState<string>(match.awayScore ?? '');

  const save = () => {
    onUpdate(match.id, {
      status,
      homeScore: hs !== '' ? Number(hs) : null,
      awayScore: as_ !== '' ? Number(as_) : null,
    });
    setEditing(false);
  };

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40">
      <td className="px-3 py-2 text-xs text-gray-300 max-w-[120px] truncate">
        {match.homeTeam?.name ?? '—'} <span className="text-gray-500">vs</span> {match.awayTeam?.name ?? '—'}
      </td>
      <td className="px-3 py-2 text-xs text-gray-400 hidden sm:table-cell">{match.league?.name ?? '—'}</td>
      <td className="px-3 py-2 text-xs text-gray-400 hidden md:table-cell">{fmtDate(match.startTime)}</td>
      <td className="px-3 py-2">{badge(match.status)}</td>
      <td className="px-3 py-2 text-xs text-center font-mono">
        {match.homeScore ?? '—'}&nbsp;:&nbsp;{match.awayScore ?? '—'}
      </td>
      <td className="px-3 py-2">
        {editing ? (
          <div className="flex flex-col gap-1">
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="bg-gray-700 text-xs text-white rounded px-1 py-0.5">
              {['scheduled','live','halftime','finished','cancelled','postponed'].map(s =>
                <option key={s} value={s}>{s}</option>
              )}
            </select>
            <div className="flex gap-1 items-center">
              <input type="number" value={hs} onChange={e => setHs(e.target.value)} placeholder="H"
                className="w-10 bg-gray-700 text-xs text-white rounded px-1 py-0.5 text-center" />
              <span className="text-gray-500 text-xs">:</span>
              <input type="number" value={as_} onChange={e => setAs(e.target.value)} placeholder="A"
                className="w-10 bg-gray-700 text-xs text-white rounded px-1 py-0.5 text-center" />
            </div>
            <div className="flex gap-1">
              <button onClick={save} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded px-2 py-0.5">Lưu</button>
              <button onClick={() => setEditing(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded px-2 py-0.5">Hủy</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="text-xs text-blue-400 hover:text-blue-300">Sửa</button>
        )}
      </td>
    </tr>
  );
}

/** Inline bet settle row */
function BetRow({ bet, onUpdate }: { bet: any; onUpdate: (id: string, d: object) => void }) {
  const [settling, setSettling] = useState(false);
  const [status, setStatus]     = useState(bet.status);

  const settle = () => {
    onUpdate(bet.id, { status });
    setSettling(false);
  };

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40">
      <td className="px-3 py-2 text-xs text-gray-400 font-mono hidden lg:table-cell">{bet.id.slice(-8)}</td>
      <td className="px-3 py-2 text-xs text-gray-300">{bet.user?.username ?? '—'}</td>
      <td className="px-3 py-2 text-xs font-mono text-white">{fmt(Number(bet.stake))}₫</td>
      <td className="px-3 py-2 text-xs font-mono text-green-400">{fmt(Number(bet.potentialWin))}₫</td>
      <td className="px-3 py-2">{badge(bet.status)}</td>
      <td className="px-3 py-2 text-xs text-gray-400 hidden md:table-cell">{fmtDate(bet.createdAt)}</td>
      <td className="px-3 py-2">
        {settling ? (
          <div className="flex gap-1 items-center">
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="bg-gray-700 text-xs text-white rounded px-1 py-0.5">
              {['pending','won','lost','void'].map(s =>
                <option key={s} value={s}>{s}</option>
              )}
            </select>
            <button onClick={settle} className="bg-green-600 text-white text-xs rounded px-2 py-0.5">✓</button>
            <button onClick={() => setSettling(false)} className="bg-gray-600 text-white text-xs rounded px-1 py-0.5">✕</button>
          </div>
        ) : bet.status === 'pending' ? (
          <button onClick={() => setSettling(true)}
            className="text-xs text-yellow-400 hover:text-yellow-300">Settle</button>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        )}
      </td>
    </tr>
  );
}

/** League row with inline status toggle */
function LeagueRow({ league, onUpdate, onDelete }: { league: any; onUpdate: (id: string, d: object) => void; onDelete: (id: string) => void }) {
  const toggle = () =>
    onUpdate(league.id, { status: league.status === 'active' ? 'inactive' : 'active' });

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40">
      <td className="px-3 py-2">
        {league.logo && <img src={league.logo} alt="" className="w-6 h-6 object-contain inline-block mr-2" />}
        <span className="text-sm text-white">{league.name}</span>
      </td>
      <td className="px-3 py-2 text-xs text-gray-400 hidden sm:table-cell">{league.country ?? '—'}</td>
      <td className="px-3 py-2 text-xs text-gray-400 hidden md:table-cell">{league.type}</td>
      <td className="px-3 py-2">{badge(league.status)}</td>
      <td className="px-3 py-2 flex gap-2">
        <button onClick={toggle}
          className="text-xs text-blue-400 hover:text-blue-300">
          {league.status === 'active' ? 'Vô hiệu' : 'Kích hoạt'}
        </button>
        <button onClick={() => {
          if (window.confirm(`Xóa ${league.name}?`)) onDelete(league.id);
        }} className="text-xs text-red-400 hover:text-red-300">Xóa</button>
      </td>
    </tr>
  );
}

/** User row with ban/unban */
function UserRow({ user, onUpdate }: { user: any; onUpdate: (id: string, d: object) => void }) {
  const toggle = () =>
    onUpdate(user.id, { status: user.status === 'active' ? 'suspended' : 'active' });

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40">
      <td className="px-3 py-2 text-xs text-gray-300">{user.username ?? '—'}</td>
      <td className="px-3 py-2 text-xs text-gray-400 hidden sm:table-cell">{user.email}</td>
      <td className="px-3 py-2 text-xs text-gray-400">{user.role}</td>
      <td className="px-3 py-2">{badge(user.status)}</td>
      <td className="px-3 py-2 text-xs text-gray-500 hidden md:table-cell">{fmtDate(user.createdAt)}</td>
      <td className="px-3 py-2">
        {user.role !== 'admin' && (
          <button onClick={toggle}
            className={`text-xs ${user.status === 'active' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}>
            {user.status === 'active' ? 'Khoá' : 'Mở'}
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin:stats'],
    queryFn:  adminApi.getStats,
    staleTime: 30_000,
  });

  const { data: liveData } = useQuery({
    queryKey: ['admin:matches:live'],
    queryFn:  () => adminApi.getMatches({ status: 'live', limit: 5 }),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  const { data: pendingBets } = useQuery({
    queryKey: ['admin:bets:pending'],
    queryFn:  () => adminApi.getBets({ status: 'pending', limit: 5 }),
    staleTime: 10_000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Trận đấu" value={fmt(stats?.matches ?? 0)} icon="" />
        <StatCard label="Giải đấu" value={fmt(stats?.leagues ?? 0)} icon="" />
        <StatCard label="Đội bóng"  value={fmt(stats?.teams   ?? 0)} icon="" />
        <StatCard label="Lượt cược" value={fmt(stats?.bets    ?? 0)} icon="" />
        <StatCard label="Người dùng" value={fmt(stats?.users  ?? 0)} icon="" />
      </div>

      {/* Live matches */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Đang diễn ra
        </h3>
        {liveData?.data?.length ? (
          <div className="space-y-2">
            {liveData.data.map((m: any) => (
              <div key={m.id} className="flex justify-between text-sm">
                <span className="text-gray-300">{m.homeTeam?.name} <span className="text-gray-500">vs</span> {m.awayTeam?.name}</span>
                <span className="font-mono text-white">{m.homeScore ?? 0} : {m.awayScore ?? 0}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Không có trận nào đang diễn ra</p>
        )}
      </div>

      {/* Pending bets */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Cược chờ kết toán</h3>
        {pendingBets?.data?.length ? (
          <div className="space-y-2">
            {pendingBets.data.map((b: any) => (
              <div key={b.id} className="flex justify-between text-sm">
                <span className="text-gray-400">{b.user?.username ?? '—'}</span>
                <span className="font-mono text-white">{fmt(Number(b.stake))}₫ → {fmt(Number(b.potentialWin))}₫</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Không có cược nào đang chờ</p>
        )}
      </div>
    </div>
  );
}

// ── Tab: Matches ──────────────────────────────────────────────────────────────
function MatchesTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin:matches', statusFilter, page],
    queryFn:  () => adminApi.getMatches({ status: statusFilter || undefined, page, limit: 20 }),
    staleTime: 10_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => adminApi.updateMatch(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin:matches'] }),
  });

  const total = data?.total ?? 0;
  const pages = Math.ceil(total / 20);

  return (
    <div className="space-y-3">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'scheduled', 'live', 'halftime', 'finished', 'cancelled'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs ${statusFilter === s ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {s || 'Tất cả'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="bg-gray-800 text-xs text-gray-400">
                <th className="px-3 py-2">Trận</th>
                <th className="px-3 py-2 hidden sm:table-cell">Giải</th>
                <th className="px-3 py-2 hidden md:table-cell">Giờ</th>
                <th className="px-3 py-2">TT</th>
                <th className="px-3 py-2 text-center">Tỷ số</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((m: any) => (
                <MatchRow key={m.id} match={m}
                  onUpdate={(id, d) => mutation.mutate({ id, d })} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex gap-2 justify-center">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 text-xs bg-gray-700 rounded disabled:opacity-40">←</button>
          <span className="text-xs text-gray-400 self-center">{page} / {pages} ({fmt(total)})</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 text-xs bg-gray-700 rounded disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  );
}

// ── Tab: Leagues ──────────────────────────────────────────────────────────────
function LeaguesTab() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin:leagues'],
    queryFn:  () => adminApi.getLeagues({ limit: 50 }),
    staleTime: 30_000,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => adminApi.updateLeague(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin:leagues'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteLeague(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin:leagues'] }),
  });

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800 text-xs text-gray-400">
                <th className="px-3 py-2">Giải đấu</th>
                <th className="px-3 py-2 hidden sm:table-cell">Quốc gia</th>
                <th className="px-3 py-2 hidden md:table-cell">Loại</th>
                <th className="px-3 py-2">TT</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((lg: any) => (
                <LeagueRow key={lg.id} league={lg}
                  onUpdate={(id, d) => updateMut.mutate({ id, d })}
                  onDelete={(id) => deleteMut.mutate(id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2 text-right">{data?.total ?? 0} giải</p>
    </div>
  );
}

// ── Tab: Bets ─────────────────────────────────────────────────────────────────
function BetsTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin:bets', statusFilter, page],
    queryFn:  () => adminApi.getBets({ status: statusFilter || undefined, page, limit: 20 }),
    staleTime: 10_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => adminApi.updateBet(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin:bets'] }),
  });

  const total = data?.total ?? 0;
  const pages = Math.ceil(total / 20);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {['pending', 'won', 'lost', 'void', ''].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs ${statusFilter === s ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {s || 'Tất cả'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-left min-w-[540px]">
            <thead>
              <tr className="bg-gray-800 text-xs text-gray-400">
                <th className="px-3 py-2 hidden lg:table-cell">ID</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Cược</th>
                <th className="px-3 py-2">Tiềm năng</th>
                <th className="px-3 py-2">TT</th>
                <th className="px-3 py-2 hidden md:table-cell">Ngày</th>
                <th className="px-3 py-2">Kết toán</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((b: any) => (
                <BetRow key={b.id} bet={b}
                  onUpdate={(id, d) => mutation.mutate({ id, d })} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {data?.data?.length > 0 && (
        <div className="bg-gray-800 rounded p-3 flex gap-6 text-sm flex-wrap">
          <span className="text-gray-400">
            Tổng cược: <span className="text-white font-mono">
              {fmt(data.data.reduce((s: number, b: any) => s + Number(b.stake), 0))}₫
            </span>
          </span>
          <span className="text-gray-400">
            Tiềm năng chi: <span className="text-green-400 font-mono">
              {fmt(data.data.reduce((s: number, b: any) => s + Number(b.potentialWin), 0))}₫
            </span>
          </span>
          <span className="text-gray-400">Số phiếu: <span className="text-white">{data.data.length}</span></span>
        </div>
      )}

      {pages > 1 && (
        <div className="flex gap-2 justify-center">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 text-xs bg-gray-700 rounded disabled:opacity-40">←</button>
          <span className="text-xs text-gray-400 self-center">{page} / {pages} ({fmt(total)})</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 text-xs bg-gray-700 rounded disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  );
}

// ── Tab: Users ────────────────────────────────────────────────────────────────
function UsersTab() {
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [page, setPage]           = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin:users', search, statusFilter, page],
    queryFn:  () => adminApi.getUsers({ search: search || undefined, status: statusFilter || undefined, page, limit: 20 }),
    staleTime: 10_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => adminApi.updateUser(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin:users'] }),
  });

  const total = data?.total ?? 0;
  const pages = Math.ceil(total / 20);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm username / email..."
          className="flex-1 min-w-[180px] bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500" />
        {['', 'active', 'suspended', 'banned'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs ${statusFilter === s ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {s || 'Tất cả'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-left min-w-[420px]">
            <thead>
              <tr className="bg-gray-800 text-xs text-gray-400">
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2 hidden sm:table-cell">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">TT</th>
                <th className="px-3 py-2 hidden md:table-cell">Ngày tạo</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((u: any) => (
                <UserRow key={u.id} user={u}
                  onUpdate={(id, d) => mutation.mutate({ id, d })} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex gap-2 justify-center">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 text-xs bg-gray-700 rounded disabled:opacity-40">←</button>
          <span className="text-xs text-gray-400 self-center">{page} / {pages} ({fmt(total)})</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 text-xs bg-gray-700 rounded disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'matches',  label: 'Trận đấu' },
  { id: 'leagues',  label: 'Giải đấu' },
  { id: 'bets',     label: 'Cá cược' },
  { id: 'users',    label: 'Người dùng' },
];

export default function AdminSportsPage() {
  const { user, isLoggedIn } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');

  // Guard: redirect non-admins
  if (!isLoggedIn || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold">Admin Sports</h1>
          <p className="text-xs text-gray-400">Quản lý trận đấu • Giải đấu • Cá cược • Người dùng</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4 border-b border-gray-800">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm rounded-t whitespace-nowrap transition-colors
              ${tab === t.id ? 'text-green-400 border-b-2 border-green-500 bg-gray-800' : 'text-gray-400 hover:text-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab />}
      {tab === 'matches'  && <MatchesTab />}
      {tab === 'leagues'  && <LeaguesTab />}
      {tab === 'bets'     && <BetsTab />}
      {tab === 'users'    && <UsersTab />}
    </div>
  );
}
