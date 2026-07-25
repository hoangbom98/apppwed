import { useQuery } from '@tanstack/react-query';
import { getPortfolio } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt, fmtPct } from '@/utils/formatters';
import { TrendingUp, TrendingDown, BarChart3, Wallet, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const COIN_COLORS = [
  'from-orange-500 to-orange-700',
  'from-blue-500 to-indigo-700',
  'from-purple-500 to-pink-700',
  'from-yellow-500 to-amber-700',
  'from-green-500 to-emerald-700',
];

export default function PortfolioPage() {
  const { user } = useAuthStore();

  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn:  () => getPortfolio(),
    enabled:  !!user,
    refetchInterval: 10_000,
  });

  const portfolio = portfolioData?.data ?? null;

  // Portfolio endpoint returns: balance, frozen, openPositions (count), openOrders (count),
  // unrealisedPnl, totalTxns, positions (array), orders (array)
  const balance        = parseFloat(String(portfolio?.balance ?? 0));
  const frozen         = parseFloat(String(portfolio?.frozen  ?? 0));
  const unrealisedPnl  = parseFloat(String(portfolio?.unrealisedPnl ?? 0));
  const openPositions  = portfolio?.positions ?? [];
  const openOrdersCount: number = portfolio?.openOrders ?? 0;

  const _totalValue = balance + Math.abs(unrealisedPnl);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Chưa đăng nhập</h2>
        <p className="text-sm bn-muted mb-6">Đăng nhập để xem danh mục đầu tư</p>
        <Link to="/login" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">Đăng nhập</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin bn-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Portfolio summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600/20 via-blue-600/10 to-cyan-600/20 border border-indigo-500/20 rounded-2xl p-6">
          <p className="text-xs bn-muted mb-1">Tổng tài sản</p>
          <p className="text-4xl font-black text-white">{fmt(balance, 2)} <span className="text-xl text-gray-400">USD</span></p>
          {frozen > 0 && (
            <p className="text-xs text-yellow-400 mt-1">{fmt(frozen, 2)} USD đang khóa trong lệnh</p>
          )}
          {unrealisedPnl !== 0 && (
            <div className={`flex items-center gap-2 mt-2 ${unrealisedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {unrealisedPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="text-sm font-semibold">
                P&L chưa thực hiện: {unrealisedPnl >= 0 ? '+' : ''}{fmt(unrealisedPnl, 2)} USD
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bn-surface rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={14} className="text-blue-400" />
              <p className="text-xs bn-muted">Khả dụng</p>
            </div>
            <p className="font-bold text-white">{fmt(balance - frozen, 2)} USD</p>
          </div>
          <div className="bn-surface rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={14} className="text-orange-400" />
              <p className="text-xs bn-muted">Lệnh đang mở</p>
            </div>
            <p className="font-bold text-white">{openOrdersCount} lệnh</p>
          </div>
        </div>
      </div>

      {/* Open positions */}
      <div className="bn-surface rounded-2xl overflow-hidden">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--bn-border)' }}>
          <h2 className="font-bold text-white">Vị thế đang mở ({openPositions.length})</h2>
          <Link to="/orders" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Lịch sử <ArrowRight size={12} />
          </Link>
        </div>

        {openPositions.length === 0 ? (
          <div className="py-16 text-center bn-muted">
            <p className="text-sm text-gray-500">Không có vị thế nào</p>
            <p>Không có vị thế nào đang mở</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] bn-muted uppercase" style={{ borderBottom: '1px solid var(--bn-border)' }}>
                  <th className="py-3 pl-5 text-left">Tài sản</th>
                  <th className="py-3 px-3 text-center">Hướng</th>
                  <th className="py-3 px-3 text-right">Số lượng</th>
                  <th className="py-3 px-3 text-right">Giá vào</th>
                  <th className="py-3 px-3 text-right">Giá hiện tại</th>
                  <th className="py-3 pr-5 text-right">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--bn-border)' }}>
                {openPositions.map((p: any, idx: number) => {
                  const pnl   = parseFloat(p.pnl ?? 0);
                  const isUp  = pnl >= 0;
                  const color = COIN_COLORS[idx % COIN_COLORS.length];
                  const sym   = p.symbol?.code ?? p.symbolId ?? '—';
                  const base  = p.symbol?.baseAsset ?? sym.split('/')[0] ?? sym.slice(0, 3);
                  return (
                    <tr key={p.id} className="transition-colors" style={{ background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bn-bg-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td className="py-4 pl-5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-[11px] font-black text-white`}>
                            {base.slice(0, 3)}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{sym}</p>
                            <p className="text-[10px] bn-muted">{p.side === 'long' ? 'Long' : 'Short'} × {p.leverage ?? 1}x</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${
                          p.side === 'long' ? 'bg-green-950/60 text-green-400' : 'bg-red-950/60 text-red-400'
                        }`}>
                          {p.side === 'long' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {p.side === 'long' ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <p className="font-mono text-white text-xs">{p.quantity}</p>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <p className="text-gray-300 text-xs">{fmt(parseFloat(p.entryPrice ?? 0), 2)}</p>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <p className={`font-semibold text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                          {fmt(parseFloat(p.currentPrice ?? 0), 2)}
                        </p>
                      </td>
                      <td className="py-4 pr-5 text-right">
                        <p className={`font-bold text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                          {isUp ? '+' : ''}{fmt(pnl, 2)}
                        </p>
                        <p className={`text-[10px] ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                          {fmtPct(parseFloat(p.pnlPercent ?? 0))}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
