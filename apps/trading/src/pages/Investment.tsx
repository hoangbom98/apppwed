import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, PackageOpen } from 'lucide-react';
import {
  getInvestmentPackages,
  getMyInvestments,
  buyInvestment,
} from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt, fmtTime } from '@/utils/formatters';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    'text-green-400',
  COMPLETED: 'text-blue-400',
  CANCELLED: 'text-red-400',
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVE:    'Đang chạy',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
};

export default function InvestmentPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedPkg, setSelectedPkg] = useState<any | null>(null);
  const [amount, setAmount]           = useState('');
  const [msg, setMsg]                 = useState('');
  const [tab, setTab]                 = useState<'packages' | 'my'>('packages');

  const { data: pkgData, isLoading: pkgLoading } = useQuery({
    queryKey: ['investment-packages'],
    queryFn:  () => getInvestmentPackages(),
  });

  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['my-investments'],
    queryFn:  () => getMyInvestments(),
    enabled:  !!user,
  });

  const packages   = pkgData?.data  ?? [];
  const myInvs     = myData?.data   ?? [];

  const buyMut = useMutation({
    mutationFn: (vars: { packageId: string; amount: number }) => buyInvestment(vars),
    onSuccess: () => {
      setMsg('Đầu tư thành công!');
      setAmount('');
      setSelectedPkg(null);
      qc.invalidateQueries({ queryKey: ['my-investments'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (e: any) => setMsg(e.response?.data?.message || 'Lỗi đầu tư'),
  });

  const handleBuy = () => {
    if (!selectedPkg) { setMsg('Chọn gói đầu tư'); return; }
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) { setMsg('Nhập số tiền hợp lệ'); return; }
    setMsg('');
    buyMut.mutate({ packageId: selectedPkg.id, amount: amtNum });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-800/30">
          <TrendingUp size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Đầu tư</h1>
          <p className="text-xs text-gray-500">Mua gói đầu tư, nhận lãi hàng ngày</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl w-fit">
        {(['packages', 'my'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'packages' ? 'Gói đầu tư' : 'Đầu tư của tôi'}
          </button>
        ))}
      </div>

      {/* ── Packages tab ─── */}
      {tab === 'packages' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pkgLoading && [1,2,3].map(i => (
              <div key={i} className="h-48 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
            ))}
            {packages.map((pkg: any) => (
              <button
                key={pkg.id}
                onClick={() => { setSelectedPkg(pkg); setAmount(String(pkg.minAmount || '')); setMsg(''); }}
                className={`text-left p-5 rounded-2xl border transition-all ${
                  selectedPkg?.id === pkg.id
                    ? 'bg-purple-950/40 border-purple-500/60'
                    : 'bg-gray-900 border-gray-800 hover:border-purple-700/40'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-white text-base">{pkg.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{pkg.description}</p>
                  </div>
                  <PackageOpen size={20} className="text-purple-400 flex-shrink-0 ml-2" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mt-4">
                  <div className="bg-gray-800/50 rounded-xl py-2.5">
                    <p className="text-xs text-gray-500 mb-0.5">Lãi/ngày</p>
                    <p className="font-black text-green-400 text-lg">{pkg.dailyProfit}%</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl py-2.5">
                    <p className="text-xs text-gray-500 mb-0.5">Thời hạn</p>
                    <p className="font-black text-blue-400 text-lg">{pkg.duration}<span className="text-xs font-normal text-gray-500"> ngày</span></p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl py-2.5">
                    <p className="text-xs text-gray-500 mb-0.5">Tổng lãi</p>
                    <p className="font-black text-yellow-400 text-lg">{(pkg.dailyProfit * pkg.duration).toFixed(0)}%</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 text-[11px] text-gray-500">
                  <span>Tối thiểu: <span className="text-white">{Number(pkg.minAmount || 0).toLocaleString('vi')} USD</span></span>
                  {Number(pkg.maxAmount) > 0 && (
                    <span className="ml-auto">Tối đa: <span className="text-white">{Number(pkg.maxAmount).toLocaleString('vi')} USD</span></span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {selectedPkg && (
            <div className="bg-gray-900 border border-purple-700/30 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4">Đầu tư vào: {selectedPkg.name}</h3>
              <label className="text-xs text-gray-500 mb-1 block">Số tiền đầu tư (USD)</label>
              <div className="relative mb-3">
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder={`Tối thiểu ${Number(selectedPkg.minAmount || 0).toLocaleString('vi')} USD`}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">USD</span>
              </div>
              <div className="flex gap-2 mb-4">
                {[100, 500, 1000, 5000].filter(v => v >= Number(selectedPkg.minAmount || 0)).map(v => (
                  <button key={v} onClick={() => setAmount(String(v))}
                    className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold">
                    {v.toLocaleString()}
                  </button>
                ))}
              </div>
              {amount && parseFloat(amount) > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center mb-4 p-3 bg-gray-800/40 rounded-xl">
                  <div>
                    <p className="text-[10px] text-gray-500">Lãi/ngày</p>
                    <p className="font-bold text-green-400 text-sm">+{(parseFloat(amount) * selectedPkg.dailyProfit / 100).toFixed(2)} USD</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Tổng lãi</p>
                    <p className="font-bold text-yellow-400 text-sm">+{(parseFloat(amount) * selectedPkg.dailyProfit / 100 * selectedPkg.duration).toFixed(2)} USD</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Nhận về</p>
                    <p className="font-bold text-white text-sm">{(parseFloat(amount) + parseFloat(amount) * selectedPkg.dailyProfit / 100 * selectedPkg.duration).toFixed(2)} USD</p>
                  </div>
                </div>
              )}
              {msg && (
                <div className={`mb-3 p-3 rounded-xl text-xs font-medium ${
                  msg.startsWith('Đầu') ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'
                }`}>{msg}</div>
              )}
              <button
                onClick={handleBuy} disabled={buyMut.isPending}
                className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
              >
                {buyMut.isPending ? 'Đang xử lý...' : 'Xác nhận đầu tư'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── My Investments tab ─── */}
      {tab === 'my' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-bold text-white">Đầu tư của tôi</h2>
          </div>
          {myLoading && <div className="p-8 text-center text-gray-500">Đang tải...</div>}
          {!myLoading && myInvs.length === 0 && (
            <div className="p-8 text-center text-gray-500">Bạn chưa có khoản đầu tư nào</div>
          )}
          <div className="divide-y divide-gray-800/50">
            {myInvs.map((inv: any) => {
              const pkg = inv.package;
              const dailyEarn = pkg ? parseFloat(inv.amount) * parseFloat(pkg.dailyProfit) / 100 : 0;
              const daysLeft = Math.max(0, Math.ceil((new Date(inv.endDate).getTime() - Date.now()) / 86400000));
              return (
                <div key={inv.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white">{pkg?.name ?? '—'}</p>
                      <p className="text-[11px] text-gray-500">{fmtTime(inv.createdAt)}</p>
                    </div>
                    <span className={`text-xs font-bold ${STATUS_STYLES[inv.status] ?? 'text-gray-400'}`}>
                      {STATUS_LABEL[inv.status] ?? inv.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="bg-gray-800/40 rounded-lg py-2">
                      <p className="text-gray-500 mb-0.5">Gốc</p>
                      <p className="font-bold text-white">{fmt(Number(inv.amount), 2)}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg py-2">
                      <p className="text-gray-500 mb-0.5">Lãi/ngày</p>
                      <p className="font-bold text-green-400">+{fmt(dailyEarn, 2)}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg py-2">
                      <p className="text-gray-500 mb-0.5">Đã trả</p>
                      <p className="font-bold text-blue-400">{fmt(Number(inv.profitPaid), 2)}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg py-2">
                      <p className="text-gray-500 mb-0.5">Còn lại</p>
                      <p className={`font-bold ${daysLeft > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>{daysLeft}d</p>
                    </div>
                  </div>
                  {inv.status === 'ACTIVE' && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${Math.min(100, (Number(inv.profitPaid) / (Number(inv.amount) * parseFloat(pkg?.dailyProfit ?? 0) / 100 * pkg?.duration)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 text-right">{fmtTime(inv.endDate)} đáo hạn</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
