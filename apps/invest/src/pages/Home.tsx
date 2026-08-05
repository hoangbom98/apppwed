import { useNavigate } from 'react-router-dom';
import { TrendingUp, ShieldCheck } from 'lucide-react';
import { useWallet, useMyInvestments } from '../hooks/useInvest';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 rounded-xl p-4" style={{ background: 'var(--inv-surface)', border: '1px solid var(--inv-border)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--inv-muted)' }}>{label}</p>
      <p className="text-lg font-bold" style={{ color: 'var(--inv-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--inv-muted)' }}>{sub}</p>}
    </div>
  );
}

export default function Home() {
  const nav = useNavigate();
  const { data: wallet } = useWallet();
  const { data: myInv }  = useMyInvestments('ACTIVE');

  const balance  = Number(wallet?.balance ?? 0);
  const avail    = balance - Number(wallet?.frozen ?? 0);
  const active   = myInv?.data ?? [];
  const totalInv = active.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = active.reduce((s, i) => s + Number(i.profitPaid), 0);

  return (
    <div className="px-4 pb-4">
      {/* Hero card */}
      <div className="mt-5 rounded-2xl p-6 shadow-lg text-white" style={{ background: 'var(--inv-card-bg)' }}>
        <p className="text-sm opacity-80">Số dư khả dụng</p>
        <p className="text-3xl font-black mt-1">${avail.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        <div className="flex gap-6 mt-4 text-sm">
          <div>
            <p className="opacity-70 text-xs">Đang đầu tư</p>
            <p className="font-bold">${totalInv.toFixed(2)}</p>
          </div>
          <div>
            <p className="opacity-70 text-xs">Lợi nhuận nhận</p>
            <p className="font-bold text-yellow-300">${totalPaid.toFixed(2)}</p>
          </div>
          <div>
            <p className="opacity-70 text-xs">Gói đang chạy</p>
            <p className="font-bold">{active.length}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mt-4">
        <StatCard label="Tổng đã đầu tư"   value={`$${totalInv.toFixed(0)}`}   sub="tất cả thời gian" />
        <StatCard label="Lợi nhuận tích lũy" value={`$${totalPaid.toFixed(2)}`} sub="đã nhận về ví" />
      </div>

      {/* CTA */}
      <button
        onClick={() => nav('/packages')}
        className="w-full mt-4 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        style={{ background: 'var(--inv-primary)' }}
      >
        <TrendingUp size={18} />
        Khám phá gói đầu tư
      </button>

      {/* Trust badges */}
      <div className="mt-5 rounded-xl p-4 flex items-start gap-3" style={{ background: 'var(--inv-surface)', border: '1px solid var(--inv-border)' }}>
        <ShieldCheck size={20} color="var(--inv-primary)" className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">An toàn & Minh bạch</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--inv-muted)' }}>
            Lợi nhuận được tính và trả tự động mỗi ngày. Rút gốc bất cứ lúc nào (có phí phạt tùy gói).
          </p>
        </div>
      </div>

      {/* Recent active investments */}
      {active.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">Đang đầu tư</h2>
            <button onClick={() => nav('/portfolio')} className="text-xs" style={{ color: 'var(--inv-primary)' }}>Xem tất cả →</button>
          </div>
          <div className="space-y-3">
            {active.slice(0, 3).map(inv => {
              const days = Math.ceil((new Date(inv.endDate).getTime() - Date.now()) / 86400000);
              const pct  = Number(inv.package.dailyProfit) * 100;
              return (
                <div key={inv.id} className="rounded-xl p-4" style={{ background: 'var(--inv-surface)', border: '1px solid var(--inv-border)' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{inv.package.name}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#d1fae5', color: '#065f46' }}>
                      {pct.toFixed(2)}%/ngày
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--inv-muted)' }}>
                    <span>Gốc: <strong style={{ color: 'var(--inv-text)' }}>${Number(inv.amount).toFixed(2)}</strong></span>
                    <span>Đã nhận: <strong style={{ color: 'var(--inv-primary)' }}>${Number(inv.profitPaid).toFixed(2)}</strong></span>
                    <span>Còn: <strong style={{ color: 'var(--inv-text)' }}>{Math.max(0, days)} ngày</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
