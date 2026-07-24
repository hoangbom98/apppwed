import React from 'react';
import { VIP_COLORS } from '@/utils/hangso';
import { formatVND } from '@/utils/dinhDang';
import { Crown } from 'lucide-react';

export const VipProgress: React.FC<{
  vipLevel: number;
  totalBet: number;
  currentLevel: any;
  nextLevel: any;
}> = ({ vipLevel, totalBet, currentLevel, nextLevel }) => {
  const progress = nextLevel
    ? Math.min(100, ((totalBet - Number(currentLevel.min_bet)) / (Number(nextLevel.min_bet) - Number(currentLevel.min_bet))) * 100)
    : 100;

  return (
    <div className={`rounded-2xl p-6 bg-gradient-to-br ${VIP_COLORS[vipLevel] || VIP_COLORS[1]} text-white`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white/70 text-xs mb-1">Cấp VIP của bạn</p>
          <h2 className="text-3xl font-black">{currentLevel.name}</h2>
          <p className="text-white/70 text-sm mt-1">Tổng cược: {formatVND(totalBet)}</p>
        </div>
        <Crown className="w-10 h-10 text-white/80" />
      </div>
      {nextLevel && (
        <>
          <div className="flex justify-between text-xs text-white/70 mb-1">
            <span>{currentLevel.name}</span>
            <span>{nextLevel.name}</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-white/60 mt-1.5 text-right">
            Cần thêm {formatVND(Math.max(0, Number(nextLevel.min_bet) - totalBet))}
          </p>
        </>
      )}
    </div>
  );
};

export const VipLevelRow: React.FC<{ level: any; isActive: boolean }> = ({ level, isActive }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl border ${
    isActive ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'
  }`}>
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${VIP_COLORS[level.level] || VIP_COLORS[1]} flex items-center justify-center font-black text-white text-sm shrink-0`}>
      {level.level}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-gray-900 dark:text-white text-sm">{level.name}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        Hoàn tiền {level.cashback_rate}% · Thưởng ngày {formatVND(level.daily_bonus || 0)}
      </p>
    </div>
    {isActive && <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-bold shrink-0">Hiện tại</span>}
  </div>
);
