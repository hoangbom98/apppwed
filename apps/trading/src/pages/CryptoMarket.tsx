import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Search, RefreshCw,
  BarChart2, Activity, DollarSign,
} from 'lucide-react';
import { getPairs } from '@/api/trade';
import { useCryptoStore } from '@/store/cryptoStore';
import { fmt, fmtPct, fmtVol } from '@/utils/formatters';
import type { TradePair } from '@/types';

const TABS = ['Tất cả', 'USDT', 'BTC', 'ETH'] as const;
type Tab = typeof TABS[number];

export default function CryptoMarket() {
  const nav = useNavigate();
  const [tab, setTab]       = useState<Tab>('Tất cả');
  const [search, setSearch] = useState('');
  const { setPairs } = useCryptoStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['crypto', 'pairs'],
    queryFn:  () => getPairs(),
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (data?.data) setPairs(data.data);
  }, [data, setPairs]);

  const pairs: TradePair[] = data?.data ?? [];

  const filtered = useMemo(() => {
    return pairs.filter((p) => {
      const matchTab =
        tab === 'Tất cả' ? true : p.symbol.endsWith(`/${tab}`);
      const s = search.toLowerCase();
      const matchSearch = !s ||
        p.symbol.toLowerCase().includes(s) ||
        p.baseAsset.toLowerCase().includes(s);
      return matchTab && matchSearch;
    });
  }, [pairs, tab, search]);

  // Market summary stats
  const gainers   = pairs.filter(p => p.priceChange >= 0).length;
  const losers    = pairs.length - gainers;
  const topGainer = [...pairs].sort((a, b) => b.priceChange - a.priceChange)[0];

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--bn-text-primary)' }}>
            <BarChart2 size={20} style={{ color: 'var(--bn-primary)' }} />
            Thị trường
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--bn-text-secondary)' }}>
            Dữ liệu realtime · Cập nhật mỗi 10 giây
          </p>
        </div>
        <button onClick={() => refetch()} title="Làm mới"
          className="p-2 rounded-xl transition-colors" style={{ color: 'var(--bn-text-secondary)' }}>
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tăng giá',  value: String(gainers),      icon: TrendingUp,   color: 'var(--bn-green)' },
          { label: 'Giảm giá',  value: String(losers),       icon: TrendingDown, color: 'var(--bn-red)' },
          { label: 'Tổng cặp',  value: String(pairs.length), icon: Activity,     color: 'var(--bn-primary)' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-3"
            style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon size={12} style={{ color: s.color }} />
              <p className="text-[10px]" style={{ color: 'var(--bn-text-secondary)' }}>{s.label}</p>
            </div>
            <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Top mover */}
      {topGainer && (
        <div className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
          <div className="flex items-center gap-2">
            <DollarSign size={14} style={{ color: 'var(--bn-primary)' }} />
            <span className="text-xs" style={{ color: 'var(--bn-text-secondary)' }}>Top tăng hôm nay</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold" style={{ color: 'var(--bn-text-primary)' }}>{topGainer.symbol}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
              style={{ background: 'var(--bn-green-muted)', color: 'var(--bn-green)' }}>
              +{fmtPct(topGainer.priceChange)}
            </span>
          </div>
        </div>
      )}

      {/* Search + Tabs + Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
        {/* Search */}
        <div className="p-4" style={{ borderBottom: '1px solid var(--bn-border)' }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--bn-text-secondary)' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm BTC, ETH, ..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)', color: 'var(--bn-text-primary)' }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid var(--bn-border)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors"
              style={tab === t
                ? { color: 'var(--bn-primary)', borderBottom: '2px solid var(--bn-primary)' }
                : { color: 'var(--bn-text-secondary)' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase"
                style={{ color: 'var(--bn-text-secondary)', borderBottom: '1px solid var(--bn-border)' }}>
                <th className="py-3 pl-4 text-left">Cặp</th>
                <th className="py-3 text-right">Giá</th>
                <th className="py-3 text-right">24h %</th>
                <th className="py-3 text-right hidden sm:table-cell">KL 24h</th>
                <th className="py-3 pr-4 text-right hidden md:table-cell">Cao / Thấp</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-16 text-center text-sm"
                  style={{ color: 'var(--bn-text-secondary)' }}>Đang tải dữ liệu...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-sm"
                  style={{ color: 'var(--bn-text-secondary)' }}>Không tìm thấy cặp giao dịch</td></tr>
              ) : filtered.map((pair, idx) => {
                const isUp = pair.priceChange >= 0;
                const colors = [
                  'from-orange-500 to-orange-700', 'from-blue-500 to-indigo-700',
                  'from-violet-500 to-purple-700', 'from-yellow-500 to-amber-700',
                  'from-green-500 to-emerald-700',
                ];
                return (
                  <tr key={pair.symbol}
                    onClick={() => nav(`/crypto/chart/${pair.symbol}`)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--bn-border)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bn-bg-elevated)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <td className="py-3.5 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-br ${colors[idx % 5]}`}>
                          {pair.baseAsset.slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--bn-text-primary)' }}>{pair.symbol}</p>
                          <p className="text-[10px]" style={{ color: 'var(--bn-text-secondary)' }}>{pair.baseAsset}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-right font-bold font-mono"
                      style={{ color: isUp ? 'var(--bn-green)' : 'var(--bn-red)' }}>
                      {pair.lastPrice < 1 ? fmt(pair.lastPrice, 4) : fmt(pair.lastPrice, 2)}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-semibold"
                        style={isUp
                          ? { background: 'var(--bn-green-muted)', color: 'var(--bn-green)' }
                          : { background: 'var(--bn-red-muted)',   color: 'var(--bn-red)' }}>
                        {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {fmtPct(pair.priceChange)}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right text-xs hidden sm:table-cell"
                      style={{ color: 'var(--bn-text-secondary)' }}>
                      {fmtVol(pair.volume24h)}
                    </td>
                    <td className="py-3.5 pr-4 text-right hidden md:table-cell">
                      <p className="text-[11px]" style={{ color: 'var(--bn-green)' }}>{fmt(pair.high24h, 2)}</p>
                      <p className="text-[11px]" style={{ color: 'var(--bn-red)' }}>{fmt(pair.low24h, 2)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
