import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInvestmentPackages, buyInvestmentPackage, getInvestmentHistory
} from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt, fmtTime } from '@/utils/formatters';
import {
  TrendingUp, Clock, CheckCircle, XCircle, DollarSign,
  Zap, Star, Award, Crown, Diamond,
} from 'lucide-react';

const PACKAGE_ICONS = [Zap, Star, Award, Crown, Diamond];
const PACKAGE_COLORS = [
  'from-blue-500 to-blue-700',
  'from-gray-400 to-gray-600',
  'from-yellow-400 to-yellow-600',
  'from-purple-400 to-purple-700',
  'from-cyan-400 to-cyan-600',
];

type Tab = 'packages' | 'history';

export default function InvestmentPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab]           = useState<Tab>('packages');
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [amount, setAmount]     = useState('');
  const [msg, setMsg]           = useState('');

  const { data: pkgData, isLoading: pkgLoading } = useQuery({
    queryKey: ['investment-packages'],
    queryFn:  getInvestmentPackages,
  });

  const { data: histData, isLoading: histLoading } = useQuery({
    queryKey: ['investment-history'],
    queryFn:  getInvestmentHistory,
    enabled:  !!user && tab === 'history',
  });

  const buyMutation = useMutation({
    mutationFn: buyInvestmentPackage,
    onSuccess: () => {
      setMsg('✅ Đầu tư thành công!');
      setAmount('');
      setSelectedPkg(null);
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['investment-history'] });
    },
    onError: (e: any) => setMsg(e.response?.data?.message || 'Lỗi đầu tư'),
  });

  const packages  = pkgData?.data  ?? [];
  const history   = histData?.data ?? [];

  const handleBuy = () => {
    if (!user) { setMsg('Vui lòng đăng nhập'); return; }
    if (!selectedPkg || !amount || parseFloat(amount) <= 0) {
      setMsg('Nhập số tiền hợp lệ');
      return;
    }
    setMsg('');
    buyMutation.mutate({ packageId: selectedPkg.id, amount: parseFloat(amount) });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-green-400" />
          Đầu tư sinh lời
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Chọn gói đầu tư phù hợp, nhận lợi nhuận hàng ngày tự động.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['packages', 'history'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t === 'packages' ? 'Gói đầu tư' : 'Lịch sử'}
          </button>
        ))}
      </div>

      {/* Packages Tab */}
      {tab === 'packages' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pkgLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-60 bg-gray-800 rounded-2xl animate-pulse" />
                ))
              : packages.map((pkg: any, idx: number) => {
                  const Icon = PACKAGE_ICONS[idx % PACKAGE_ICONS.length];
                  const grad = PACKAGE_COLORS[idx % PACKAGE_COLORS.length];
                  const isSelected = selectedPkg?.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => { setSelectedPkg(isSelected ? null : pkg); setMsg(''); setAmount(''); }}
                      className={`relative rounded-2xl p-5 cursor-pointer border-2 transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-950/20'
                          : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3`}>
                        <Icon size={22} className="text-white" />
                      </div>

                      <h3 className="font-bold text-white text-base mb-1">{pkg.name}</h3>
                      <p className="text-xs text-gray-400 mb-4 leading-relaxed line-clamp-2">{pkg.description}</p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Lợi nhuận / ngày</span>
                          <span className="text-green-400 font-bold">{parseFloat(pkg.dailyProfit).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Tổng lợi nhuận</span>
                          <span className="text-yellow-400 font-bold">{parseFloat(pkg.totalReturn).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Thời hạn</span>
                          <span className="text-white">{pkg.duration} ngày</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Đầu tư tối thiểu</span>
                          <span className="text-blue-400 font-semibold">{fmt(parseFloat(pkg.minAmount), 0)} USD</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle size={18} className="text-green-400" />
                        </div>
                      )}
                    </div>
                  );
                })
            }
          </div>

          {/* Buy Panel */}
          {selectedPkg && (
            <div className="bg-gray-900 border border-green-800/40 rounded-2xl p-5">
              <h3 className="font-bold text-white text-base mb-4">
                Đầu tư vào: <span className="text-green-400">{selectedPkg.name}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-center">
                {[
                  { label: 'Lợi nhuận/ngày', val: `${parseFloat(selectedPkg.dailyProfit)}%`, color: 'text-green-400' },
                  { label: 'Tổng LN',         val: `${parseFloat(selectedPkg.totalReturn)}%`, color: 'text-yellow-400' },
                  { label: 'Thời hạn',        val: `${selectedPkg.duration} ngày`,           color: 'text-blue-400'   },
                  { label: 'Tối thiểu',       val: `${fmt(parseFloat(selectedPkg.minAmount),0)} USD`, color: 'text-white' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-800 rounded-xl p-3">
                    <p className={`font-bold text-sm ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1 block">Số tiền đầu tư (USD)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder={`Tối thiểu ${fmt(parseFloat(selectedPkg.minAmount), 0)}`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Lợi nhuận dự kiến:
                    <span className="text-green-400 ml-1 font-semibold">
                      +{fmt(parseFloat(amount) * parseFloat(selectedPkg.dailyProfit) / 100, 2)} USD/ngày
                    </span>
                    <span className="text-yellow-400 ml-2">
                      = +{fmt(parseFloat(amount) * parseFloat(selectedPkg.totalReturn) / 100, 2)} USD tổng
                    </span>
                  </p>
                )}
              </div>

              <div className="flex gap-2 mb-4">
                {[parseFloat(selectedPkg.minAmount), parseFloat(selectedPkg.minAmount) * 2, parseFloat(selectedPkg.minAmount) * 5].map(v => (
                  <button key={v} onClick={() => setAmount(String(v))}
                    className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold">
                    {fmt(v, 0)}
                  </button>
                ))}
              </div>

              {msg && (
                <div className={`mb-3 p-3 rounded-xl text-xs font-medium ${
                  msg.startsWith('✅') ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'
                }`}>{msg}</div>
              )}

              <button
                onClick={handleBuy}
                disabled={buyMutation.isPending}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {buyMutation.isPending ? 'Đang xử lý...' : `Đầu tư ${amount ? fmt(parseFloat(amount), 2) + ' USD' : 'ngay'}`}
              </button>
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-bold text-white">Lịch sử đầu tư</h2>
          </div>
          {histLoading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center">
              <TrendingUp size={40} className="mx-auto mb-3 text-gray-700" />
              <p className="text-gray-500">Chưa có lịch sử đầu tư</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {history.map((inv: any) => {
                const isActive    = inv.status === 'active';
                const isCompleted = inv.status === 'completed';
                const StatusIcon  = isActive ? Clock : isCompleted ? CheckCircle : XCircle;
                const earned = parseFloat(inv.profitPaid ?? 0);
                const pct    = inv.amount > 0 ? (earned / parseFloat(inv.amount)) * 100 : 0;
                return (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <StatusIcon size={18} className={isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-500'} />
                      <div>
                        <p className="text-sm font-semibold text-white">{inv.package?.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {fmtTime(inv.startDate)} → {fmtTime(inv.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{fmt(parseFloat(inv.amount), 2)} USD</p>
                      <p className="text-[11px] text-green-400">+{fmt(earned, 2)} ({pct.toFixed(1)}%)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
