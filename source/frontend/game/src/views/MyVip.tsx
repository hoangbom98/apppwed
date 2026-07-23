import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { getVipInfo, getVipLevels, claimDaily, claimMonthly } from '@/api/apiVip';
import { Skeleton } from '@/components/chung/KhungTaiTrang';
import { formatVND } from '@/utils/dinhDang';
import { VIP_BADGES, VIP_BG } from '@/utils/tainguyen';

const VIP_COLORS: Record<number, string> = {
  1: 'from-orange-700 to-yellow-600',
  2: 'from-slate-500 to-slate-400',
  3: 'from-yellow-600 to-yellow-400',
  4: 'from-cyan-600 to-blue-400',
  5: 'from-purple-600 to-pink-400',
  6: 'from-indigo-700 to-purple-500',
  7: 'from-rose-600 to-pink-400',
  8: 'from-teal-600 to-emerald-400',
  9: 'from-amber-700 to-orange-500',
  10: 'from-gray-900 to-gray-600',
};

export default function Vip() {
  const qc = useQueryClient();
  const [showCoinBurst, setShowCoinBurst] = useState(false);

  const { data: vip, isLoading } = useQuery({
    queryKey: ['vip'],
    queryFn: getVipInfo,
  });
  const { data: levels = [] } = useQuery({
    queryKey: ['vip-levels'],
    queryFn: getVipLevels,
    staleTime: 3_600_000,
  });

  const triggerCoin = () => {
    setShowCoinBurst(true);
    setTimeout(() => setShowCoinBurst(false), 900);
  };

  const dailyMut = useMutation({
    mutationFn: claimDaily,
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ['vip'] });
      toast.success(`Nhận thưởng ngày: ${formatVND(d.amount || d.bonus || 0)}`);
      triggerCoin();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Chưa thể nhận thưởng'),
  });
  const monthlyMut = useMutation({
    mutationFn: claimMonthly,
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ['vip'] });
      toast.success(`Nhận thưởng tháng: ${formatVND(d.amount || d.bonus || 0)}`);
      triggerCoin();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Chưa thể nhận thưởng'),
  });

  if (isLoading) return (
    <div className="max-w-lg mx-auto space-y-4">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );

  if (!vip) return <div className="text-center text-gray-400 py-20">Cần đăng nhập để xem VIP</div>;

  const currentLevel = vip.current_level;
  const lvl = vip.vip_level || 1;
  const progress = vip.next_level
    ? Math.min(100, ((vip.total_bet - Number(currentLevel.min_bet)) / (Number(vip.next_level.min_bet) - Number(currentLevel.min_bet))) * 100)
    : 100;

  // Use WAP background image if available, else gradient
  const vipBgImg = VIP_BG[lvl];

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">VIP của tôi</h1>

      {/* Current VIP card — WAP background style */}
      <div
        className={`rounded-2xl p-5 relative overflow-hidden ${vipBgImg ? '' : `bg-gradient-to-br ${VIP_COLORS[lvl] || VIP_COLORS[1]}`}`}
        style={vipBgImg ? {
          backgroundImage: `url(${vipBgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {/* Overlay for text contrast when using bg image */}
        {vipBgImg && <div className="absolute inset-0 bg-black/30 rounded-2xl" />}

        {/* Coin burst particles */}
        {showCoinBurst && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center gap-2 z-20">
            {['💰', '🪙', '💎', '✨', '🎊'].map((c, i) => (
              <span key={i} className="animate-coin-burst text-xl" style={{ animationDelay: `${i * 0.08}s` }}>{c}</span>
            ))}
          </div>
        )}

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-white/70 text-xs mb-1">Cấp độ hiện tại</p>
            <h2 className="text-3xl font-black text-white">{currentLevel.name}</h2>
            <p className="text-white/70 text-sm mt-1">Tổng cược: {formatVND(vip.total_bet)}</p>
          </div>
          {/* VIP badge from WAP images */}
          <img
            src={VIP_BADGES[lvl] || VIP_BADGES[1]}
            alt={`VIP ${lvl}`}
            className="w-16 h-16 object-contain drop-shadow-lg"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {vip.next_level && (
          <div className="relative z-10 mt-4">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>{currentLevel.name}</span>
              <span>{vip.next_level.name}</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-white/60 mt-1 text-right">
              Cần thêm {formatVND(Math.max(0, Number(vip.next_level.min_bet) - vip.total_bet))}
            </p>
          </div>
        )}
      </div>

      {/* Claim buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => dailyMut.mutate()}
          disabled={!vip.can_claim_daily || dailyMut.isPending}
          className="flex flex-col items-center gap-2 p-4 bg-accent/10 border border-accent/40 rounded-xl disabled:opacity-40 hover:bg-accent/20 transition-colors"
        >
          <Gift className="w-6 h-6 text-accent" />
          <span className="text-xs font-bold text-accent">Thưởng hàng ngày</span>
          <span className="text-[10px] text-accent/70">{vip.can_claim_daily ? 'Nhận ngay!' : 'Đã nhận hôm nay'}</span>
        </button>
        <button
          onClick={() => monthlyMut.mutate()}
          disabled={!vip.can_claim_monthly || monthlyMut.isPending}
          className="flex flex-col items-center gap-2 p-4 bg-secondary/10 border border-secondary/40 rounded-xl disabled:opacity-40 hover:bg-secondary/20 transition-colors"
        >
          <Gift className="w-6 h-6 text-secondary" />
          <span className="text-xs font-bold text-secondary">Thưởng hàng tháng</span>
          <span className="text-[10px] text-secondary/70">{vip.can_claim_monthly ? 'Nhận ngay!' : 'Đã nhận tháng này'}</span>
        </button>
      </div>

      {/* VIP Level table */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Bảng cấp độ VIP</h3>
        <div className="space-y-2">
          {levels.map((l: any) => (
            <div key={l.level}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                l.level === vip.vip_level
                  ? 'border-accent/50 bg-accent/5'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                <img
                  src={VIP_BADGES[l.level] || VIP_BADGES[1]}
                  alt={`VIP ${l.level}`}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.display = 'none';
                    const fb = el.nextElementSibling as HTMLElement | null;
                    if (fb) fb.style.display = 'flex';
                  }}
                />
                {/* Gradient fallback */}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${VIP_COLORS[l.level] || VIP_COLORS[1]} items-center justify-center font-black text-white text-sm hidden`}>
                  {l.level}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{l.name}</p>
                <p className="text-[10px] text-gray-500">Hoàn tiền {l.cashback_rate}% · Thưởng ngày {formatVND(l.daily_bonus || 0)}</p>
              </div>
              {l.level === vip.vip_level && (
                <span className="text-[10px] text-accent font-bold shrink-0">Hiện tại</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
