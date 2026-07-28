import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimSigninReward, getSigninRewardStatus } from '@/api/trade';
import { formatCoins } from '@ui/formatters';
import { CalendarCheck, CheckCircle2, Gift, Flame, Loader2, Star } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Day reward schedule ────────────────────────────────────────────────────────
const DAY_REWARDS = [10, 10, 20, 20, 30, 30, 50] as const;

// ── Styles ─────────────────────────────────────────────────────────────────────
const surface = { background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' };

// ── Signin Reward Page ─────────────────────────────────────────────────────────
export default function SigninRewardPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey:           ['signinRewardStatus'],
    queryFn:            getSigninRewardStatus,
    refetchOnWindowFocus: true,
  });

  const status = data?.data as { claimed?: boolean; streak?: number; points?: number } | undefined;
  const claimed = status?.claimed ?? false;
  const streak  = status?.streak  ?? 0;
  const points  = status?.points  ?? 0;

  const claimMut = useMutation({
    mutationFn: claimSigninReward,
    onSuccess: (res) => {
      const earned = (res?.data as any)?.points ?? 0;
      qc.invalidateQueries({ queryKey: ['signinRewardStatus'] });
      toast.success(`🎉 Điểm danh thành công! +${earned} điểm`);
    },
    onError: () => toast.error('Không thể điểm danh, vui lòng thử lại'),
  });

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(252,213,53,0.12)' }}>
          <CalendarCheck size={18} style={{ color: 'var(--bn-primary)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Điểm danh hàng ngày</h1>
          <p className="text-xs" style={{ color: 'var(--bn-muted)' }}>
            Điểm danh mỗi ngày để nhận điểm thưởng tích luỹ
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 flex items-center gap-4" style={surface}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,68,68,0.12)' }}>
            <Flame size={22} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{isLoading ? '—' : streak}</p>
            <p className="text-xs" style={{ color: 'var(--bn-muted)' }}>Chuỗi ngày hiện tại</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 flex items-center gap-4" style={surface}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(252,213,53,0.12)' }}>
            <Star size={22} style={{ color: 'var(--bn-primary)' }} />
          </div>
          <div>
            <p className="text-2xl font-black" style={{ color: 'var(--bn-primary)' }}>
              {isLoading ? '—' : formatCoins(points)}
            </p>
            <p className="text-xs" style={{ color: 'var(--bn-muted)' }}>Tổng điểm tích lũy</p>
          </div>
        </div>
      </div>

      {/* 7-day calendar strip */}
      <div className="rounded-2xl p-5 space-y-4" style={surface}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Lịch điểm danh 7 ngày</p>
          {streak > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              🔥 Chuỗi {streak} ngày
            </span>
          )}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {DAY_REWARDS.map((reward, idx) => {
            const dayNum    = idx + 1;
            const isDone    = dayNum <= streak;
            const isToday   = dayNum === streak + 1 && !claimed;
            const isFuture  = dayNum > streak + 1 || (claimed && dayNum > streak);
            const isLast    = idx === DAY_REWARDS.length - 1;

            return (
              <div key={dayNum}
                className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-1 transition-all ${isToday ? 'ring-2 ring-yellow-400/60' : ''}`}
                style={{
                  background: isDone
                    ? 'rgba(252,213,53,0.12)'
                    : isToday
                    ? 'rgba(252,213,53,0.08)'
                    : 'var(--bn-bg-elevated)',
                }}>
                {/* Day icon */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: isDone
                      ? 'var(--bn-primary)'
                      : isToday
                      ? 'rgba(252,213,53,0.2)'
                      : 'transparent',
                    border: isFuture ? '1px dashed var(--bn-border)' : 'none',
                  }}>
                  {isDone
                    ? <CheckCircle2 size={16} color="#0b0e11" />
                    : isLast
                    ? <Gift size={16} style={{ color: isToday ? 'var(--bn-primary)' : 'var(--bn-muted)' }} />
                    : <span className="text-[11px] font-black"
                        style={{ color: isToday ? 'var(--bn-primary)' : 'var(--bn-muted)' }}>
                        {dayNum}
                      </span>
                  }
                </div>
                {/* Day label */}
                <span className="text-[9px] font-semibold uppercase tracking-wider"
                  style={{ color: isDone || isToday ? 'var(--bn-primary)' : 'var(--bn-muted)' }}>
                  Ngày {dayNum}
                </span>
                {/* Reward */}
                <span className="text-[10px] font-bold"
                  style={{ color: isDone ? 'var(--bn-primary)' : isToday ? 'var(--bn-primary)' : 'var(--bn-muted)' }}>
                  +{reward}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claim button */}
      <div className="rounded-2xl p-5" style={surface}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-white">
              {claimed ? 'Đã điểm danh hôm nay' : 'Điểm danh ngay hôm nay'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--bn-muted)' }}>
              {claimed
                ? 'Quay lại vào ngày mai để tiếp tục chuỗi điểm danh'
                : `Phần thưởng hôm nay: +${DAY_REWARDS[Math.min(streak, 6)]} điểm`}
            </p>
          </div>
          {claimed && <CheckCircle2 size={22} style={{ color: 'var(--bn-green)' }} />}
        </div>

        <button
          onClick={() => claimMut.mutate()}
          disabled={claimed || claimMut.isPending || isLoading}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={claimed
            ? { background: 'var(--bn-bg-elevated)', color: 'var(--bn-muted)' }
            : { background: 'var(--bn-primary)', color: '#0b0e11' }}
        >
          {claimMut.isPending
            ? <><Loader2 size={16} className="animate-spin" /> Đang xử lý…</>
            : claimed
            ? <><CheckCircle2 size={16} /> Đã điểm danh hôm nay</>
            : <><CalendarCheck size={16} /> Điểm danh ngay</>}
        </button>
      </div>

      {/* Reward schedule table */}
      <div className="rounded-2xl overflow-hidden" style={surface}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--bn-border)' }}>
          <p className="text-sm font-semibold text-white">Bảng phần thưởng</p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--bn-border)' }}>
          {DAY_REWARDS.map((reward, idx) => {
            const dayNum = idx + 1;
            const isPast = dayNum <= streak;
            return (
              <div key={dayNum} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{
                      background: isPast ? 'var(--bn-primary)' : 'var(--bn-bg-elevated)',
                      color: isPast ? '#0b0e11' : 'var(--bn-muted)',
                    }}>
                    {isPast ? '✓' : dayNum}
                  </div>
                  <span className="text-sm text-white">
                    Ngày {dayNum}{dayNum === 7 ? ' (đặc biệt 🎁)' : ''}
                  </span>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--bn-primary)' }}>
                  +{formatCoins(reward)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
