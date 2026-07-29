import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePackages, useWallet, useBuyInvestment, type InvestPackage } from '../hooks/useInvest';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 5000];

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { data: packages } = usePackages();
  const { data: wallet }   = useWallet();
  const { mutateAsync, isPending } = useBuyInvestment();
  const [amount, setAmount] = useState('');

  const pkg = packages?.find(p => p.id === id);
  if (!pkg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--inv-primary) transparent transparent transparent' }} />
      </div>
    );
  }

  const daily    = Number(pkg.dailyProfit) * 100;
  const total    = daily * pkg.duration;
  const amtNum   = Number(amount);
  const avail    = Number(wallet?.balance ?? 0) - Number(wallet?.frozen ?? 0);
  const estProfit = amtNum > 0 ? (amtNum * Number(pkg.dailyProfit) * pkg.duration) : 0;
  const dailyEst  = amtNum > 0 ? amtNum * Number(pkg.dailyProfit) : 0;

  const handleBuy = async () => {
    if (amtNum < Number(pkg.minAmount)) {
      toast.error(`Số tiền tối thiểu là $${pkg.minAmount}`);
      return;
    }
    if (pkg.maxAmount > 0 && amtNum > Number(pkg.maxAmount)) {
      toast.error(`Số tiền tối đa là $${pkg.maxAmount}`);
      return;
    }
    if (amtNum > avail) {
      toast.error('Số dư khả dụng không đủ');
      return;
    }
    try {
      await mutateAsync({ packageId: pkg.id, amount: amtNum });
      toast.success(`Đầu tư thành công! Lợi nhuận sẽ được trả hàng ngày.`);
      nav('/portfolio');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? 'Đầu tư thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ background: 'var(--inv-bg)' }}>
        <button onClick={() => nav(-1)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'var(--inv-surface)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-base">{pkg.name}</h1>
      </div>

      {/* Hero */}
      <div className="mx-4 rounded-2xl p-6 text-white" style={{ background: 'var(--inv-card-bg)' }}>
        <p className="text-sm opacity-80">{pkg.description ?? 'Gói đầu tư sinh lời ổn định'}</p>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-xs opacity-70">Lợi nhuận/ngày</p>
            <p className="text-2xl font-black text-yellow-300">{daily.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Tổng lợi nhuận</p>
            <p className="text-2xl font-black">{total.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Thời hạn</p>
            <p className="text-2xl font-black">{pkg.duration}d</p>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        {[
          { icon: TrendingUp, label: 'Tối thiểu', value: `$${Number(pkg.minAmount).toFixed(0)}` },
          { icon: TrendingUp, label: 'Tối đa', value: pkg.maxAmount > 0 ? `$${Number(pkg.maxAmount).toFixed(0)}` : 'Không giới hạn' },
          { icon: Clock,      label: 'Trả lợi nhuận', value: 'Hàng ngày' },
          { icon: Shield,     label: 'Vốn', value: 'Hoàn trả cuối kỳ' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl p-3" style={{ background: 'var(--inv-surface)', border: '1px solid var(--inv-border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} color="var(--inv-primary)" />
              <p className="text-xs" style={{ color: 'var(--inv-muted)' }}>{label}</p>
            </div>
            <p className="text-sm font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Invest form */}
      <div className="mx-4 mt-5">
        <p className="text-sm font-bold mb-2">Số tiền đầu tư (USD)</p>
        <div className="relative mb-3">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: 'var(--inv-muted)' }}>$</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={`Tối thiểu $${Number(pkg.minAmount).toFixed(0)}`}
            className="w-full py-3 pl-8 pr-4 rounded-xl text-lg font-bold outline-none"
            style={{ background: 'var(--inv-surface)', border: '1px solid var(--inv-border)', color: 'var(--inv-text)' }}
          />
        </div>

        {/* Quick pick */}
        <div className="flex gap-2 flex-wrap mb-4">
          {QUICK_AMOUNTS.filter(a => a >= Number(pkg.minAmount)).map(a => (
            <button key={a} onClick={() => setAmount(String(a))}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: amount === String(a) ? 'var(--inv-primary)' : 'var(--inv-surface)',
                color:      amount === String(a) ? '#fff' : 'var(--inv-text)',
                border:     `1px solid ${amount === String(a) ? 'var(--inv-primary)' : 'var(--inv-border)'}`,
              }}
            >${a}</button>
          ))}
          <button onClick={() => setAmount(String(Math.floor(avail)))}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--inv-surface)', border: '1px solid var(--inv-border)' }}
          >Tối đa</button>
        </div>

        {/* Projection */}
        {amtNum > 0 && (
          <div className="rounded-xl p-4 mb-4" style={{ background: '#f0fdf4', border: '1px solid var(--inv-border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--inv-primary)' }}>Dự tính lợi nhuận</p>
            <div className="space-y-1.5">
              {[
                { label: 'Vốn đầu tư',        value: `$${amtNum.toFixed(2)}` },
                { label: 'Lợi nhuận/ngày',     value: `+$${dailyEst.toFixed(4)}` },
                { label: `Tổng lợi nhuận (${pkg.duration} ngày)`, value: `+$${estProfit.toFixed(2)}` },
                { label: 'Nhận về tổng cộng',  value: `$${(amtNum + estProfit).toFixed(2)}`, bold: true },
              ].map(({ label, value, bold }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span style={{ color: 'var(--inv-muted)' }}>{label}</span>
                  <span className={bold ? 'font-black text-sm' : 'font-semibold'} style={bold ? { color: 'var(--inv-primary)' } : undefined}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wallet hint */}
        <p className="text-xs mb-4" style={{ color: 'var(--inv-muted)' }}>
          Số dư khả dụng: <strong style={{ color: 'var(--inv-text)' }}>${avail.toFixed(2)}</strong>
        </p>

        <button
          onClick={handleBuy}
          disabled={!amount || isPending || Number(amount) <= 0}
          className="w-full py-4 rounded-xl font-black text-white transition-all disabled:opacity-50 active:scale-[0.98]"
          style={{ background: 'var(--inv-primary)' }}
        >
          {isPending ? 'Đang xử lý...' : `Đầu tư $${amtNum > 0 ? amtNum.toFixed(2) : '?'} vào ${pkg.name}`}
        </button>
      </div>
    </div>
  );
}
