import { useQuery } from '@tanstack/react-query';
import { getWallet, getOrders } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { useTradeStore } from '@/store/tradeStore';
import { fmt, fmtPct } from '@/utils/formatters';
import { TrendingUp, TrendingDown, BarChart3, Wallet, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_POSITIONS = [
  { symbol:'BTC/USDT', baseAsset:'BTC', quoteAsset:'USDT', qty:0.058, avgPrice:41200, currentPrice:43250, pnl:118.90, pnlPct:4.98,  value:2508.50, color:'from-orange-500 to-orange-700' },
  { symbol:'ETH/USDT', baseAsset:'ETH', quoteAsset:'USDT', qty:1.245, avgPrice:2310,  currentPrice:2285,  pnl:-31.13, pnlPct:-1.08, value:2845.13, color:'from-blue-500 to-indigo-700' },
  { symbol:'SOL/USDT', baseAsset:'SOL', quoteAsset:'USDT', qty:25,    avgPrice:92.30, currentPrice:98.45, pnl:153.75, pnlPct:6.66,  value:2461.25, color:'from-purple-500 to-pink-700' },
  { symbol:'BNB/USDT', baseAsset:'BNB', quoteAsset:'USDT', qty:3,     avgPrice:320,   currentPrice:315.8, pnl:-12.6,  pnlPct:-1.31, value:947.40,  color:'from-yellow-500 to-amber-700' },
];

export default function PortfolioPage() {
  const { user }    = useAuthStore();
  const { pairs }   = useTradeStore();

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn:  () => getWallet(),
    enabled:  !!user,
  });
  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'open'],
    queryFn:  () => getOrders({ status: 'open' }),
    enabled:  !!user,
  });

  const positions  = MOCK_POSITIONS;
  const openOrders = ordersData?.data?.length ?? 3;

  const totalValue = positions.reduce((s, p) => s + p.value, 0) + 3820.50;
  const totalPnl   = positions.reduce((s, p) => s + p.pnl, 0);
  const pnlPct     = (totalPnl / (totalValue - totalPnl)) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Portfolio summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600/20 via-blue-600/10 to-cyan-600/20 border border-indigo-500/20 rounded-2xl p-6">
          <p className="text-xs text-gray-400 mb-1">Tổng danh mục</p>
          <p className="text-4xl font-black text-white">{fmt(totalValue, 2)} <span className="text-xl text-gray-400">USDT</span></p>
          <div className={`flex items-center gap-2 mt-2 ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="text-sm font-semibold">
              {totalPnl >= 0 ? '+' : ''}{fmt(totalPnl, 2)} USDT ({fmtPct(pnlPct)}) hôm nay
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={14} className="text-blue-400" />
              <p className="text-xs text-gray-500">Khả dụng</p>
            </div>
            <p className="font-bold text-white">3,820.50 USDT</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={14} className="text-orange-400" />
              <p className="text-xs text-gray-500">Lệnh đang mở</p>
            </div>
            <p className="font-bold text-white">{openOrders} lệnh</p>
          </div>
        </div>
      </div>

      {/* Allocation chart (CSS-based) */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-bold text-white mb-4">Phân bổ tài sản</h2>
        <div className="flex h-4 rounded-full overflow-hidden mb-3">
          {positions.map((p, i) => {
            const pct = (p.value / positions.reduce((s, x) => s + x.value, 0)) * 100;
            return <div key={i} className={`bg-gradient-to-r ${p.color}`} style={{ width: `${pct}%` }} />;
          })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {positions.map(p => {
            const pct = (p.value / positions.reduce((s, x) => s + x.value, 0)) * 100;
            return (
              <div key={p.symbol} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${p.color} flex-shrink-0`} />
                <div>
                  <p className="text-xs font-semibold text-white">{p.baseAsset}</p>
                  <p className="text-[10px] text-gray-500">{pct.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Positions list */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-white">Vị thế đang nắm giữ</h2>
          <Link to="/orders" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Lịch sử <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase border-b border-gray-800">
                <th className="py-3 pl-5 text-left">Tài sản</th>
                <th className="py-3 px-3 text-right">Số lượng</th>
                <th className="py-3 px-3 text-right">Giá TB</th>
                <th className="py-3 px-3 text-right">Giá hiện tại</th>
                <th className="py-3 px-3 text-right">Giá trị</th>
                <th className="py-3 pr-5 text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {positions.map(p => {
                const isUp = p.pnl >= 0;
                return (
                  <tr key={p.symbol} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 pl-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center text-[11px] font-black text-white`}>
                          {p.baseAsset.slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{p.symbol}</p>
                          <p className="text-[10px] text-gray-500">{p.baseAsset}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <p className="font-mono text-white text-xs">{p.qty}</p>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <p className="text-gray-300 text-xs">{fmt(p.avgPrice, 2)}</p>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <p className={`font-semibold text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {fmt(p.currentPrice, 2)}
                      </p>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <p className="font-bold text-white text-xs">{fmt(p.value, 2)}</p>
                    </td>
                    <td className="py-4 pr-5 text-right">
                      <p className={`font-bold text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {isUp ? '+' : ''}{fmt(p.pnl, 2)}
                      </p>
                      <p className={`text-[10px] ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                        {fmtPct(p.pnlPct)}
                      </p>
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
