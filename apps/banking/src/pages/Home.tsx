import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, CreditCard, ChevronRight, TrendingUp } from 'lucide-react';
import { useWallet, useTransactions } from '../hooks/useBanking';
import { useAuthStore } from '../store/authStore';

function ActionBtn({ icon: Icon, label, to }: { icon: React.ElementType; label: string; to: string }) {
  const nav = useNavigate();
  return (
    <button
      onClick={() => nav(to)}
      className="flex flex-col items-center gap-1 flex-1 py-3 rounded-xl transition-all active:scale-95"
      style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)' }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--bank-primary)', color: '#fff' }}>
        <Icon size={18} />
      </div>
      <span className="text-xs font-medium" style={{ color: 'var(--bank-text)' }}>{label}</span>
    </button>
  );
}

function TxRow({ tx }: { tx: { id: string; type: string; amount: number; note: string | null; createdAt: string } }) {
  const positive = tx.amount > 0;
  const typeLabel: Record<string, string> = {
    deposit: 'Nạp tiền', withdraw: 'Rút tiền', trade_open: 'Đầu tư',
    referral: 'Hoa hồng', interest: 'Lãi suất', bonus: 'Thưởng',
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--bank-border)' }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: positive ? '#dcfce7' : '#fee2e2', color: positive ? '#16a34a' : '#dc2626' }}>
        {positive ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{typeLabel[tx.type] ?? tx.type}</p>
        <p className="text-xs truncate" style={{ color: 'var(--bank-muted)' }}>
          {tx.note ?? new Date(tx.createdAt).toLocaleDateString('vi-VN')}
        </p>
      </div>
      <span className="text-sm font-bold flex-shrink-0" style={{ color: positive ? 'var(--bank-success)' : 'var(--bank-danger)' }}>
        {positive ? '+' : ''}{Number(tx.amount).toLocaleString('vi-VN', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}

export default function Home() {
  const { user } = useAuthStore();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: txData } = useTransactions(1);
  const nav = useNavigate();

  const balance  = Number(wallet?.balance ?? 0);
  const frozen   = Number(wallet?.frozen  ?? 0);
  const avail    = balance - frozen;

  return (
    <div>
      {/* Card */}
      <div className="mx-4 mt-5 rounded-2xl p-6 shadow-lg" style={{ background: 'var(--bank-card-bg)', color: 'var(--bank-card-text)' }}>
        <p className="text-sm opacity-80">Số dư khả dụng</p>
        {walletLoading ? (
          <div className="h-9 w-40 rounded-lg animate-pulse mt-1" style={{ background: 'rgba(255,255,255,0.3)' }} />
        ) : (
          <p className="text-3xl font-bold mt-1">
            ${avail.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        )}
        <div className="flex gap-6 mt-4 text-sm">
          <div>
            <span className="opacity-70">Tổng số dư</span>
            <p className="font-semibold">${balance.toFixed(2)}</p>
          </div>
          <div>
            <span className="opacity-70">Đang giữ</span>
            <p className="font-semibold">${frozen.toFixed(2)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs opacity-60">{user?.email ?? 'LKVIP Member'}</p>
      </div>

      {/* Quick actions */}
      <div className="mx-4 mt-5 flex gap-3">
        <ActionBtn icon={ArrowDownToLine} label="Nạp"    to="/deposit" />
        <ActionBtn icon={ArrowUpFromLine} label="Rút"    to="/withdraw" />
        <ActionBtn icon={ArrowLeftRight}  label="Chuyển" to="/transfer" />
        <ActionBtn icon={CreditCard}      label="Tài khoản" to="/accounts" />
      </div>

      {/* Promo banner */}
      <div
        className="mx-4 mt-5 rounded-xl p-4 flex items-center gap-3 cursor-pointer active:opacity-80"
        style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
        onClick={() => nav('/invest')}
      >
        <TrendingUp size={24} color="#16a34a" />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: '#166534' }}>Đầu tư sinh lời hàng ngày</p>
          <p className="text-xs" style={{ color: '#15803d' }}>Lãi suất lên đến 2%/ngày · LKVIP Invest</p>
        </div>
        <ChevronRight size={18} color="#16a34a" />
      </div>

      {/* Recent transactions */}
      <div className="mt-5">
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="font-semibold text-sm">Giao dịch gần đây</h2>
          <button className="text-xs" style={{ color: 'var(--bank-primary)' }} onClick={() => nav('/history')}>
            Xem tất cả
          </button>
        </div>
        <div className="rounded-xl overflow-hidden mx-4" style={{ border: '1px solid var(--bank-border)', background: 'var(--bank-surface)' }}>
          {txData?.data?.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--bank-muted)' }}>Chưa có giao dịch</p>
          )}
          {txData?.data?.slice(0, 5).map(tx => <TxRow key={tx.id} tx={tx} />)}
        </div>
      </div>
    </div>
  );
}
