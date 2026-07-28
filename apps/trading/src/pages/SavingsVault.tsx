import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Landmark, Star, Clock, CheckCircle, Loader2 } from 'lucide-react';
import {
  getSavingsVaultProducts,
  getMySavingsVaultInvestments,
  investSavingsVault,
} from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt, fmtTime } from '@/utils/formatters';
import type { SavingsVaultProduct } from '@/types';

const STATUS_STYLE: Record<string, string> = {
  active:    'text-green-400',
  completed: 'text-blue-400',
  cancelled: 'text-red-400',
};
const STATUS_LABEL: Record<string, string> = {
  active:    'Đang gửi',
  completed: 'Đáo hạn',
  cancelled: 'Đã huỷ',
};

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={11} fill={i < count ? 'currentColor' : 'none'}
          className={i < count ? 'text-yellow-400' : 'text-gray-600'} />
      ))}
    </div>
  );
}

export default function SavingsVaultPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab]           = useState<'products' | 'my'>('products');
  const [selected, setSelected] = useState<SavingsVaultProduct | null>(null);
  const [amount, setAmount]     = useState('');
  const [msg, setMsg]           = useState('');

  const { data: prodData, isLoading: prodLoading } = useQuery({
    queryKey: ['savingsVault-products'],
    queryFn:  () => getSavingsVaultProducts(),
  });

  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['savingsVault-my'],
    queryFn:  () => getMySavingsVaultInvestments(),
    enabled:  !!user && tab === 'my',
  });

  const products = prodData?.data ?? [];
  const myInvs   = myData?.data   ?? [];

  const investMut = useMutation({
    mutationFn: (vars: { productId: string; amount: number }) => investSavingsVault(vars),
    onSuccess: () => {
      setMsg('Gửi tiết kiệm thành công!');
      setAmount('');
      setSelected(null);
      qc.invalidateQueries({ queryKey: ['savingsVault-my'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setMsg(err.response?.data?.message ?? 'Lỗi gửi tiết kiệm');
    },
  });

  const handleInvest = () => {
    if (!selected) { setMsg('Chọn sản phẩm tiết kiệm'); return; }
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) { setMsg('Nhập số tiền hợp lệ'); return; }
    setMsg('');
    investMut.mutate({ productId: selected.id, amount: amtNum });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-yellow-950/50 border border-yellow-800/30">
          <Landmark size={20} className="text-yellow-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">SavingsVault – Tiết kiệm linh hoạt</h1>
          <p className="text-xs text-gray-500">Gửi tiền nhận lãi suất cao, rút linh hoạt bất kỳ lúc nào</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl w-fit">
        {(['products', 'my'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t === 'products' ? 'Sản phẩm' : 'Của tôi'}
          </button>
        ))}
      </div>

      {/* Products */}
      {tab === 'products' && (
        <>
          {prodLoading && (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-yellow-400" /></div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p: SavingsVaultProduct) => {
              const rate = Number(p.interestRate);
              const isSelected = selected?.id === p.id;
              return (
                <button key={p.id} onClick={() => { setSelected(p); setAmount(String(p.minAmount)); setMsg(''); }}
                  className={`text-left p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-yellow-950/40 border-yellow-500/60'
                      : 'bg-gray-900 border-gray-800 hover:border-yellow-700/40'
                  }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-white">{p.title}</p>
                      <div className="mt-1"><StarRating count={p.stars ?? 0} /></div>
                    </div>
                    <span className="text-2xl font-black text-yellow-400">{rate}%</span>
                  </div>
                  {p.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={10} /> {p.days} ngày</span>
                    <span>Tối thiểu: <b className="text-white">${Number(p.minAmount).toLocaleString('vi')}</b></span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-800/60">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">Lãi ước tính / $1000</span>
                      <span className="text-green-400 font-semibold">+${(10 * rate / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Invest form */}
          {selected && (
            <div className="bg-gray-900 border border-yellow-700/30 rounded-2xl p-5 mt-2">
              <h3 className="font-bold text-white mb-4">Gửi vào: {selected.title}</h3>
              <label className="text-xs text-gray-500 mb-1 block">Số tiền (USD)</label>
              <div className="relative mb-3">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder={`Tối thiểu ${Number(selected.minAmount).toLocaleString('vi')} USD`}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">USD</span>
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center mb-4 p-3 bg-gray-800/40 rounded-xl text-[11px]">
                  <div>
                    <p className="text-gray-500 mb-0.5">Lãi suất</p>
                    <p className="font-bold text-yellow-400">{selected.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Thời hạn</p>
                    <p className="font-bold text-blue-400">{selected.days} ngày</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Tổng nhận về</p>
                    <p className="font-bold text-white">
                      ${(parseFloat(amount) * (1 + Number(selected.interestRate) / 100)).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {msg && (
                <div className={`mb-3 p-3 rounded-xl text-xs font-medium ${
                  msg.startsWith('Gửi') ? 'bg-green-950 text-green-400 border border-green-900'
                                        : 'bg-red-950 text-red-400 border border-red-900'
                }`}>{msg}</div>
              )}
              <button onClick={handleInvest} disabled={investMut.isPending}
                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
                {investMut.isPending ? 'Đang gửi...' : 'Xác nhận gửi tiết kiệm'}
              </button>
            </div>
          )}
        </>
      )}

      {/* My investments */}
      {tab === 'my' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-bold text-white">Tiết kiệm của tôi</h2>
          </div>
          {myLoading && <div className="p-8 text-center"><Loader2 size={24} className="animate-spin text-yellow-400 mx-auto" /></div>}
          {!myLoading && myInvs.length === 0 && (
            <div className="p-8 text-center text-gray-500">Bạn chưa có khoản tiết kiệm nào</div>
          )}
          <div className="divide-y divide-gray-800/50">
            {myInvs.map((inv) => {
              const daysLeft = Math.max(0, Math.ceil((new Date(inv.endDate).getTime() - Date.now()) / 86400000));
              const rate     = Number(inv.product?.interestRate ?? 0);
              const profit   = Number(inv.amount) * rate / 100;
              return (
                <div key={inv.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white">{inv.product?.title ?? '—'}</p>
                      <p className="text-[11px] text-gray-500">{fmtTime(inv.createdAt)}</p>
                    </div>
                    <span className={`text-xs font-bold ${STATUS_STYLE[inv.status] ?? 'text-gray-400'}`}>
                      {STATUS_LABEL[inv.status] ?? inv.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="bg-gray-800/40 rounded-lg py-2">
                      <p className="text-gray-500 mb-0.5">Gốc</p>
                      <p className="font-bold text-white">{fmt(Number(inv.amount), 2)}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg py-2">
                      <p className="text-gray-500 mb-0.5">Lãi suất</p>
                      <p className="font-bold text-yellow-400">{rate}%</p>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg py-2">
                      <p className="text-gray-500 mb-0.5">Lãi dự kiến</p>
                      <p className="font-bold text-green-400">+{fmt(profit, 2)}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg py-2">
                      <p className="text-gray-500 mb-0.5">Còn lại</p>
                      <p className={`font-bold ${inv.status === 'active' ? 'text-blue-400' : 'text-gray-400'}`}>
                        {inv.status === 'active' ? `${daysLeft}d` : <CheckCircle size={14} className="mx-auto" />}
                      </p>
                    </div>
                  </div>
                  {inv.status === 'active' && (
                    <p className="text-[10px] text-gray-500 mt-2 text-right">Đáo hạn: {fmtTime(inv.endDate)}</p>
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
