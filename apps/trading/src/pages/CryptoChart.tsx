import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  getPairBySymbol, getPriceHistory,
  getWatchlists, addToWatchlist, removeFromWatchlist,
} from '@/api/trade';
import { fmt, fmtPct, fmtVol } from '@/utils/formatters';
import type { PriceCandle } from '@/types';
import toast from 'react-hot-toast';

// ── Interval selector ──────────────────────────────────────────────────────────
type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
const INTERVALS: { key: Interval; label: string }[] = [
  { key: '1m',  label: '1P' },
  { key: '5m',  label: '5P' },
  { key: '15m', label: '15P' },
  { key: '1h',  label: '1G' },
  { key: '4h',  label: '4G' },
  { key: '1d',  label: '1N' },
];

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
interface TooltipPayload {
  payload: PriceCandle & { displayTime: string };
}
function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isUp = d.close >= d.open;
  return (
    <div className="rounded-xl p-3 text-xs shadow-lg"
      style={{ background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)' }}>
      <p className="font-semibold mb-1.5" style={{ color: 'var(--bn-text-secondary)' }}>{d.displayTime}</p>
      <div className="space-y-0.5">
        <p style={{ color: 'var(--bn-text-primary)' }}>Mở: <strong>${fmt(d.open, d.open < 1 ? 4 : 2)}</strong></p>
        <p style={{ color: 'var(--bn-green)' }}>Cao: <strong>${fmt(d.high, d.high < 1 ? 4 : 2)}</strong></p>
        <p style={{ color: 'var(--bn-red)'   }}>Thấp: <strong>${fmt(d.low, d.low < 1 ? 4 : 2)}</strong></p>
        <p style={{ color: isUp ? 'var(--bn-green)' : 'var(--bn-red)' }}>
          Đóng: <strong>${fmt(d.close, d.close < 1 ? 4 : 2)}</strong>
        </p>
      </div>
    </div>
  );
}

