import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { usePairDetail, usePriceHistory, useWatchlists, useAddToWatchlist, useRemoveFromWatchlist } from '../hooks/useCrypto';
import toast from 'react-hot-toast';

// ── Interval selector ─────────────────────────────────────────────────────────

type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

const INTERVALS: { key: Interval; label: string }[] = [
  { key: '1m',  label: '1P' },
  { key: '5m',  label: '5P' },
  { key: '15m', label: '15P' },
  { key: '1h',  label: '1G' },
  { key: '4h',  label: '4G' },
  { key: '1d',  label: '1N' },
];

// ── Custom tooltip ─────────────────────────────────────────────────────────────

interface TooltipPayload { value: number; payload: { time: string; open: number; high: number; low: number; close: number; volume: number } }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isUp = d.close >= d.open;
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--cr-surface)', border: '1px solid var(--cr-border)' }}>
      <p className="font-bold mb-1" style={{ color: 'var(--cr-muted)' }}>{d.time}</p>
      <p>Mở: <strong style={{ color: 'var(--cr-text)' }}>${d.open.toFixed(4)}</strong></p>
      <p>Cao: <strong style={{ color: 'var(--cr-green)' }}>${d.high.toFixed(4)}</strong></p>
      <p>Thấp: <strong style={{ color: 'var(--cr-red)' }}>${d.low.toFixed(4)}</strong></p>
      <p>Đóng: <strong style={{ color: isUp ? 'var(--cr-green)' : 'var(--cr-red)' }}>${d.close.toFixed(4)}</strong></p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PairDetail() {
  const { symbol = '' } = useParams<{ symbol: string }>();
  const nav = useNavigate();

  const [interval, setInterval] = useState<Interval>('1h');

  const { data: pair, isLoading: loadingPair, refetch } = usePairDetail(symbol);
  const { data: history = [], isLoading: loadingChart }  = usePriceHistory(symbol, interval, 120);
  const { data: watchlists = [] }                         = useWatchlists();
  const addToWatchlist     = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  // Check if this pair is in any watchlist
  const firstList    = watchlists[0] ?? null;
  const watchItem    = firstList?.items.find(i => i.symbol.code === symbol);
  const isWatched    = !!watchItem;

  const handleToggleWatch = async () => {
    if (!firstList) { toast.error('Tạo danh sách theo dõi trước'); return; }
    try {
      if (isWatched) {
        await removeFromWatchlist.mutateAsync({ watchlistId: firstList.id, symbolId: watchItem!.symbolId });
        toast.success('Đã bỏ theo dõi');
      } else {
        await addToWatchlist.mutateAsync({ watchlistId: firstList.id, symbolCode: symbol });
        toast.success('Đã thêm vào theo dõi');
      }
    } catch { toast.error('Thao tác thất bại'); }
  };

  const change = pair?.priceChange ?? 0;
  const price  = pair?.lastPrice ?? 0;
  const isUp   = change >= 0;

  // Chart data: use close price for area chart
  const chartData = history.map(c => ({
    time:   new Date(c.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    open:   Number(c.open),
    high:   Number(c.high),
    low:    Number(c.low),
    close:  Number(c.close),
    volume: Number(c.volume),
  }));

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--cr-surface)', borderBottom: '1px solid var(--cr-border)' }}>
        <button onClick={() => nav(-1)} className="p-1.5 rounded-lg" style={{ color: 'var(--cr-muted)' }}>
          <ArrowLeft size={20} />
        </button>
        <span className="font-bold" style={{ color: 'var(--cr-text)' }}>{symbol}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="p-1.5 rounded-lg" style={{ color: 'var(--cr-muted)' }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={handleToggleWatch} className="p-1.5 rounded-lg" style={{ color: isWatched ? 'var(--cr-gold)' : 'var(--cr-muted)' }}>
            <Star size={18} fill={isWatched ? 'var(--cr-gold)' : 'none'} />
          </button>
        </div>
      </div>

      {loadingPair ? (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--cr-muted)' }}>Đang tải...</div>
      ) : pair ? (
        <>
          {/* Price section */}
          <div className="px-4 pt-4 pb-3">
            <p className="text-3xl font-black" style={{ color: 'var(--cr-text)' }}>
              ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 6 : 2 })}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-semibold px-2 py-0.5 rounded-full"
                style={{ background: isUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: isUp ? 'var(--cr-green)' : 'var(--cr-red)' }}>
                {isUp ? '+' : ''}{change.toFixed(2)}% (24h)
              </span>
              {pair.volume && (
                <span className="text-xs" style={{ color: 'var(--cr-muted)' }}>
                  Vol: {Number(pair.volume).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
          </div>

          {/* High/Low row */}
          {(pair.high24h || pair.low24h) && (
            <div className="flex gap-4 px-4 pb-3">
              <div>
                <p className="text-xs" style={{ color: 'var(--cr-muted)' }}>Cao nhất 24h</p>
                <p className="text-sm font-bold" style={{ color: 'var(--cr-green)' }}>
                  ${Number(pair.high24h ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--cr-muted)' }}>Thấp nhất 24h</p>
                <p className="text-sm font-bold" style={{ color: 'var(--cr-red)' }}>
                  ${Number(pair.low24h ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}

          {/* Interval selector */}
          <div className="flex gap-1 px-4 mb-2">
            {INTERVALS.map(i => (
              <button
                key={i.key}
                onClick={() => setInterval(i.key)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: interval === i.key ? 'var(--cr-primary)' : 'var(--cr-surface)',
                  color:      interval === i.key ? '#fff' : 'var(--cr-muted)',
                  border: '1px solid var(--cr-border)',
                }}
              >
                {i.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="px-2 pb-2" style={{ height: 240 }}>
            {loadingChart ? (
              <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--cr-muted)' }}>Đang tải biểu đồ...</div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--cr-muted)' }}>Chưa có dữ liệu biểu đồ</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cr-border)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--cr-muted)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: 'var(--cr-muted)' }} tickLine={false} axisLine={false} width={55}
                    tickFormatter={v => `$${v < 1 ? v.toFixed(4) : v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="close"
                    stroke={isUp ? 'var(--cr-green)' : 'var(--cr-red)'}
                    strokeWidth={2}
                    fill="url(#priceGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: isUp ? 'var(--cr-green)' : 'var(--cr-red)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pair info */}
          <div className="mx-4 mt-2 rounded-xl p-4" style={{ background: 'var(--cr-surface)', border: '1px solid var(--cr-border)' }}>
            <p className="text-sm font-bold mb-3" style={{ color: 'var(--cr-text)' }}>Thông tin cặp</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs" style={{ color: 'var(--cr-muted)' }}>Tài sản cơ sở</p>
                <p className="font-semibold mt-0.5" style={{ color: 'var(--cr-text)' }}>{pair.baseAsset}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--cr-muted)' }}>Tài sản báo giá</p>
                <p className="font-semibold mt-0.5" style={{ color: 'var(--cr-text)' }}>{pair.quoteAsset}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--cr-muted)' }}>KL giao dịch tối thiểu</p>
                <p className="font-semibold mt-0.5" style={{ color: 'var(--cr-text)' }}>{pair.minQty}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--cr-muted)' }}>KL giao dịch tối đa</p>
                <p className="font-semibold mt-0.5" style={{ color: 'var(--cr-text)' }}>{pair.maxQty}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--cr-muted)' }}>Trạng thái</p>
                <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
                  style={{ background: pair.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: pair.status === 'active' ? 'var(--cr-green)' : 'var(--cr-red)' }}>
                  {pair.status === 'active' ? 'Đang giao dịch' : 'Tạm dừng'}
                </span>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--cr-muted)' }}>Thị trường</p>
                <p className="font-semibold mt-0.5 capitalize" style={{ color: 'var(--cr-text)' }}>{pair.market?.name ?? pair.market?.code ?? '—'}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--cr-muted)' }}>Không tìm thấy cặp "{symbol}"</div>
      )}
    </div>
  );
}
