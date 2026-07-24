import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Gamepad2, Trophy, Gift, Clock } from 'lucide-react';
import type { RecentTransaction } from '@/api/apiBangDieuKhien';

interface Props {
  data: RecentTransaction[];
}

const TYPE_CONFIG: Record<RecentTransaction['type'], { label: string; icon: React.ElementType; color: string; bg: string; sign: string }> = {
  deposit:  { label: 'Nạp tiền', icon: ArrowUpCircle,  color: 'text-emerald-400', bg: 'bg-emerald-500/10', sign: '+' },
  withdraw: { label: 'Rút tiền', icon: ArrowDownCircle, color: 'text-red-400',     bg: 'bg-red-500/10',     sign: '-' },
  bet:      { label: 'Cược',     icon: Gamepad2,         color: 'text-violet-400',  bg: 'bg-violet-500/10',  sign: '-' },
  win:      { label: 'Thắng',    icon: Trophy,           color: 'text-amber-400',   bg: 'bg-amber-500/10',   sign: '+' },
  bonus:    { label: 'Thưởng',   icon: Gift,             color: 'text-pink-400',    bg: 'bg-pink-500/10',    sign: '+' },
};

const STATUS_CONFIG: Record<RecentTransaction['status'], { label: string; cls: string }> = {
  success: { label: 'Thành công', cls: 'bg-emerald-500/15 text-emerald-400' },
  pending: { label: 'Đang xử lý', cls: 'bg-amber-500/15 text-amber-400' },
  failed:  { label: 'Thất bại',   cls: 'bg-red-500/15 text-red-400' },
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)  return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

export default function RecentTransactions({ data }: Props) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Giao dịch gần đây</h3>
          <p className="text-xs text-gray-400 mt-0.5">{data.length} giao dịch mới nhất</p>
        </div>
        <a href="/profile" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          Xem tất cả →
        </a>
      </div>
      <div className="space-y-2">
        {data.map((tx) => {
          const type   = TYPE_CONFIG[tx.type];
          const status = STATUS_CONFIG[tx.status];
          const Icon   = type.icon;
          return (
            <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/5 transition-colors">
              <div className={`w-9 h-9 rounded-lg ${type.bg} flex items-center justify-center shrink-0`}>
                <Icon size={16} className={type.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{tx.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock size={11} className="text-gray-500" />
                  <span className="text-xs text-gray-500">{formatRelative(tx.createdAt)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${status.cls}`}>{status.label}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${type.sign === '+' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {type.sign}{(tx.amount / 1_000_000).toFixed(1)}M ₫
                </p>
                <p className="text-xs text-gray-500">#{tx.id}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