// ── Chart page ─────────────────────────────────────────────────────────────────
export default function CryptoChart() {
  const { symbol = '' } = useParams<{ symbol: string }>();
  const nav    = useNavigate();
  const qc     = useQueryClient();
  const [interval, setInterval] = useState<Interval>('1h');

  const { data: pairData, isLoading: pairLoading, refetch } = useQuery({
    queryKey: ['crypto', 'pair', symbol],
    queryFn:  () => getPairBySymbol(symbol),
    enabled:  !!symbol,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
  const pair = pairData?.data ?? null;

  const { data: histData, isLoading: histLoading } = useQuery({
    queryKey: ['crypto', 'history', symbol, interval],
    queryFn:  () => getPriceHistory(symbol, { interval, limit: 120 }),
    enabled:  !!symbol,
    staleTime: 60_000,
  });
  const chartData = (histData?.data ?? []).map(c => ({
    ...c,
    open:  Number(c.open),  high: Number(c.high),
    low:   Number(c.low),   close: Number(c.close),
    volume: Number(c.volume),
    displayTime: new Date(c.time).toLocaleString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
  }));

  // ── Watchlist toggle ───────────────────────────────────────────────────────────
  const { data: wlData } = useQuery({
    queryKey: ['crypto', 'watchlists'],
    queryFn:  getWatchlists,
  });
  const firstList = wlData?.data?.[0] ?? null;
  const watchItem = firstList?.items.find(i => i.symbol?.code === symbol);
  const isWatched = !!watchItem;

  const addMut = useMutation({
    mutationFn: () => addToWatchlist(firstList!.id, String(pair?.id)),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['crypto', 'watchlists'] }); toast.success('Đã thêm vào theo dõi'); },
    onError:    () => toast.error('Không thể thêm'),
  });
  const removeMut = useMutation({
    mutationFn: () => removeFromWatchlist(firstList!.id, watchItem!.symbolId),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['crypto', 'watchlists'] }); toast.success('Đã bỏ theo dõi'); },
    onError:    () => toast.error('Không thể bỏ theo dõi'),
  });

  const handleToggleWatch = () => {
    if (!firstList) { toast.error('Tạo danh sách theo dõi trước'); return; }
    if (isWatched) removeMut.mutate();
    else addMut.mutate();
  };

  const isUp = (pair?.priceChange ?? 0) >= 0;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <button onClick={() => nav(-1)}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--bn-text-secondary)' }}>
          <ArrowLeft size={16} /> Quay lại
        </button>
        <div className="flex items-center gap-2">
          {symbol && (
            <button onClick={handleToggleWatch}
              className="p-2 rounded-xl transition-colors"
              style={{ color: isWatched ? 'var(--bn-primary)' : 'var(--bn-text-secondary)' }}>
              <Star size={16} fill={isWatched ? 'var(--bn-primary)' : 'none'} />
            </button>
          )}
          <button onClick={() => refetch()}
            className="p-2 rounded-xl transition-colors" style={{ color: 'var(--bn-text-secondary)' }}>
            <RefreshCw size={14} className={pairLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* If no symbol — show selector */}
      {!symbol ? (
        <PairSelector onSelect={(sym) => nav(`/crypto/chart/${sym}`)} />
      ) : pairLoading ? (
        <div className="flex items-center justify-center py-20"
          style={{ color: 'var(--bn-text-secondary)' }}>Đang tải...</div>
      ) : !pair ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--bn-text-secondary)' }}>
          Không tìm thấy cặp "{symbol}"
        </div>
      ) : (
        <div className="space-y-4">
          {/* Price header */}
          <div className="rounded-2xl p-5"
            style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: 'var(--bn-text-secondary)' }}>{pair.symbol}</p>
                <p className="text-3xl font-black" style={{ color: 'var(--bn-text-primary)' }}>
                  ${pair.lastPrice < 1 ? fmt(pair.lastPrice, 4) : fmt(pair.lastPrice, 2)}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-xl mt-2"
                  style={isUp
                    ? { background: 'var(--bn-green-muted)', color: 'var(--bn-green)' }
                    : { background: 'var(--bn-red-muted)',   color: 'var(--bn-red)'   }}>
                  {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {pair.priceChange >= 0 ? '+' : ''}{fmtPct(pair.priceChange)} (24h)
                </span>
              </div>
              <div className="text-right space-y-2 text-sm">
                <div>
                  <p className="text-[10px] uppercase" style={{ color: 'var(--bn-text-secondary)' }}>Cao 24h</p>
                  <p className="font-semibold" style={{ color: 'var(--bn-green)' }}>${fmt(pair.high24h, 2)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase" style={{ color: 'var(--bn-text-secondary)' }}>Thấp 24h</p>
                  <p className="font-semibold" style={{ color: 'var(--bn-red)' }}>${fmt(pair.low24h, 2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart card */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
            {/* Interval selector */}
            <div className="flex items-center gap-1 px-4 py-3" style={{ borderBottom: '1px solid var(--bn-border)' }}>
              {INTERVALS.map(i => (
                <button key={i.key} onClick={() => setInterval(i.key)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: interval === i.key ? 'var(--bn-primary)' : 'var(--bn-bg-elevated)',
                    color:      interval === i.key ? '#fff' : 'var(--bn-text-secondary)',
                  }}>
                  {i.label}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div style={{ height: 300, padding: '12px 8px' }}>
              {histLoading ? (
                <div className="h-full flex items-center justify-center text-sm"
                  style={{ color: 'var(--bn-text-secondary)' }}>Đang tải biểu đồ...</div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm"
                  style={{ color: 'var(--bn-text-secondary)' }}>Chưa có dữ liệu</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={isUp ? '#0ecb81' : '#f6465d'} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={isUp ? '#0ecb81' : '#f6465d'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bn-border)" />
                    <XAxis dataKey="displayTime"
                      tick={{ fontSize: 9, fill: 'var(--bn-text-secondary)' }}
                      tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']}
                      tick={{ fontSize: 9, fill: 'var(--bn-text-secondary)' }}
                      tickLine={false} axisLine={false} width={60}
                      tickFormatter={v => `$${v < 1 ? v.toFixed(4) : v.toFixed(2)}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="close"
                      stroke={isUp ? 'var(--bn-green)' : 'var(--bn-red)'}
                      strokeWidth={2} fill="url(#grad)" dot={false}
                      activeDot={{ r: 4, fill: isUp ? '#0ecb81' : '#f6465d' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pair info */}
          <div className="rounded-2xl p-5"
            style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: 'var(--bn-text-secondary)' }}>Thông tin cặp</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: 'Tài sản cơ sở',    value: pair.baseAsset },
                { label: 'Tài sản báo giá',  value: pair.quoteAsset },
                { label: 'Thị trường',        value: pair.market?.name ?? pair.market?.code ?? '—' },
                { label: 'Loại',              value: pair.market?.type ?? 'spot' },
                { label: 'Trạng thái',        value: (pair.status ?? 'active') === 'active' ? '🟢 Đang giao dịch' : '🔴 Tạm dừng' },
                { label: 'KL 24h',            value: fmtVol(pair.volume24h) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] uppercase" style={{ color: 'var(--bn-text-secondary)' }}>{label}</p>
                  <p className="font-semibold mt-0.5" style={{ color: 'var(--bn-text-primary)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pair Selector (khi vào /crypto/chart mà chưa chọn pair) ───────────────────
function PairSelector({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [q, setQ] = useState('');
  const { data } = useQuery({
    queryKey: ['crypto', 'pairs'],
    queryFn:  () => import('@/api/trade').then(m => m.getPairs()),
  });
  const pairs = (data?.data ?? []).filter(p => {
    const s = q.toLowerCase();
    return !s || p.symbol.toLowerCase().includes(s) || p.baseAsset.toLowerCase().includes(s);
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw size={18} style={{ color: 'var(--bn-primary)' }} />
        <h2 className="font-bold" style={{ color: 'var(--bn-text-primary)' }}>Chọn cặp xem biểu đồ</h2>
      </div>
      <input value={q} onChange={e => setQ(e.target.value)}
        placeholder="Tìm BTC, ETH, ..."
        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none mb-4"
        style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)', color: 'var(--bn-text-primary)' }} />
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
        {pairs.slice(0, 40).map(pair => {
          const isUp = pair.priceChange >= 0;
          return (
            <button key={pair.id} onClick={() => onSelect(pair.symbol)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
              style={{ borderBottom: '1px solid var(--bn-border)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bn-bg-elevated)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ background: 'var(--bn-primary)' }}>
                  {pair.baseAsset.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--bn-text-primary)' }}>{pair.symbol}</p>
                  <p className="text-[10px]" style={{ color: 'var(--bn-text-secondary)' }}>{pair.market?.type ?? 'spot'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold" style={{ color: 'var(--bn-text-primary)' }}>
                  ${pair.lastPrice < 1 ? fmt(pair.lastPrice, 4) : fmt(pair.lastPrice, 2)}
                </p>
                <p className="text-xs font-semibold" style={{ color: isUp ? 'var(--bn-green)' : 'var(--bn-red)' }}>
                  {isUp ? '+' : ''}{fmtPct(pair.priceChange)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
