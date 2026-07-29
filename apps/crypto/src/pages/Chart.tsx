import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, ChevronRight } from 'lucide-react';
import { usePairs } from '../hooks/useCrypto';

/** Trang /chart — chọn symbol để xem biểu đồ chi tiết */
export default function Chart() {
  const nav = useNavigate();
  const [q, setQ]  = useState('');
  const { data: pairs = [], isLoading } = usePairs();

  const filtered = pairs.filter(p => {
    const s = q.toLowerCase();
    return !s || p.code.toLowerCase().includes(s) || p.baseAsset.toLowerCase().includes(s);
  });

  return (
    <div className="px-4 pt-4">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={20} color="var(--cr-primary)" />
        <h2 className="font-bold text-base" style={{ color: 'var(--cr-text)' }}>Biểu đồ giá</h2>
      </div>

      {/* Search */}
      <input
        value={q} onChange={e => setQ(e.target.value)}
        placeholder="Chọn cặp giao dịch..."
        className="w-full py-3 px-4 rounded-xl text-sm outline-none mb-4"
        style={{ background: 'var(--cr-surface)', border: '1px solid var(--cr-border)', color: 'var(--cr-text)' }}
      />

      {/* Pair list */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--cr-surface)', border: '1px solid var(--cr-border)' }}>
        {isLoading ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--cr-muted)' }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--cr-muted)' }}>Không có kết quả</div>
        ) : (
          filtered.slice(0, 50).map(pair => {
            const change = pair.priceChange ?? 0;
            const price  = pair.lastPrice ?? 0;
            return (
              <button
                key={pair.id}
                onClick={() => nav(`/chart/${pair.code}`)}
                className="w-full flex items-center justify-between px-4 py-3 transition-all active:opacity-70"
                style={{ borderBottom: '1px solid var(--cr-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: 'var(--cr-surface-2)', color: 'var(--cr-primary)', border: '1px solid var(--cr-border)' }}>
                    {pair.baseAsset.slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold" style={{ color: 'var(--cr-text)' }}>{pair.baseAsset}/{pair.quoteAsset}</p>
                    <p className="text-xs" style={{ color: 'var(--cr-muted)' }}>{pair.market?.type ?? 'spot'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: 'var(--cr-text)' }}>
                      ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 6 : 2 })}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: change >= 0 ? 'var(--cr-green)' : 'var(--cr-red)' }}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </p>
                  </div>
                  <ChevronRight size={14} color="var(--cr-muted)" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
