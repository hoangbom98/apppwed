import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getWatchlists, createWatchlist, deleteWatchlist,
  addToWatchlist, removeFromWatchlist, getPairs,
} from '@/api/trade';
import { fmt, fmtPct, fmtVol } from '@/utils/formatters';
import type { WatchlistItem, TradePair } from '@/types';
import {
  Star, Plus, Trash2, X, TrendingUp, TrendingDown,
  PlusCircle, ChevronRight, Loader2, List,
} from 'lucide-react';
import toast from 'react-hot-toast';

const surface  = { background: 'var(--bn-bg-surface)',  border: '1px solid var(--bn-border)' };
const elevated = { background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)' };
const card = 'rounded-2xl overflow-hidden';

export default function CryptoWatchlist() {
  const qc  = useQueryClient();
  const nav = useNavigate();

  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [newName, setNewName]         = useState('');
  const [showAddPair, setShowAddPair] = useState(false);
  const [addSearch, setAddSearch]     = useState('');

  // ── Queries ───────────────────────────────────────────────────────────────────
  const { data: wlData, isLoading: wlLoading } = useQuery({
    queryKey: ['crypto', 'watchlists'],
    queryFn:  getWatchlists,
  });
  const watchlists: WatchlistItem[] = wlData?.data ?? [];

  const { data: pairsData } = useQuery({
    queryKey: ['crypto', 'pairs'],
    queryFn:  () => getPairs(),
    staleTime: 30_000,
  });
  const allPairs: TradePair[] = pairsData?.data ?? [];

  const active = watchlists.find(w => w.id === selectedId) ?? watchlists[0] ?? null;

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (name: string) => createWatchlist({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crypto', 'watchlists'] }); setNewName(''); toast.success('Đã tạo danh sách'); },
    onError:   () => toast.error('Không thể tạo danh sách'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteWatchlist(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crypto', 'watchlists'] }); setSelectedId(null); toast.success('Đã xóa'); },
    onError:   () => toast.error('Không thể xóa'),
  });
  const addMut = useMutation({
    mutationFn: ({ wlId, symId }: { wlId: string; symId: string }) => addToWatchlist(wlId, symId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crypto', 'watchlists'] }); setShowAddPair(false); toast.success('Đã thêm'); },
    onError:   () => toast.error('Không thể thêm'),
  });
  const removeMut = useMutation({
    mutationFn: ({ wlId, symId }: { wlId: string; symId: string }) => removeFromWatchlist(wlId, symId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crypto', 'watchlists'] }),
    onError:   () => toast.error('Không thể xóa'),
  });

  // ── Derived ───────────────────────────────────────────────────────────────────
  const watchedIds   = new Set(active?.items.map(i => String(i.symbolId)) ?? []);
  const available    = allPairs.filter(p => {
    if (watchedIds.has(String(p.id))) return false;
    const s = addSearch.toLowerCase();
    return !s || p.symbol.toLowerCase().includes(s) || p.baseAsset.toLowerCase().includes(s);
  });
  const enriched = (active?.items ?? []).map(item => ({
    item,
    pair: allPairs.find(p => String(p.id) === String(item.symbolId)),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--bn-yellow-muted)' }}>
          <Star size={18} style={{ color: 'var(--bn-primary)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--bn-text-primary)' }}>Danh sách theo dõi</h1>
          <p className="text-xs" style={{ color: 'var(--bn-text-secondary)' }}>Theo dõi các cặp giao dịch quan tâm</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left panel ── */}
        <div className="space-y-3">
          {/* Create watchlist */}
          <div className={`${card} p-4`} style={surface}>
            <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide"
              style={{ color: 'var(--bn-text-secondary)' }}>Tạo danh sách mới</p>
            <div className="flex gap-2">
              <input
                value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && newName.trim() && createMut.mutate(newName.trim())}
                placeholder="Tên danh sách…"
                className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)', color: 'var(--bn-text-primary)' }}
              />
              <button onClick={() => newName.trim() && createMut.mutate(newName.trim())}
                disabled={!newName.trim() || createMut.isPending}
                className="px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center gap-1"
                style={{ background: 'var(--bn-primary)', color: '#fff' }}>
                {createMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              </button>
            </div>
          </div>

          {/* Watchlist list */}
          <div className={card} style={surface}>
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--bn-border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--bn-text-primary)' }}>Danh sách của tôi</span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bn-bg-elevated)', color: 'var(--bn-text-secondary)' }}>
                {watchlists.length}
              </span>
            </div>
            {wlLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--bn-text-secondary)' }} />
              </div>
            ) : watchlists.length === 0 ? (
              <div className="py-8 text-center">
                <List size={28} className="mx-auto mb-2" style={{ color: 'var(--bn-text-secondary)' }} />
                <p className="text-sm" style={{ color: 'var(--bn-text-secondary)' }}>Chưa có danh sách nào</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--bn-border)' }}>
                {watchlists.map(wl => (
                  <button key={wl.id} onClick={() => setSelectedId(wl.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                    style={{ background: active?.id === wl.id ? 'var(--bn-bg-elevated)' : 'transparent' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Star size={12} fill={active?.id === wl.id ? 'var(--bn-primary)' : 'none'}
                        style={{ color: 'var(--bn-primary)', flexShrink: 0 }} />
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--bn-text-primary)' }}>{wl.name}</span>
                      <span className="text-[10px] shrink-0" style={{ color: 'var(--bn-text-secondary)' }}>{wl.items.length}</span>
                    </div>
                    <ChevronRight size={13} style={{ color: 'var(--bn-text-secondary)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="lg:col-span-2">
          {!active ? (
            <div className={`${card} flex flex-col items-center justify-center py-20`} style={surface}>
              <Star size={36} className="mb-3" style={{ color: 'var(--bn-text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--bn-text-secondary)' }}>Chọn hoặc tạo một danh sách để bắt đầu</p>
            </div>
          ) : (
            <div className={card} style={surface}>
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--bn-border)' }}>
                <div className="flex items-center gap-2">
                  <Star size={15} fill="var(--bn-primary)" style={{ color: 'var(--bn-primary)' }} />
                  <span className="font-semibold" style={{ color: 'var(--bn-text-primary)' }}>{active.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--bn-bg-elevated)', color: 'var(--bn-text-secondary)' }}>
                    {active.items.length} cặp
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowAddPair(s => !s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: 'var(--bn-yellow-muted)', color: 'var(--bn-primary)' }}>
                    <PlusCircle size={13} /> Thêm cặp
                  </button>
                  <button onClick={() => { if (confirm('Xóa danh sách này?')) deleteMut.mutate(active.id); }}
                    disabled={deleteMut.isPending}
                    className="p-1.5 rounded-xl transition-colors" style={{ color: 'var(--bn-red)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Add pair panel */}
              {showAddPair && (
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--bn-border)', background: 'var(--bn-bg-elevated)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold" style={{ color: 'var(--bn-text-primary)' }}>Chọn cặp để thêm</p>
                    <button onClick={() => setShowAddPair(false)} style={{ color: 'var(--bn-text-secondary)' }}><X size={15} /></button>
                  </div>
                  <input value={addSearch} onChange={e => setAddSearch(e.target.value)}
                    placeholder="Tìm BTC, ETH..."
                    className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none mb-3"
                    style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)', color: 'var(--bn-text-primary)' }}
                    autoFocus />
                  {available.length === 0 ? (
                    <p className="text-xs text-center py-2" style={{ color: 'var(--bn-text-secondary)' }}>
                      {addSearch ? 'Không tìm thấy' : 'Đã thêm tất cả cặp'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {available.map(pair => (
                        <button key={pair.id}
                          onClick={() => addMut.mutate({ wlId: active.id, symId: String(pair.id) })}
                          disabled={addMut.isPending}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-colors"
                          style={elevated}>
                          <span className="font-semibold" style={{ color: 'var(--bn-text-primary)' }}>{pair.symbol}</span>
                          <span style={{ color: pair.priceChange >= 0 ? 'var(--bn-green)' : 'var(--bn-red)' }}>
                            {pair.priceChange >= 0 ? '+' : ''}{fmtPct(pair.priceChange)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pairs list */}
              {enriched.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Plus size={28} className="mb-2" style={{ color: 'var(--bn-text-secondary)' }} />
                  <p className="text-sm" style={{ color: 'var(--bn-text-secondary)' }}>Danh sách trống — thêm cặp giao dịch</p>
                </div>
              ) : (
                <div>
                  {/* Table header */}
                  <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--bn-text-secondary)', borderBottom: '1px solid var(--bn-border)' }}>
                    <span className="col-span-4">Cặp</span>
                    <span className="col-span-3 text-right">Giá</span>
                    <span className="col-span-2 text-right">24h %</span>
                    <span className="col-span-2 text-right hidden sm:block">Vol</span>
                    <span className="col-span-1" />
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--bn-border)' }}>
                    {enriched.map(({ item, pair }) => (
                      <div key={item.id}
                        className="grid grid-cols-12 items-center px-5 py-3 group"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bn-bg-elevated)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        {/* Symbol */}
                        <button className="col-span-4 flex items-center gap-2 text-left"
                          onClick={() => nav(`/crypto/chart/${pair?.symbol ?? item.symbol?.code}`)}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                            style={{ background: 'var(--bn-primary)', color: '#fff' }}>
                            {(pair?.baseAsset ?? item.symbol?.code ?? '?')[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--bn-text-primary)' }}>
                              {pair?.symbol ?? item.symbol?.code ?? '—'}
                            </p>
                            <p className="text-[10px]" style={{ color: 'var(--bn-text-secondary)' }}>{pair?.baseAsset ?? ''}</p>
                          </div>
                        </button>
                        {/* Price */}
                        <span className="col-span-3 text-right font-mono text-sm" style={{ color: 'var(--bn-text-primary)' }}>
                          {pair ? (pair.lastPrice < 1 ? fmt(pair.lastPrice, 4) : fmt(pair.lastPrice, 2)) : '—'}
                        </span>
                        {/* Change */}
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
                        <span className="col-span-2 text-right text-xs hidden sm:block" style={{ color: 'var(--bn-text-secondary)' }}>
                          {pair ? fmtVol(pair.volume24h) : ''}
                        </span>
                        {/* Remove */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => removeMut.mutate({ wlId: active.id, symId: item.symbolId })}
                            disabled={removeMut.isPending}
                            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--bn-red)' }}>
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
