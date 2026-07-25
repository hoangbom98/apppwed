// @ts-nocheck
import React from 'react';
import { formatVND, formatDateTime } from '@/utils/dinhDang';
import EmptyState from '@/components/chung/TrangRong';

interface Transaction {
  id: string | number;
  order_type?: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  success:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const TransactionList: React.FC<{
  transactions: Transaction[];
  type?: 'deposit' | 'withdraw';
}> = ({ transactions, type }) => {
  if (!transactions.length) return <EmptyState title="Chưa có giao dịch nào" />;
  const isDeposit = type === 'deposit';
  return (
    <div className="space-y-3">
      {transactions.map(o => (
        <div key={o.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white uppercase">{o.payment_method}</p>
            <p className="text-xs text-gray-500">{formatDateTime(o.created_at)}</p>
          </div>
          <div className="text-right">
            <p className={`font-bold text-sm ${isDeposit ? 'text-green-500' : 'text-red-500'}`}>
              {isDeposit ? '+' : '-'}{formatVND(o.amount)}
            </p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[o.status] || ''}`}>
              {o.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const DepositMethodCard: React.FC<{
  method: { key: string; label: string; emoji?: string; icon?: string };
  selected: boolean;
  onSelect: () => void;
}> = ({ method, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-95 ${
      selected
        ? 'border-primary bg-primary/10 dark:border-accent dark:bg-accent/10'
        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
    }`}
  >
    {method.icon
      ? <img src={method.icon} alt={method.label} className="w-9 h-9 object-contain" />
      : <span className="text-3xl">{method.emoji}</span>
    }
    <span className="text-[10px] font-semibold text-center leading-tight text-gray-700 dark:text-gray-300">{method.label}</span>
  </button>
);
