import { useQuery } from '@tanstack/react-query';
import { getOrders, cancelOrder } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmtTime, fmt } from '@/utils/formatters';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState } from 'react';

// Backend Order.status: "pending" | "partial" | "filled" | "cancelled" | "expired" | "rejected"
const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  pending:   { label: 'Đang chờ',      icon: Clock,          color: 'text-yellow-400 bg-yellow-950/60 border-yellow-900/50' },
  partial:   { label: 'Khớp một phần', icon: AlertTriangle,  color: 'text-blue-400 bg-blue-950/60 border-blue-900/50' },
  filled:    { label: 'Đã khớp',       icon: CheckCircle,    color: 'text-green-400 bg-green-950/60 border-green-900/50' },
  cancelled: { label: 'Đã hủy',        icon: XCircle,        color: 'text-gray-400 bg-gray-800/60 border-gray-700/50' },
  expired:   { label: 'Hết hạn',       icon: XCircle,        color: 'text-gray-400 bg-gray-800/60 border-gray-700/50' },
  rejected:  { label: 'Bị từ chối',    icon: XCircle,        color: 'text-red-400 bg-red-950/60 border-red-900/50' },
};

const MOCK_ORDERS = [
  { id:1, symbol:'BTC/USDT', side:'buy',  type:'limit',  price:42000, quantity:0.05, filled:0.05, status:'filled',    createdAt: new Date(Date.now()-3600000).toISOString() },
  { id:2, symbol:'ETH/USDT', side:'sell', type:'market', price:2290,  quantity:0.5,  filled:0.5,  status:'filled',    createdAt: new Date(Date.now()-7200000).toISOString() },
  { id:3, symbol:'SOL/USDT', side:'buy',  type:'limit',  price:95,    quantity:10,   filled:0,    status:'open',      createdAt: new Date(Date.now()-1800000).toISOString() },
  { id:4, symbol:'BNB/USDT', side:'buy',  type:'limit',  price:310,   quantity:2,    filled:1,    status:'partial',   createdAt: new Date(Date.now()-900000).toISOString()  },
  { id:5, symbol:'XRP/USDT', side:'sell', type:'market', price:0.62,  quantity:1000, filled:1000, status:'filled',    createdAt: new Date(Date.now()-86400000).toISOString() },
  { id:6, symbol:'ADA/USDT', side:'buy',  type:'stop',   price:0.55,  quantity:500,  filled:0,    status:'cancelled', createdAt: new Date(Date.now()-172800000).toISOString() },
];

// "open" = pending|partial in backend
type FilterStatus = 'all' | 'open' | 'filled' | 'cancelled';

export default function OrderHistoryPage() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [canceling, setCanceling] = useState<string | null>(null);

  // Map UI filter to backend status query param
  const statusParam = filter === 'open' ? undefined : filter === 'all' ? undefined : filter;
  // We need to filter client-side for 'open' = pending|partial
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', filter],
    queryFn:  () => getOrders({}),
    enabled:  !!user,
  });

  const allOrders: any[] = data?.data ?? MOCK_ORDERS;
  const filtered = allOrders.filter((o: any) => {
    if (filter === 'all')       return true;
    if (filter === 'open')      return ['pending', 'partial'].includes(o.status);
    if (filter === 'filled')    return o.status === 'filled';
    if (filter === 'cancelled') return ['cancelled', 'expired', 'rejected'].includes(o.status);
    return true;
  });

  const handleCancel = async (id: string | number) => {
    setCanceling(String(id));
    try {
      await cancelOrder(id);
      refetch();
    } catch { /* ignore */ }
    finally { setCanceling(null); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Lịch sử lệnh</h1>
          <p className="text-xs text-gray-400 mt-0.5">Toàn bộ lệnh giao dịch của bạn</p>
        </div>
        <button onClick={() => refetch()} className="p-2 text-gray-400 hover:text-white">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all','open','filled','cancelled'] as FilterStatus[]).map(s => {
          const openCount = allOrders.filter((o: any) => ['pending','partial'].includes(o.status)).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'Tất cả' : s === 'open' ? 'Đang mở' : s === 'filled' ? 'Đã khớp' : 'Đã hủy'}
              {s === 'open' && openCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-500 text-black rounded-full text-[10px]">
                  {openCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">Không có lệnh nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase border-b border-gray-800">
                  <th className="py-3 pl-5 text-left">Cặp / Loại</th>
                  <th className="py-3 px-3 text-center">Hướng</th>
                  <th className="py-3 px-3 text-right">Giá</th>
                  <th className="py-3 px-3 text-right">KL / Đã khớp</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-3 text-center hidden sm:table-cell">Thời gian</th>
                  <th className="py-3 pr-5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map((order: any) => {
                  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.cancelled;
                  const StatusIcon = cfg.icon;
                  const isUp = order.side === 'buy';
                  return (
                    <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-3.5 pl-5">
                        <p className="font-semibold text-white">{order.symbol}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{order.type}</p>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isUp ? 'bg-green-950/60 text-green-400' : 'bg-red-950/60 text-red-400'
                        }`}>
                          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {isUp ? 'MUA' : 'BÁN'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <p className="font-mono text-white text-xs">
                          {order.price < 1 ? fmt(order.price, 4) : fmt(order.price, 2)}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <p className="text-xs text-white">{order.quantity}</p>
                        <p className="text-[10px] text-gray-500">{order.filled} đã khớp</p>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${cfg.color}`}>
                          <StatusIcon size={10} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center hidden sm:table-cell">
                        <p className="text-[11px] text-gray-500">{fmtTime(order.createdAt)}</p>
                      </td>
                      <td className="py-3.5 pr-5 text-center">
                        {['pending', 'partial'].includes(order.status) ? (
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={canceling === String(order.id)}
                            className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-400 hover:text-white rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            {canceling === String(order.id) ? '...' : 'Hủy'}
                          </button>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
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
