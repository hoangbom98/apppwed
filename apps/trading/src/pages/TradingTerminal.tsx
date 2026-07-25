import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPairs } from '@/api/trade';
import { useTradeStore } from '@/store/tradeStore';
import OrderPanel from '@/components/trade/OrderPanel';
import { fmt, fmtPct } from '@/utils/formatters';
import { MOCK_PAIRS } from '@/constants/mock';
import type { TradePair } from '@/types';
import {
  TrendingUp, TrendingDown, ChevronDown, RefreshCw,
  Activity, BarChart2, BookOpen,
} from 'lucide-react';

// ── Order Book (mock) ──────────────────────────────────────────────────────────
function OrderBook({ pair }: { pair: TradePair }) {
  const asks = [
    { price: pair.lastPrice * 1.0012, qty: 0.842 },
    { price: pair.lastPrice * 1.0008, qty: 1.234 },
    { price: pair.lastPrice * 1.0004, qty: 0.521 },
    { price: pair.lastPrice * 1.0002, qty: 2.100 },
    { price: pair.lastPrice * 1.0001, qty: 0.350 },
  ].reverse();
  const bids = [
    { price: pair.lastPrice * 0.9999, qty: 0.750 },
    { price: pair.lastPrice * 0.9997, qty: 1.540 },
    { price: pair.lastPrice * 0.9993, qty: 0.920 },
    { price: pair.lastPrice * 0.9989, qty: 3.210 },
    { price: pair.lastPrice * 0.9985, qty: 0.440 },
  ];
  const maxQty = Math.max(...asks.map(a => a.qty), ...bids.map(b => b.qty));

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--bn-border)' }}>
        <BookOpen size={14} style={{ color: 'var(--bn-text-secondary)' }} />
        <span className="text-sm font-semibold text-white">Sổ lệnh</span>
      </div>
      <div className="px-3 py-2">
        {/* Header */}
        <div className="flex text-[10px] font-semibold mb-1 px-1" style={{ color: 'var(--bn-text-secondary)' }}>
          <span className="flex-1">Giá</span>
          <span className="flex-1 text-right">Số lượng</span>
          <span className="flex-1 text-right">Tổng</span>
        </div>

        {/* Asks (sells) */}
        <div className="space-y-0.5 mb-1">
          {asks.map((a, i) => {
            const pct = (a.qty / maxQty) * 100;
            return (
              <div key={i} className="relative flex text-xs px-1 py-0.5 rounded overflow-hidden">
                <div className="absolute inset-y-0 right-0" style={{ width: `${pct}%`, background: 'rgba(246,70,93,0.12)' }} />
                <span className="flex-1 font-mono relative z-10" style={{ color: 'var(--bn-red)' }}>{fmt(a.price, 2)}</span>
                <span className="flex-1 text-right relative z-10" style={{ color: 'var(--bn-text-primary)' }}>{a.qty.toFixed(3)}</span>
                <span className="flex-1 text-right relative z-10" style={{ color: 'var(--bn-text-secondary)' }}>{fmt(a.price * a.qty, 0)}</span>
              </div>
            );
          })}
        </div>

        {/* Mid price */}
        <div className="flex items-center gap-2 py-1.5 px-1 my-1 rounded-lg"
          style={{ background: pair.priceChange >= 0 ? 'rgba(14,203,129,0.08)' : 'rgba(246,70,93,0.08)' }}>
          <span className="font-bold text-sm font-mono" style={{ color: pair.priceChange >= 0 ? 'var(--bn-green)' : 'var(--bn-red)' }}>
            {fmt(pair.lastPrice, 2)}
          </span>
          {pair.priceChange >= 0
            ? <TrendingUp size={12} style={{ color: 'var(--bn-green)' }} />
            : <TrendingDown size={12} style={{ color: 'var(--bn-red)' }} />}
        </div>

        {/* Bids (buys) */}
        <div className="space-y-0.5">
          {bids.map((b, i) => {
            const pct = (b.qty / maxQty) * 100;
            return (
              <div key={i} className="relative flex text-xs px-1 py-0.5 rounded overflow-hidden">
                <div className="absolute inset-y-0 right-0" style={{ width: `${pct}%`, background: 'rgba(14,203,129,0.12)' }} />
                <span className="flex-1 font-mono relative z-10" style={{ color: 'var(--bn-green)' }}>{fmt(b.price, 2)}</span>
                <span className="flex-1 text-right relative z-10" style={{ color: 'var(--bn-text-primary)' }}>{b.qty.toFixed(3)}</span>
                <span className="flex-1 text-right relative z-10" style={{ color: 'var(--bn-text-secondary)' }}>{fmt(b.price * b.qty, 0)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Chart Placeholder ──────────────────────────────────────────────────────────
function ChartArea({ pair }: { pair: TradePair }) {
  const isUp = pair.priceChange >= 0;
  // Generate a simple SVG sparkline
  const points = Array.from({ length: 60 }, (_, _i) => {
    const noise = (Math.random() - 0.48) * 0.008;
    return noise;
  }).reduce<number[]>((acc, n, i) => {
    acc.push(i === 0 ? pair.lastPrice * 0.97 : acc[i - 1] * (1 + n));
    return acc;
  }, []);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 600, h = 160;
  const toX = (i: number) => (i / (points.length - 1)) * w;
  const toY = (v: number) => h - ((v - min) / range) * (h - 20) - 10;
  const pathD = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
      {/* Chart header */}
      <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: '1px solid var(--bn-border)' }}>
        <div className="flex items-center gap-3">
          <BarChart2 size={14} style={{ color: 'var(--bn-text-secondary)' }} />
          <span className="font-bold text-white">{pair.symbol}</span>
          <span className="text-lg font-black" style={{ color: isUp ? 'var(--bn-green)' : 'var(--bn-red)' }}>
            {fmt(pair.lastPrice, pair.lastPrice < 1 ? 4 : 2)}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-lg font-semibold"
            style={isUp
              ? { background: 'rgba(14,203,129,0.12)', color: 'var(--bn-green)' }
              : { background: 'rgba(246,70,93,0.12)',  color: 'var(--bn-red)'   }}>
            {isUp ? '+' : ''}{fmtPct(pair.priceChange)}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--bn-text-secondary)' }}>
          <span>H: <b className="text-white">{fmt(pair.high24h, 2)}</b></span>
          <span>L: <b className="text-white">{fmt(pair.low24h, 2)}</b></span>
        </div>
      </div>

      {/* Chart intervals */}
      <div className="flex gap-0.5 px-4 pt-2">
        {['1m','5m','15m','1h','4h','1D','1W'].map((t, i) => (
          <button key={t}
            className="px-2.5 py-1 text-[11px] rounded-lg font-semibold transition-colors"
            style={i === 3
              ? { background: 'var(--bn-yellow)', color: '#0b0e11' }
              : { color: 'var(--bn-text-secondary)' }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* SVG Chart */}
      <div className="px-4 pb-4 pt-2">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-36">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#chartGrad)" />
          <path d={pathD} fill="none" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth="1.5" />
        </svg>
        <p className="text-[10px] text-center text-gray-600 mt-1">Biểu đồ mô phỏng · Tích hợp TradingView trong production</p>
      </div>
    </div>
  );
}

// ── TradingTerminal ────────────────────────────────────────────────────────────
export default function TradingTerminalPage() {
  const { selectedPair, selectPair, setPairs } = useTradeStore();
  const [showPairList, setShowPairList] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pairs'],
    queryFn: () => getPairs(),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (data?.data) setPairs(data.data);
  }, [data]);

  const pairs: TradePair[] = data?.data ?? MOCK_PAIRS;

  // Auto-select first pair if none
  useEffect(() => {
    if (!selectedPair && pairs.length > 0) selectPair(pairs[0]);
  }, [pairs, selectedPair]);

  const pair: TradePair = selectedPair ?? MOCK_PAIRS[0];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Pair selector */}
        <div className="relative">
          <button
            onClick={() => setShowPairList(!showPairList)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}
          >
            <Activity size={15} style={{ color: 'var(--bn-yellow)' }} />
            <span>{pair.symbol}</span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${showPairList ? 'rotate-180' : ''}`} />
          </button>

          {showPairList && (
            <div className="absolute top-full mt-1 left-0 z-50 w-64 rounded-xl shadow-2xl overflow-hidden"
              style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}>
              {pairs.map((p) => {
                const isUp = p.priceChange >= 0;
                return (
                  <button
                    key={p.symbol}
                    onClick={() => { selectPair(p); setShowPairList(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors"
                    style={{ background: p.symbol === pair.symbol ? 'var(--bn-bg-elevated)' : 'transparent' }}
                  >
                    <span className="font-semibold text-white">{p.symbol}</span>
                    <span className="font-mono text-xs" style={{ color: isUp ? 'var(--bn-green)' : 'var(--bn-red)' }}>
                      {fmt(p.lastPrice, p.lastPrice < 1 ? 4 : 2)} ({isUp ? '+' : ''}{fmtPct(p.priceChange)})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={() => refetch()} className="p-2 text-gray-400 hover:text-white">
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Chart + OrderBook */}
        <div className="lg:col-span-2 space-y-4">
          <ChartArea pair={pair} />
          <OrderBook pair={pair} />
        </div>

        {/* Right: Order Panel */}
        <div className="lg:col-span-1">
          <OrderPanel pair={pair} onClose={() => {}} />
        </div>
      </div>
    </div>
  );
}
