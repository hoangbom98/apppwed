import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Search, Star, RefreshCw,
  BarChart2, DollarSign, Activity,
} from 'lucide-react';
import { getPairs } from '@/api/trade';
import { useTradeStore } from '@/store/tradeStore';
import { fmt, fmtPct, fmtVol } from '@/utils/formatters';
import OrderPanel from '@/components/trade/OrderPanel';
import { MOCK_PAIRS } from '@/constants/mock';
import type { TradePair } from '@/types';

const TABS = ['Tất cả', 'USDT', 'BTC', 'ETH', 'Yêu thích'] as const;
type Tab = typeof TABS[number];

export default function MarketPage() {
  const [tab, setTab]       = useState<Tab>('Tất cả');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['BTC/USDT', 'ETH/USDT']);
  const [showOrder, setShowOrder] = useState(false);
  const { selectedPair, selectPair, setPairs } = useTradeStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pairs'],
    queryFn: () => getPairs(),
    refetchInterval: 5000,
  });

  // Sync pairs to store when data changes
  useEffect(() => {
    if (data?.data) setPairs(data.data);
  }, [data]);

  const pairs: TradePair[] = data?.data ?? MOCK_PAIRS;

  const filtered = pairs.filter((p) => {
    const matchTab =
      tab === 'Tất cả'    ? true :
      tab === 'Yêu thích' ? favorites.includes(p.symbol) :
      p.symbol.endsWith(`/${tab}`);
    const matchSearch = p.symbol.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const toggleFav = (symbol: string) =>
    setFavorites((f) => f.includes(symbol) ? f.filter((s) => s !== symbol) : [...f, symbol]);

  const handleSelectPair = (pair: TradePair) => {
    selectPair(pair);
    setShowOrder(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 size={20} className="text-blue-400" />
            Thị trường
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Dữ liệu realtime · Cập nhật mỗi 5 giây</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Làm mới"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng vốn hóa',     value: '$1.72T', change: '+1.8%', up: true,  icon: DollarSign },
          { label: 'KL giao dịch 24h',  value: '$68.4B', change: '+5.2%', up: true,  icon: Activity },
          { label: 'Dominance BTC',     value: '52.3%',  change: '-0.3%', up: false, icon: TrendingUp },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon size={12} style={{ color: 'var(--bn-text-secondary)' }} />
              <p className="text-[10px]" style={{ color: 'var(--bn-text-secondary)' }}>{s.label}</p>
            </div>
            <p className="font-bold text-white text-sm">{s.value}</p>
            <p className="text-[10px] mt-0.5 flex items-center gap-0.5"
              style={{ color: s.up ? 'var(--bn-green)' : 'var(--bn-red)' }}>
              {s.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              {s.change}
            </p>
          </div>
        ))}
      </div>

      {/* Search + Tabs */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
        <div className="p-4 flex gap-3" style={{ borderBottom: '1px solid var(--bn-border)' }}>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--bn-text-secondary)' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm cặp giao dịch..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
              style={{ background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)' }}
            />
          </div>
        </div>

        <div className="flex" style={{ borderBottom: '1px solid var(--bn-border)' }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              style={tab === t
                ? { color: 'var(--bn-yellow)', borderBottom: '2px solid var(--bn-yellow)' }
                : { color: 'var(--bn-text-secondary)' }}
            >
              {t === 'Yêu thích' ? <Star size={11} fill={tab === t ? 'currentColor' : 'none'} /> : null}
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase" style={{ color: 'var(--bn-text-secondary)' }}>
                <th className="py-3 pl-4 text-left w-8"></th>
                <th className="py-3 text-left">Cặp</th>
                <th className="py-3 text-right">Giá</th>
                <th className="py-3 text-right">24h%</th>
                <th className="py-3 text-right hidden sm:table-cell">KL 24h</th>
                <th className="py-3 pr-4 text-right hidden md:table-cell">Cao / Thấp</th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid var(--bn-border)' }}>
              {filtered.map((pair, idx) => {
                const isUp = pair.priceChange >= 0;
                const isFav = favorites.includes(pair.symbol);
                return (
                  <tr
                    key={pair.symbol}
                    onClick={() => handleSelectPair(pair)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid rgba(var(--bn-border-rgb, 30,35,41),0.5)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bn-bg-elevated)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td className="py-3.5 pl-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFav(pair.symbol); }}
                        className={`transition-colors ${isFav ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                        title={isFav ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
                      >
                        <Star size={13} fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-br ${
                          idx % 5 === 0 ? 'from-orange-500 to-orange-700' :
                          idx % 5 === 1 ? 'from-blue-500 to-indigo-700' :
                          idx % 5 === 2 ? 'from-yellow-500 to-amber-700' :
                          idx % 5 === 3 ? 'from-purple-500 to-pink-700' :
                          'from-green-500 to-emerald-700'
                        }`}>
                          {pair.baseAsset.slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{pair.symbol}</p>
                          <p className="text-[10px] text-gray-500">{pair.baseAsset}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <p className="font-bold" style={{ color: isUp ? 'var(--bn-green)' : 'var(--bn-red)' }}>
                        {pair.lastPrice < 1 ? fmt(pair.lastPrice, 4) : fmt(pair.lastPrice, 2)}
                      </p>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-semibold"
                        style={isUp
                          ? { background: 'rgba(14,203,129,0.12)', color: 'var(--bn-green)' }
                          : { background: 'rgba(246,70,93,0.12)',  color: 'var(--bn-red)'   }}>
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {fmtPct(pair.priceChange)}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right hidden sm:table-cell">
                      <p className="text-xs" style={{ color: 'var(--bn-text-secondary)' }}>{fmtVol(pair.volume24h)}</p>
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
          {filtered.length === 0 && (
            <div className="py-16 text-center" style={{ color: 'var(--bn-text-secondary)' }}>
              <BarChart2 size={36} className="mx-auto mb-3" style={{ opacity: 0.3 }} />
              <p>Không tìm thấy cặp giao dịch</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Panel Drawer */}
      {showOrder && selectedPair && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowOrder(false)}
        >
          <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <OrderPanel pair={selectedPair} onClose={() => setShowOrder(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
