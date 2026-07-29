import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { usePairs, type TradingPair } from '../hooks/useCrypto';

// ── Sub-components ────────────────────────────────────────────────────────────

function PairRow({ pair, onClick }: { pair: TradingPair; onClick: () => void }) {
  const change = pair.priceChange ?? 0;
  const isUp   = change >= 0;
  const price  = pair.lastPrice ?? 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 transition-all active:opacity-70"
      style={{ borderBottom: '1px solid var(--cr-border)' }}
    >
      {/* Left: symbol info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
          style={{ background: 'var(--cr-surface-2)', color: 'var(--cr-primary)', border: '1px solid var(--cr-border)' }}>
          {pair.baseAsset.slice(0, 2)}
        </div>
        <div className="text-left">
          <p className="text-sm font-bold" style={{ color: 'var(--cr-text)' }}>{pair.baseAsset}/{pair.quoteAsset}</p>
          <p className="text-xs" style={{ color: 'var(--cr-muted)' }}>{pair.name}</p>
        </div>
      </div>

      {/* Right: price & change */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: 'var(--cr-text)' }}>
            ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 6 : 2 })}
          </p>
          <p className="text-xs font-semibold" style={{ color: isUp ? 'var(--cr-green)' : 'var(--cr-red)' }}>
            {isUp ? '+' : ''}{change.toFixed(2)}%
          </p>
        </div>
        <div className="flex items-center" style={{ color: isUp ? 'var(--cr-green)' : 'var(--cr-red)' }}>
          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        </div>
        <ChevronRight size={14} color="var(--cr-muted)" />
      </div>
    </button>
  );
}

function MarketSummary({ pairs }: { pairs: TradingPair[] }) {
  const gainers = pairs.filter(p => (p.priceChange ?? 0) > 0).length;
  const losers  = pairs.filter(p => (p.priceChange ?? 0) < 0).length;
  const top = [...pairs].sort((a, b) => Math.abs(b.priceChange ?? 0) - Math.abs(a.priceChange ?? 0)).slice(0, 1)[0];

  return (
    <div className="mx-4 mt-4 rounded-xl p-4" style={{ background: 'var(--cr-card-bg)' }}>
      <p className="text-white/70 text-xs mb-3">Tổng quan thị trường</p>
      <div className="flex gap-4 text-sm">
        <div>
          <p className="text-white/60 text-xs">Tăng giá</p>
          <p className="font-bold text-green-300">{gainers}</p>
        </div>
        <div>
          <p className="text-white/60 text-xs">Giảm giá</p>
          <p className="font-bold text-red-300">{losers}</p>
        </div>
        <div>
          <p className="text-white/60 text-xs">Tổng cặp</p>
          <p className="font-bold text-white">{pairs.length}</p>
        </div>
        {top && (
          <div className="ml-auto text-right">
            <p className="text-white/60 text-xs">Biến động nhất</p>
            <p className="font-bold text-yellow-300">{top.baseAsset} {(top.priceChange ?? 0) >= 0 ? '+' : ''}{(top.priceChange ?? 0).toFixed(2)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type TabType = 'all' | 'spot' | 'futures';

export default function Market() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<TabType>('all');

  const { data: pairs = [], isLoading } = usePairs();

  const filtered = useMemo(() => {
    let list = pairs;
    if (tab === 'spot')    list = list.filter(p => p.market?.type === 'spot');
    if (tab === 'futures') list = list.filter(p => p.market?.type === 'futures');
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(p =>
        p.code.toLowerCase().includes(s) ||
        p.baseAsset.toLowerCase().includes(s) ||
        p.name.toLowerCase().includes(s)
      );
    }
    return list;
  }, [pairs, q, tab]);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all',     label: 'Tất cả' },
    { key: 'spot',    label: 'Spot' },
    { key: 'futures', label: 'Futures' },
  ];

  return (
    <div>
      {/* Summary card */}
      {pairs.length > 0 && <MarketSummary pairs={pairs} />}

      {/* Search */}
      <div className="px-4 mt-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--cr-muted)" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Tìm kiếm BTC, ETH, ..."
            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--cr-surface)', border: '1px solid var(--cr-border)', color: 'var(--cr-text)' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mt-3">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: tab === t.key ? 'var(--cr-primary)' : 'var(--cr-surface)',
              color:      tab === t.key ? '#fff' : 'var(--cr-muted)',
              border: '1px solid var(--cr-border)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-3" style={{ background: 'var(--cr-surface)', border: '1px solid var(--cr-border)', borderRadius: 12, margin: '12px 16px 0' }}>
        {isLoading ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--cr-muted)' }}>Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--cr-muted)' }}>Không tìm thấy cặp giao dịch nào</div>
        ) : (
          filtered.map(pair => (
            <PairRow
              key={pair.id}
              pair={pair}
              onClick={() => nav(`/chart/${pair.code}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
