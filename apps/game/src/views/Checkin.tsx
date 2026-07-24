/**
 * Checkin.tsx — Daily 7-day streak check-in page
 * Inspired by 7x7's "điểm danh hàng ngày" feature
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Gift, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCheckinConfig, getCheckinStatus, claimCheckin } from '@/api/checkin';
import { Skeleton } from '@/components/common/Skeleton';
import { formatVND } from '@/utils/dinhDang';

const REWARD_ICONS: Record<string, string> = {
  coin:      '🪙',
  free_spin: '🎰',
  bonus:     '🎁',
};

export default function Checkin() {
  const qc = useQueryClient();

  const { data: config = [], isLoading: configLoading } = useQuery({
    queryKey: ['checkin-config'],
    queryFn: getCheckinConfig,
    staleTime: 600_000,
  });

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['checkin-status'],
    queryFn: getCheckinStatus,
  });

  const claimMut = useMutation({
    mutationFn: claimCheckin,
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ['checkin-status'] });
      toast.success(`Điểm danh thành công! Nhận ${d.data?.rewardAmount ?? 0} ${d.data?.rewardType === 'coin' ? 'coin' : d.data?.rewardType}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không thể điểm danh'),
  });

  const streak      = status?.streak ?? 0;
  const todayClaimed = status?.todayClaimed ?? false;
  const nextDay     = status?.nextDay ?? 1;

  // Build 7-day grid from config + mark claimed days from weekHistory
  const claimedDates = new Set<string>((status?.weekHistory ?? []).map((r: any) => r.checkinDate));

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Flame className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Điểm danh hàng ngày</h1>
          <p className="text-xs text-gray-500">Streak hiện tại: <span className="text-orange-500 font-bold">{streak} ngày</span></p>
        </div>
      </div>

      {/* 7-day grid */}
      {configLoading || statusLoading ? (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {(config as any[]).map((c: any) => {
            const isCurrent = c.day === nextDay;
            const isPast    = c.day < nextDay;
            return (
              <div
                key={c.day}
                className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border text-center ${
                  isCurrent
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-400'
                    : isPast
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                {isPast && (
                  <CheckCircle className="absolute top-1 right-1 w-3 h-3 text-green-500" />
                )}
                <span className="text-xs font-bold text-gray-500">Ngày {c.day}</span>
                <span className="text-lg">{REWARD_ICONS[c.rewardType] ?? '🎁'}</span>
                <span className={`text-[10px] font-bold ${isCurrent ? 'text-orange-600' : 'text-gray-600 dark:text-gray-400'}`}>
                  {formatVND(Number(c.rewardAmount))}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Claim button */}
      <button
        onClick={() => claimMut.mutate()}
        disabled={todayClaimed || claimMut.isPending}
        className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
          todayClaimed
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.99]'
        }`}
      >
        {claimMut.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Đang xử lý...
          </span>
        ) : todayClaimed ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Đã điểm danh hôm nay
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Gift className="w-5 h-5" />
            Điểm danh nhận thưởng
          </span>
        )}
      </button>

      {/* Next reward info */}
      {!todayClaimed && status?.nextReward && (
        <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
          <span className="text-2xl">{REWARD_ICONS[status.nextReward.rewardType] ?? '🎁'}</span>
          <div>
            <p className="text-xs text-orange-700 dark:text-orange-400 font-bold">Phần thưởng hôm nay</p>
            <p className="text-sm font-black text-gray-900 dark:text-white">
              {formatVND(Number(status.nextReward.rewardAmount))} {status.nextReward.rewardType}
            </p>
          </div>
        </div>
      )}

      {/* Week history */}
      {(status?.weekHistory?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Lịch sử điểm danh</h3>
          <div className="space-y-2">
            {(status.weekHistory as any[]).slice(0, 7).map((h: any) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                <span className="text-sm text-gray-700 dark:text-gray-300">{h.checkinDate}</span>
                <span className="text-sm font-bold text-green-600">+{formatVND(Number(h.rewardAmount))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
