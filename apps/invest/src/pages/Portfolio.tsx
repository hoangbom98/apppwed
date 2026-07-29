import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useMyInvestments } from '../hooks/useInvest';

const TABS = [
  { id: 'ACTIVE',    label: 'Đang chạy' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

const STATUS_CONFIG = {
  ACTIVE:    { color: '#065f46', bg: '#d1fae5', icon: TrendingUp,    label: 'Đang chạy' },
  COMPLETED: { color: '#1d4ed8', bg: '#dbeafe', icon: CheckCircle2,  label: 'Hoàn thành' },
  CANCELLED: { color: '#991b1b', bg: '#fee2e2', icon: XCircle,       label: 'Đã hủy' },
};

export default function Portfolio() {
  const nav = useNavigate();
  const [tab, setTab] = useState<'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');
  const { data, isLoading } = useMyInvestments(tab);
  const investments = data?.data ?? [];

  const totalInv  = investments.reduce((s, i) => s + Number(i.amount), 0);
  const totalProfit = investments.reduce((s, i) => s + Number(i.profitPaid), 0);

  return (
    <div className="px-4 pb-4">
      <div className="py-5">
        <h1 className="text-xl font-black">Danh mục đầu tư</h1>
        {tab === 'ACTIVE' && investments.length > 0 && (
          <p className="text-xs mt-1" style={{ color: 'var(--inv-muted)' }}>
            Tổng đầu tư: <strong>${totalInv.toFixed(2)}</strong> · Đã nhận: <strong style={{ color: 'var(--inv-primary)' }}>${totalProfit.toFixed(2)}</strong>
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: tab === t.id ? 'var(--inv-primary)' : 'var(--inv-surface)',
              color:      tab === t.id ? '#fff' : 'var(--inv-text)',
              border:     `1px solid ${tab === t.id ? 'var(--inv-primary)' : 'var(--inv-border)'}`,
            }}
          >{t.label}</button>
        ))}
      </div>

      {isLoading && (
        <div className="py-12 flex justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--inv-primary) transparent transparent transparent' }} />
        </div>
      )}

      {!isLoading && investments.length === 0 && (
        <div className="py-16 text-center">
          <TrendingUp size={40} color="var(--inv-muted)" className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--inv-muted)' }}>Chưa có giao dịch nào</p>
          {tab === 'ACTIVE' && (
            <button onClick={() => nav('/packages')}
              className="mt-4 px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
              style={{ background: 'var(--inv-primary)' }}
            >Bắt đầu đầu tư</button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {investments.map(inv => {
          const cfg  = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.ACTIVE;
          const Icon = cfg.icon;
          const daysTotal = Math.ceil((new Date(inv.endDate).getTime() - new Date(inv.startDate).getTime()) / 86400000);
          const daysLeft  = Math.max(0, Math.ceil((new Date(inv.endDate).getTime() - Date.now()) / 86400000));
          const progress  = daysTotal > 0 ? ((daysTotal - daysLeft) / daysTotal) * 100 : 100;
          const daily     = Number(inv.package.dailyProfit) * 100;

          return (
            <div key={inv.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--inv-border)', background: 'var(--inv-surface)' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--inv-border)' }}>
                <p className="font-bold text-sm">{inv.package.name}</p>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                  <Icon size={11} />
                  {cfg.label}
                </div>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--inv-muted)' }}>Vốn đầu tư</span>
                  <span className="font-bold">${Number(inv.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--inv-muted)' }}>Lợi nhuận đã nhận</span>
                  <span className="font-bold" style={{ color: 'var(--inv-primary)' }}>+${Number(inv.profitPaid).toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--inv-muted)' }}>Lãi suất</span>
                  <span className="font-bold" style={{ color: 'var(--inv-gold)' }}>{daily.toFixed(2)}%/ngày</span>
                </div>
                {inv.status === 'ACTIVE' && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--inv-muted)' }}>Còn lại</span>
                    <span className="font-bold flex items-center gap-1"><Clock size={11} />{daysLeft} ngày</span>
                  </div>
                )}
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--inv-primary)' }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--inv-muted)' }}>
                    <span>{new Date(inv.startDate).toLocaleDateString('vi-VN')}</span>
                    <span>{new Date(inv.endDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
