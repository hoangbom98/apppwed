/**
 * DailyMissions.tsx — Daily missions / tasks page
 * Inspired by 7x7's "nhiệm vụ hàng ngày" feature
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMissions, claimMission } from '@/api/missions';
import { Skeleton } from '@/components/common/Skeleton';
import { formatVND } from '@/utils/dinhDang';

const TARGET_LABELS: Record<string, string> = {
  LOGIN:   'Đăng nhập',
  DEPOSIT: 'Nạp tiền',
  BET:     'Đặt cược',
  INVITE:  'Mời bạn',
  LOTTERY: 'Chơi xổ số',
};

const REWARD_LABELS: Record<string, string> = {
  coin:      'Coin',
  bonus:     'Bonus',
  free_spin: 'Free Spin',
};

function MissionCard({ mission, onClaim, isClaiming }: { mission: any; onClaim: () => void; isClaiming: boolean }) {
  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-2xl p-4 ${
      mission.completed && !mission.claimed
        ? 'border-accent/40 ring-1 ring-accent/20'
        : mission.claimed
        ? 'border-green-300 dark:border-green-800 opacity-70'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="shrink-0 mt-0.5">
          {mission.claimed ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          ) : mission.completed ? (
            <CheckCircle2 className="w-6 h-6 text-accent" />
          ) : (
            <Circle className="w-6 h-6 text-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">{mission.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{mission.description}</p>
              <p className="text-xs text-gray-400 mt-1">{TARGET_LABELS[mission.targetType] ?? mission.targetType}</p>
            </div>
            {/* Reward badge */}
            <div className="shrink-0 text-right">
              <p className="text-sm font-black text-accent">+{formatVND(Number(mission.rewardAmount))}</p>
              <p className="text-[10px] text-gray-400">{REWARD_LABELS[mission.rewardType] ?? mission.rewardType}</p>
            </div>
          </div>

          {/* Progress bar */}
          {!mission.claimed && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>{mission.progress} / {mission.targetValue}</span>
                <span>{mission.progressPct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    mission.completed ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ width: `${mission.progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Claim button */}
      {mission.completed && !mission.claimed && (
        <button
          onClick={onClaim}
          disabled={isClaiming}
          className="mt-3 w-full py-2 bg-accent hover:bg-accent/90 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {isClaiming ? 'Đang nhận...' : 'Nhận thưởng'}
        </button>
      )}
    </div>
  );
}

export default function DailyMissions() {
  const qc = useQueryClient();

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: getMissions,
  });

  const claimMut = useMutation({
    mutationFn: (templateId: string) => claimMission(templateId),
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ['missions'] });
      toast.success(d.message || 'Nhận thưởng thành công!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không thể nhận thưởng'),
  });

  const completed = (missions as any[]).filter((m: any) => m.completed && !m.claimed).length;
  const claimed   = (missions as any[]).filter((m: any) => m.claimed).length;
  const total     = (missions as any[]).length;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Nhiệm vụ hàng ngày</h1>
          <p className="text-xs text-gray-500">{claimed}/{total} hoàn thành · {completed > 0 ? `${completed} chờ nhận thưởng` : 'Tiếp tục nào!'}</p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent to-secondary rounded-full transition-all duration-700"
          style={{ width: total > 0 ? `${Math.round((claimed / total) * 100)}%` : '0%' }}
        />
      </div>

      {/* Mission list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (missions as any[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <Trophy className="w-12 h-12 text-gray-200" />
          <p className="text-sm">Nhiệm vụ hôm nay chưa có</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(missions as any[]).map((m: any) => (
            <MissionCard
              key={m.id}
              mission={m}
              onClaim={() => claimMut.mutate(m.templateId)}
              isClaiming={claimMut.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
