/**
 * Mining.tsx — Máy đào (矿机 Mining Machine investments)
 * Features: machine catalog, invest (with trading password), my holdings, daily income display
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cpu, Zap, Package, ChevronRight, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMiningMachines, getMyMining, investMining } from '@/api/mining';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/common/Skeleton';
import { formatVND } from '@/utils/dinhDang';

interface BuyFormProps {
  machine: any;
  onClose: () => void;
}

function BuyForm({ machine, onClose }: BuyFormProps) {
  const qc = useQueryClient();
  const [qty, setQty]     = useState(1);
  const [pwd, setPwd]     = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const mut = useMutation({
    mutationFn: investMining,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-mining'] });
      qc.invalidateQueries({ queryKey: ['mining-machines'] });
      toast.success('Mua máy đào thành công!');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const total        = parseFloat(machine.price) * qty;
  const dailyIncome  = parseFloat(machine.dayIncome) * qty;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full rounded-t-2xl p-5" style={{ background: 'var(--game-card-bg)' }}>
        <h3 className="font-bold text-base text-white mb-1">{machine.title}</h3>
        <p className="text-xs text-gray-400 mb-4">
          Giá cọc: {formatVND(machine.price)} · Thu nhập: {formatVND(machine.dayIncome)}/ngày
        </p>

        {/* Quantity */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-gray-400">Số lượng:</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold">−</button>
            <span className="w-8 text-center font-bold text-white">{qty}</span>
            <button onClick={() => setQty(q => machine.perUserLimit > 0 ? Math.min(machine.perUserLimit, q + 1) : q + 1)}
                    className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold">+</button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white/5 rounded-xl p-3 mb-4 text-xs text-gray-300 space-y-1">
          <div className="flex justify-between"><span>Tổng tiền cọc:</span><span className="text-white font-semibold">{formatVND(total)}</span></div>
          <div className="flex justify-between"><span>Thu nhập hàng ngày:</span>
            <span className="font-semibold" style={{ color: 'var(--game-accent)' }}>+{formatVND(dailyIncome)}/ngày</span>
          </div>
          {machine.duration > 0 && (
            <div className="flex justify-between">
              <span>Thời hạn:</span>
              <span className="text-white">{machine.duration} ngày</span>
            </div>
          )}
        </div>

        {/* Trading password */}
        <div className="relative mb-4">
          <input
            type={showPwd ? 'text' : 'password'}
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            placeholder="Mật khẩu giao dịch (6 số)"
            maxLength={6}
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none pr-10"
          />
          <button onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            {showPwd ? 'ẩn' : 'hiện'}
          </button>
        </div>

        <button
          disabled={!pwd || pwd.length < 6 || mut.isPending}
          onClick={() => mut.mutate({ machineId: machine.id, quantity: qty, tradingPassword: pwd })}
          className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40"
          style={{ background: 'var(--game-accent)', color: '#000' }}
        >
          {mut.isPending ? 'Đang xử lý...' : 'Xác nhận mua'}
        </button>
      </div>
    </div>
  );
}

export default function Mining() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'machines' | 'holdings'>('machines');
  const [selectedMachine, setSelectedMachine] = useState<any>(null);

  const { data: machines = [], isLoading: mLoading } = useQuery({
    queryKey: ['mining-machines'],
    queryFn:  getMiningMachines,
    select:   (r: any) => r?.data ?? r ?? [],
  });

  const { data: holdings = [], isLoading: hLoading } = useQuery({
    queryKey: ['my-mining'],
    queryFn:  getMyMining,
    enabled:  !!user && tab === 'holdings',
    select:   (r: any) => r?.data ?? [],
  });

  const totalDailyIncome = holdings
    .filter((h: any) => h.status === 'active')
    .reduce((s: number, h: any) => s + parseFloat(h.dayIncome || 0), 0);

  return (
    <div className="min-h-screen bg-dark pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
           style={{ background: 'var(--game-primary)' }}>
        <button onClick={() => window.history.back()} className="p-1 text-white">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1 className="text-white font-bold text-base flex-1">Máy đào</h1>
      </div>

      {/* Stats banner */}
      <div className="mx-4 mt-4 rounded-2xl p-4 text-white"
           style={{ background: 'linear-gradient(135deg, #1a3a6b, #0e2145)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu size={36} className="opacity-70" />
            <div>
              <p className="text-xs opacity-70">Tổng thu nhập hàng ngày</p>
              <p className="text-xl font-black mt-0.5" style={{ color: 'var(--game-accent)' }}>
                {formatVND(totalDailyIncome)}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Đang chạy</p>
            <p className="text-white font-bold text-lg">
              {holdings.filter((h: any) => h.status === 'active').length}
            </p>
            <p>máy</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-4 rounded-xl overflow-hidden border border-white/10">
        {(['machines', 'holdings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === t ? 'text-white' : 'text-gray-400 bg-white/5'
            }`}
            style={tab === t ? { background: 'var(--game-primary)' } : {}}
          >
            {t === 'machines' ? 'Danh sách máy' : 'Đang nắm giữ'}
          </button>
        ))}
      </div>

      {/* Machines */}
      {tab === 'machines' && (
        <div className="mx-4 mt-4 space-y-3">
          {mLoading
            ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
            : machines.map((m: any) => (
              <div key={m.id} className="game-card rounded-2xl overflow-hidden">
                {m.image && (
                  <img src={m.image} alt={m.title}
                       className="w-full h-32 object-cover"
                       onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">{m.title}</h3>
                      {m.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.description}</p>}
                    </div>
                    {m.totalStock > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                        Còn {m.stock}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Zap size={11} style={{ color: 'var(--game-accent)' }} />
                      +{formatVND(m.dayIncome)}/ngày
                    </span>
                    <span className="flex items-center gap-1">
                      <Package size={11} />
                      Cọc: {formatVND(m.price)}
                    </span>
                    {m.duration > 0 && (
                      <span>{m.duration} ngày</span>
                    )}
                  </div>

                  <button
                    disabled={m.totalStock > 0 && m.stock === 0}
                    onClick={() => user ? setSelectedMachine(m) : window.location.assign('/login')}
                    className="w-full py-2 rounded-xl text-sm font-bold text-black disabled:opacity-40"
                    style={{ background: 'var(--game-accent)' }}
                  >
                    {m.totalStock > 0 && m.stock === 0 ? 'Hết hàng' : 'Mua ngay'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Holdings */}
      {tab === 'holdings' && (
        <div className="mx-4 mt-4 space-y-2">
          {!user ? (
            <div className="text-center py-16 text-sm text-gray-500">
              <a href="/login" style={{ color: 'var(--game-accent)' }}>Đăng nhập</a> để xem
            </div>
          ) : hLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : holdings.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">Chưa có máy đào nào</div>
          ) : (
            holdings.map((h: any) => (
              <div key={h.id} className="game-card rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-white">{h.machine?.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    h.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {h.status === 'active' ? 'Đang chạy' : 'Đã kết thúc'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Tiền cọc: {formatVND(h.deposit)}</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={11} style={{ color: 'var(--game-accent)' }} />
                    <span style={{ color: 'var(--game-accent)' }}>+{formatVND(h.dayIncome)}/ngày</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                  <span>Đã nhận: {formatVND(h.profitPaid)}</span>
                  {h.endDate && <span>Đến: {h.endDate?.slice(0, 10)}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Buy modal */}
      {selectedMachine && (
        <BuyForm machine={selectedMachine} onClose={() => setSelectedMachine(null)} />
      )}
    </div>
  );
}
