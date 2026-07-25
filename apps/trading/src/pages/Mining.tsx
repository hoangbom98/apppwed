import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cpu, Package, Loader2 } from 'lucide-react';
import {
  getMiningMachines,
  getMyMiningInvestments,
  buyMiningMachine,
} from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt, fmtTime } from '@/utils/formatters';
import type { MiningMachine } from '@/types';

const STATUS_STYLE: Record<string, string> = {
  active:    'text-green-400',
  completed: 'text-blue-400',
  cancelled: 'text-red-400',
};
const STATUS_LABEL: Record<string, string> = {
  active:    'Đang chạy',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

export default function MiningPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab]             = useState<'machines' | 'my'>('machines');
  const [selected, setSelected]   = useState<MiningMachine | null>(null);
  const [quantity, setQuantity]   = useState('1');
  const [msg, setMsg]             = useState('');

  const { data: machData, isLoading: machLoading } = useQuery({
    queryKey: ['mining-machines'],
    queryFn:  () => getMiningMachines(),
  });

  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['mining-my'],
    queryFn:  () => getMyMiningInvestments(),
    enabled:  !!user && tab === 'my',
  });

  const machines = machData?.data ?? [];
  const myInvs   = myData?.data   ?? [];

  const buyMut = useMutation({
    mutationFn: (vars: { machineId: string; quantity: number }) => buyMiningMachine(vars),
    onSuccess: () => {
      setMsg('Mua máy đào thành công!');
      setQuantity('1');
      setSelected(null);
      qc.invalidateQueries({ queryKey: ['mining-my'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setMsg(err.response?.data?.message ?? 'Lỗi mua máy đào');
    },
  });

  const handleBuy = () => {
    if (!selected) { setMsg('Chọn máy đào'); return; }
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) { setMsg('Nhập số lượng hợp lệ'); return; }
    setMsg('');
    buyMut.mutate({ machineId: selected.id, quantity: qty });
  };

  const totalDeposit = selected ? Number(selected.price) * parseInt(quantity || '1') : 0;
  const totalDailyIncome = selected ? Number(selected.dayIncome) * parseInt(quantity || '1') : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-orange-950/50 border border-orange-800/30">
          <Cpu size={20} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Máy đào – Mining Machines</h1>
          <p className="text-xs text-gray-500">Mua máy đào, nhận thu nhập thụ động mỗi ngày</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl w-fit">
        {(['machines', 'my'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t ? 'bg-orange-700 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t === 'machines' ? 'Máy đào' : 'Của tôi'}
          </button>
        ))}
      </div>

      {/* Machines list */}
      {tab === 'machines' && (
        <>
          {machLoading && (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-orange-400" /></div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {machines.map((m: MiningMachine) => {
              const isSelected = selected?.id === m.id;
              const roi = Number(m.price) > 0 ? Math.ceil(Number(m.price) / Number(m.dayIncome)) : 0;
              return (
                <button key={m.id} onClick={() => { setSelected(m); setQuantity('1'); setMsg(''); }}
                  className={`text-left p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-orange-950/40 border-orange-500/60'
                      : 'bg-gray-900 border-gray-800 hover:border-orange-700/40'
                  }`}>
                  {/* Machine image / icon */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-xl bg-orange-950/40 border border-orange-800/30 flex items-center justify-center flex-shrink-0">
                      {m.image
                        ? <img src={m.image} alt={m.title} className="w-12 h-12 object-contain rounded-lg" />
                        : <Cpu size={28} className="text-orange-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{m.title}</p>
                      {m.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{m.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-gray-800/50 rounded-xl py-2.5">
                      <p className="text-[10px] text-gray-500 mb-0.5">Giá đặt cọc</p>
                      <p className="font-black text-white text-sm">${Number(m.price).toLocaleString('vi')}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl py-2.5">
                      <p className="text-[10px] text-gray-500 mb-0.5">Thu nhập/ngày</p>
                      <p className="font-black text-green-400 text-sm">+${fmt(Number(m.dayIncome), 2)}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl py-2.5">
                      <p className="text-[10px] text-gray-500 mb-0.5">Hoàn vốn</p>
                      <p className="font-black text-blue-400 text-sm">{roi}d</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Package size={10} />
                      Còn: <span className="text-white ml-0.5">{m.totalStock > 0 ? m.stock : '∞'}</span>
                    </div>
                    {m.duration > 0 ? (
                      <span className="text-gray-400">Thời hạn: <span className="text-white">{m.duration} ngày</span></span>
                    ) : (
                      <span className="text-green-400">Không giới hạn</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Buy form */}
          {selected && (
            <div className="bg-gray-900 border border-orange-700/30 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4">Mua: {selected.title}</h3>
              <div className="flex gap-3 items-end mb-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Số lượng máy</label>
                  <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                </div>
                <div className="flex gap-1 mb-0.5">
                  {[1,2,5,10].map(v => (
                    <button key={v} onClick={() => setQuantity(String(v))}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        quantity === String(v) ? 'bg-orange-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}>
                      x{v}
                    </button>
                  ))}
                </div>
              </div>

              {quantity && parseInt(quantity) > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center mb-4 p-3 bg-gray-800/40 rounded-xl text-[11px]">
                  <div>
                    <p className="text-gray-500 mb-0.5">Tổng đặt cọc</p>
                    <p className="font-bold text-white">${totalDeposit.toLocaleString('vi')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Thu nhập/ngày</p>
                    <p className="font-bold text-green-400">+${fmt(totalDailyIncome, 2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Thu nhập/tháng</p>
                    <p className="font-bold text-blue-400">+${fmt(totalDailyIncome * 30, 2)}</p>
                  </div>
                </div>
              )}

              {msg && (
                <div className={`mb-3 p-3 rounded-xl text-xs font-medium ${
                  msg.startsWith('Mua') ? 'bg-green-950 text-green-400 border border-green-900'
                                       : 'bg-red-950 text-red-400 border border-red-900'
                }`}>{msg}</div>
              )}
              <button onClick={handleBuy} disabled={buyMut.isPending}
                className="w-full py-3 bg-orange-700 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
                {buyMut.isPending ? 'Đang xử lý...' : `Mua ${quantity} máy — $${totalDeposit.toLocaleString('vi')}`}
              </button>
            </div>
          )}
        </>
      )}

      {/* My investments */}
      {tab === 'my' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-bold text-white">Máy đào của tôi</h2>
          </div>
          {myLoading && <div className="p-8 text-center"><Loader2 size={24} className="animate-spin text-orange-400 mx-auto" /></div>}
          {!myLoading && myInvs.length === 0 && (
            <div className="p-8 text-center text-gray-500">Bạn chưa sở hữu máy đào nào</div>
          )}
          <div className="divide-y divide-gray-800/50">
            {myInvs.map((inv) => {
              const daysLeft = inv.endDate
                ? Math.max(0, Math.ceil((new Date(inv.endDate).getTime() - Date.now()) / 86400000))
                : null;
              return (
                <div key={inv.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white">{inv.machine?.title ?? '—'}</p>
                      <p className="text-[11px] text-gray-500">x{inv.quantity} máy · {fmtTime(inv.createdAt)}</p>
                    </div>
                    <span className={`text-xs font-bold ${STATUS_STYLE[inv.status] ?? 'text-gray-400'}`}>
                      {STATUS_LABEL[inv.status] ?? inv.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-gray-800/40 rounded-lg py-2">
                      <p className="text-gray-500 mb-0.5">Đặt cọc</p>
                      <p className="font-bold text-white">${fmt(Number(inv.deposit), 2)}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg py-2">
                      <p className="text-gray-500 mb-0.5">Thu nhập/ngày</p>
                      <p className="font-bold text-green-400">+${fmt(Number(inv.dayIncome), 2)}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg py-2">
                      <p className="text-gray-500 mb-0.5">{daysLeft !== null ? 'Còn lại' : 'Trạng thái'}</p>
                      <p className={`font-bold ${inv.status === 'active' ? 'text-blue-400' : 'text-gray-400'}`}>
                        {daysLeft !== null ? `${daysLeft}d` : inv.status === 'active' ? '∞' : '—'}
                      </p>
                    </div>
                  </div>
                  {inv.endDate && (
                    <p className="text-[10px] text-gray-500 mt-2 text-right">Hết hạn: {fmtTime(inv.endDate)}</p>
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
