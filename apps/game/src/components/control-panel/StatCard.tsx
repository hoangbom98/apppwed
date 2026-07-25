// @ts-nocheck
import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Gamepad2, Trophy, Gift } from 'lucide-react';
import type { DashboardSummary } from '@/api/apiBangDieuKhien';

interface Props {
  data: DashboardSummary;
}

function formatVND(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ₫`;
  if (amount >= 1_000)    return `${(amount / 1_000).toFixed(0)}K ₫`;
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

export default function SummaryCards({ data }: Props) {
  const cards = useMemo(() => [
    { label: 'Số dư hiện tại',   value: formatVND(data.balance),      icon: Wallet,      bg: 'bg-blue-500/10',    textColor: 'text-blue-400',    trend: null,      trendUp: true  },
    { label: 'Tổng nạp tiền',    value: formatVND(data.totalDeposit), icon: TrendingUp,  bg: 'bg-emerald-500/10', textColor: 'text-emerald-400', trend: '+12.5%',  trendUp: true  },
    { label: 'Tổng rút tiền',    value: formatVND(data.totalWithdraw),icon: TrendingDown,bg: 'bg-red-500/10',     textColor: 'text-red-400',     trend: '-3.2%',   trendUp: false },
    { label: 'Tổng cược',        value: formatVND(data.totalBet),     icon: Gamepad2,    bg: 'bg-violet-500/10',  textColor: 'text-violet-400',  trend: '+8.1%',   trendUp: true  },
    { label: 'Tỷ lệ thắng',      value: `${data.winRate.toFixed(1)}%`,icon: Trophy,      bg: 'bg-amber-500/10',   textColor: 'text-amber-400',   trend: '+2.3%',   trendUp: true  },
    { label: 'Thưởng nhận được', value: formatVND(data.totalBonus),   icon: Gift,        bg: 'bg-pink-500/10',    textColor: 'text-pink-400',    trend: null,      trendUp: true  },
  ], [data]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm p-4 flex flex-col gap-3 hover:border-white/10 transition-all duration-200"
          >
            <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full ${card.bg} blur-xl`} />
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
              <Icon size={20} className={card.textColor} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1 leading-tight">{card.label}</p>
              <p className={`text-lg font-bold ${card.textColor} leading-tight`}>{card.value}</p>
              {card.trend && (
                <p className={`text-xs mt-1 font-medium ${card.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {card.trend} so với tháng trước
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
