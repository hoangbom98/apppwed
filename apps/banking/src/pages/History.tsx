import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Gift } from 'lucide-react';
import { useTransactions } from '../hooks/useBanking';

const FILTERS = [
  { id: '',        label: 'Tất cả' },
  { id: 'deposit', label: 'Nạp tiền' },
  { id: 'withdraw',label: 'Rút tiền' },
  { id: 'trade_open', label: 'Đầu tư' },
  { id: 'referral',  label: 'Hoa hồng' },
];

const TYPE_ICON: Record<string, React.ElementType> = {
  deposit:    ArrowDownToLine,
  withdraw:   ArrowUpFromLine,
  trade_open: TrendingUp,
  referral:   Gift,
};

const TYPE_LABEL: Record<string, string> = {
  deposit:    'Nạp tiền',
  withdraw:   'Rút tiền',
  trade_open: 'Đầu tư',
  referral:   'Hoa hồng',
  interest:   'Lãi suất',
  bonus:      'Thưởng',
};

export default function History() {
  const nav = useNavigate();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTransactions(page, filter || undefined);

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => nav(-1)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'var(--bank-surface)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold">Lịch sử giao dịch</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setPage(1); }}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: filter === f.id ? 'var(--bank-primary)' : 'var(--bank-surface)',
              color:      filter === f.id ? '#fff' : 'var(--bank-text)',
              border:     `1px solid ${filter === f.id ? 'var(--bank-primary)' : 'var(--bank-border)'}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mx-4 rounded-xl overflow-hidden" style={{ border: '1px solid var(--bank-border)', background: 'var(--bank-surface)' }}>
        {isLoading && (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--bank-primary) transparent transparent transparent' }} />
          </div>
        )}
        {!isLoading && data?.data?.length === 0 && (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--bank-muted)' }}>Không có giao dịch</p>
        )}
        {data?.data?.map(tx => {
          const positive = tx.amount > 0;
          const Icon = TYPE_ICON[tx.type] ?? (positive ? ArrowDownToLine : ArrowUpFromLine);
          return (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--bank-border)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: positive ? '#dcfce7' : '#fee2e2', color: positive ? '#16a34a' : '#dc2626' }}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{TYPE_LABEL[tx.type] ?? tx.type}</p>
                <p className="text-xs" style={{ color: 'var(--bank-muted)' }}>
                  {new Date(tx.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: positive ? 'var(--bank-success)' : 'var(--bank-danger)' }}>
                  {positive ? '+' : ''}${Math.abs(Number(tx.amount)).toFixed(2)}
                </p>
                <p className="text-xs" style={{ color: 'var(--bank-muted)' }}>
                  Dư: ${Number(tx.balanceAfter).toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {data && data.meta.pages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)' }}
          >← Trước</button>
          <span className="text-sm" style={{ color: 'var(--bank-muted)' }}>{page} / {data.meta.pages}</span>
          <button
            disabled={page === data.meta.pages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)' }}
          >Sau →</button>
        </div>
      )}
    </div>
  );
}
