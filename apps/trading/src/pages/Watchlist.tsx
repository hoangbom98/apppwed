import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getWatchlists, createWatchlist, deleteWatchlist,
  addToWatchlist, removeFromWatchlist, getPairs,
} from '@/api/trade';
import { useTradeStore } from '@/store/tradeStore';
import { fmt, fmtPct } from '@/utils/formatters';
import type { WatchlistItem, TradePair } from '@/types';
import {
  Star, Plus, Trash2, X, TrendingUp, TrendingDown,
  PlusCircle, ChevronRight, Loader2, List,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Helpers ────────────────────────────────────────────────────────────────────
const surface  = { background: 'var(--bn-bg-surface)',   border: '1px solid var(--bn-border)' };
const elevated = { background: 'var(--bn-bg-elevated)',  border: '1px solid var(--bn-border)' };
const cardCls  = 'rounded-2xl overflow-hidden';

// ── Watchlist Page ─────────────────────────────────────────────────────────────
export default function WatchlistPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { selectPair } = useTradeStore();

  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [newName, setNewName]         = useState('');
  const [showAddPair, setShowAddPair] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: wlData, isLoading: wlLoading } = useQuery({
    queryKey: ['watchlists'],
    queryFn:  getWatchlists,
  });
  const watchlists: WatchlistItem[] = wlData?.data ?? [];

  const { data: pairsData } = useQuery({
    queryKey: ['pairs'],
    queryFn:  getPairs,
    staleTime: 30_000,
  });
  const allPairs: TradePair[] = pairsData?.data ?? [];

  const selected = watchlists.find(w => w.id === selectedId) ?? watchlists[0] ?? null;

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (name: string) => createWatchlist({ name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlists'] });
      setNewName('');
      toast.success('Đã tạo danh sách');
    },
    onError: () => toast.error('Không thể tạo danh sách'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteWatchlist(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlists'] });
      setSelectedId(null);
      toast.success('Đã xóa danh sách');
    },
    onError: () => toast.error('Không thể xóa'),
  });

  const addMut = useMutation({
    mutationFn: ({ watchlistId, symbolId }: { watchlistId: string; symbolId: string }) =>
      addToWatchlist(watchlistId, symbolId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlists'] });
      setShowAddPair(false);
      toast.success('Đã thêm cặp giao dịch');
    },
    onError: () => toast.error('Không thể thêm cặp'),
  });

  const removeMut = useMutation({
    mutationFn: ({ watchlistId, symbolId }: { watchlistId: string; symbolId: string }) =>
      removeFromWatchlist(watchlistId, symbolId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlists'] }),
    onError: () => toast.error('Không thể xóa cặp'),
  });

  // ── Derived data ──────────────────────────────────────────────────────────────
  const activeWatchlist = selected;
  const watchedSymbolIds = new Set(activeWatchlist?.items.map(i => i.symbolId) ?? []);

  const availablePairs = allPairs.filter(p => !watchedSymbolIds.has(p.id));

  // Enrich watchlist items with live pair data
  const enrichedItems = (activeWatchlist?.items ?? []).map(item => {
    const pair = allPairs.find(p => p.id === item.symbolId);
    return { item, pair };
  });

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleCreateWatchlist = () => {
    const name = newName.trim();
    if (!name) return;
    createMut.mutate(name);
  };

  const handleNavigateToTerminal = (pair: TradePair) => {
    selectPair(pair);
    navigate('/terminal');
  };

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(252,213,53,0.12)' }}>
          <Star size={18} style={{ color: 'var(--bn-primary)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Danh sách yêu thích</h1>
          <p className="text-xs" style={{ color: 'var(--bn-muted)' }}>Theo dõi các cặp giao dịch quan tâm</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: watchlist panel ── */}
        <div className="space-y-3">
          {/* Create new watchlist */}
          <div className={`${cardCls} p-4`} style={surface}>
            <p className="text-xs font-semibold mb-2.5" style={{ color: 'var(--bn-muted)' }}>TẠO DANH SÁCH MỚI</p>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateWatchlist()}
                placeholder="Tên danh sách…"
                className="flex-1 bg-transparent border rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                style={{ borderColor: 'var(--bn-border)' }}
              />
              <button
                onClick={handleCreateWatchlist}
                disabled={!newName.trim() || createMut.isPending}
                className="px-3 py-2 rounded-xl font-semibold text-sm disabled:opacity-40 transition-colors flex items-center gap-1"
                style={{ background: 'var(--bn-primary)', color: '#0b0e11' }}
              >
                {createMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              </button>
            </div>
          </div>

          {/* Watchlist list */}
          <div className={`${cardCls}`} style={surface}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--bn-border)' }}>
              <span className="text-sm font-semibold text-white">Danh sách của tôi</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bn-bg-elevated)', color: 'var(--bn-muted)' }}>
                {watchlists.length}
              </span>
            </div>

            {wlLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--bn-muted)' }} />
              </div>
            ) : watchlists.length === 0 ? (
              <div className="py-8 text-center">
                <List size={28} className="mx-auto mb-2" style={{ color: 'var(--bn-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--bn-muted)' }}>Chưa có danh sách nào</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--bn-border)' }}>
                {watchlists.map(wl => (
                  <button
                    key={wl.id}
                    onClick={() => setSelectedId(wl.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                    style={{
                      background: (activeWatchlist?.id === wl.id) ? 'var(--bn-bg-elevated)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Star size={13} fill={activeWatchlist?.id === wl.id ? 'var(--bn-primary)' : 'transparent'}
                        style={{ color: 'var(--bn-primary)', flexShrink: 0 }} />
                      <span className="text-sm font-medium text-white truncate">{wl.name}</span>
                      <span className="text-[10px] shrink-0" style={{ color: 'var(--bn-muted)' }}>{wl.items.length}</span>
                    </div>
                    <ChevronRight size={13} style={{ color: 'var(--bn-muted)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: selected watchlist detail ── */}
        <div className="lg:col-span-2">
          {!activeWatchlist ? (
            <div className={`${cardCls} flex flex-col items-center justify-center py-20`} style={surface}>
              <Star size={36} className="mb-3" style={{ color: 'var(--bn-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--bn-muted)' }}>Chọn hoặc tạo một danh sách để bắt đầu</p>
            </div>
          ) : (
            <div className={`${cardCls}`} style={surface}>
              {/* Watchlist header */}
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--bn-border)' }}>
                <div className="flex items-center gap-2">
                  <Star size={15} fill="var(--bn-primary)" style={{ color: 'var(--bn-primary)' }} />
                  <span className="font-semibold text-white">{activeWatchlist.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bn-bg-elevated)', color: 'var(--bn-muted)' }}>
                    {activeWatchlist.items.length} cặp
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddPair(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                    style={{ background: 'rgba(252,213,53,0.12)', color: 'var(--bn-primary)' }}
                  >
                    <PlusCircle size={13} /> Thêm cặp
                  </button>
                  <button
                    onClick={() => { if (confirm('Xóa danh sách này?')) deleteMut.mutate(activeWatchlist.id); }}
                    disabled={deleteMut.isPending}
                    className="p-1.5 rounded-xl transition-colors hover:bg-red-900/20"
                    style={{ color: 'var(--bn-red)' }}
                    title="Xóa danh sách"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Add pair dropdown */}
              {showAddPair && (
                <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--bn-border)', background: 'var(--bn-bg-elevated)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-white">Chọn cặp giao dịch để thêm</p>
                    <button onClick={() => setShowAddPair(false)} style={{ color: 'var(--bn-muted)' }}>
                      <X size={15} />
                    </button>
                  </div>
                  {availablePairs.length === 0 ? (
                    <p className="text-xs text-center py-2" style={{ color: 'var(--bn-muted)' }}>Đã thêm tất cả các cặp</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {availablePairs.map(pair => (
                        <button
                          key={pair.id}
                          onClick={() => addMut.mutate({ watchlistId: activeWatchlist.id, symbolId: pair.id })}
                          disabled={addMut.isPending}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors border hover:border-yellow-500/50"
                          style={{ ...elevated, borderColor: 'var(--bn-border)' }}
                        >
                          <span className="font-semibold text-white">{pair.symbol}</span>
                          <span style={{ color: pair.priceChange >= 0 ? 'var(--bn-green)' : 'var(--bn-red)' }}>
                            {pair.priceChange >= 0 ? '+' : ''}{fmtPct(pair.priceChange)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pairs in watchlist */}
              {enrichedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Plus size={28} className="mb-2" style={{ color: 'var(--bn-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--bn-muted)' }}>Danh sách trống — thêm cặp giao dịch</p>
                </div>
              ) : (
                <div>
                  {/* Table header */}
                  <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--bn-muted)', borderBottom: '1px solid var(--bn-border)' }}>
                    <span className="col-span-4">Cặp giao dịch</span>
                    <span className="col-span-3 text-right">Giá</span>
                    <span className="col-span-2 text-right">24h %</span>
                    <span className="col-span-2 text-right">Vol</span>
                    <span className="col-span-1" />
                  </div>

                  <div className="divide-y" style={{ borderColor: 'var(--bn-border)' }}>
                    {enrichedItems.map(({ item, pair }) => (
                      <div key={item.id} className="grid grid-cols-12 items-center px-5 py-3 hover:bg-[var(--bn-bg-elevated)] transition-colors group">
                        {/* Symbol */}
                        <button
                          className="col-span-4 flex items-center gap-2 text-left"
                          onClick={() => pair && handleNavigateToTerminal(pair)}
                          title="Mở trong Terminal"
                        >
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-[#0b0e11] shrink-0"
                            style={{ background: 'var(--bn-primary)' }}>
                            {(pair?.baseAsset ?? item.symbol?.code ?? '?')[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors">
                              {pair?.symbol ?? item.symbol?.code ?? 'Không rõ'}
                            </p>
                            <p className="text-[10px]" style={{ color: 'var(--bn-muted)' }}>{pair?.baseAsset ?? ''}</p>
                          </div>
                        </button>

                        {/* Price */}
                        <span className="col-span-3 text-right font-mono text-sm text-white">
                          {pair ? fmt(pair.lastPrice, pair.lastPrice < 1 ? 4 : 2) : '—'}
                        </span>

                        {/* 24h % */}
                        <span className="col-span-2 text-right text-xs font-semibold flex items-center justify-end gap-0.5">
                          {pair ? (
                            <>
                              {pair.priceChange >= 0
                                ? <TrendingUp size={10} style={{ color: 'var(--bn-green)' }} />
                                : <TrendingDown size={10} style={{ color: 'var(--bn-red)' }} />}
                              <span style={{ color: pair.priceChange >= 0 ? 'var(--bn-green)' : 'var(--bn-red)' }}>
                                {pair.priceChange >= 0 ? '+' : ''}{fmtPct(pair.priceChange)}
                              </span>
                            </>
                          ) : '—'}
                        </span>

                        {/* Volume */}
                        <span className="col-span-2 text-right text-xs" style={{ color: 'var(--bn-muted)' }}>
                          {pair ? (pair.volume24h >= 1_000_000
                            ? `${(pair.volume24h / 1_000_000).toFixed(1)}M`
                            : `${(pair.volume24h / 1_000).toFixed(0)}K`)
                          : '—'}
                        </span>

                        {/* Remove */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => removeMut.mutate({ watchlistId: activeWatchlist.id, symbolId: item.symbolId })}
                            disabled={removeMut.isPending}
                            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/20"
                            style={{ color: 'var(--bn-red)' }}
                            title="Xóa khỏi danh sách"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
