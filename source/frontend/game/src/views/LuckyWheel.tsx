/**
 * LuckyWheel.tsx — Lucky Wheel / Spin-to-win page
 * Inspired by 7x7's "vòng quay may mắn" feature
 * Spin animation: CSS transform rotate on the wheel canvas
 */
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { getWheel, getMySpins, spinWheel, getSpinHistory } from '@/api/wheel';
import { Skeleton } from '@/components/common/Skeleton';
import { formatVND } from '@/utils/dinhDang';

// ── Spin Wheel Canvas Component ───────────────────────────────────────────────
function SpinCanvas({ prizes, spinDeg, isSpinning }: {
  prizes: any[];
  spinDeg: number;
  isSpinning: boolean;
}) {
  const size = 280;
  const cx   = size / 2;
  const cy   = size / 2;
  const r    = cx - 8;
  const n    = prizes.length;
  if (!n) return null;

  const segAngle = (2 * Math.PI) / n;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 text-2xl">▼</div>

      {/* Rotating wheel */}
      <svg
        width={size}
        height={size}
        className="transition-transform"
        style={{
          transform:         `rotate(${spinDeg}deg)`,
          transitionDuration: isSpinning ? '4s' : '0s',
          transitionTimingFunction: 'cubic-bezier(0.17, 0.67, 0.12, 0.99)',
        }}
      >
        {prizes.map((prize: any, i: number) => {
          const startAngle = i * segAngle - Math.PI / 2;
          const endAngle   = startAngle + segAngle;
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          const largeArc = segAngle > Math.PI ? 1 : 0;

          // Text midpoint
          const mid = startAngle + segAngle / 2;
          const tx  = cx + (r * 0.65) * Math.cos(mid);
          const ty  = cy + (r * 0.65) * Math.sin(mid);
          const textAngle = (mid * 180) / Math.PI + 90;

          return (
            <g key={prize.id}>
              <path
                d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`}
                fill={prize.color || `hsl(${(i * 360) / n}, 70%, 55%)`}
                stroke="#fff"
                strokeWidth="1.5"
              />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                fontSize="9"
                fontWeight="bold"
                fill="#fff"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {prize.label.length > 10 ? prize.label.slice(0, 9) + '…' : prize.label}
              </text>
            </g>
          );
        })}
        {/* Center circle */}
        <circle cx={cx} cy={cy} r={18} fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="14">🎰</text>
      </svg>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LuckyWheel() {
  const qc = useQueryClient();
  const [spinDeg, setSpinDeg] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastPrize, setLastPrize] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'wheel' | 'history'>('wheel');
  const spinCount = useRef(0);

  const { data: wheel, isLoading: wheelLoading } = useQuery({
    queryKey: ['wheel'],
    queryFn:  getWheel,
    staleTime: 300_000,
  });

  const { data: mySpins } = useQuery({
    queryKey: ['wheel-spins'],
    queryFn:  getMySpins,
  });

  const { data: historyData } = useQuery({
    queryKey: ['wheel-history'],
    queryFn:  () => getSpinHistory(1),
    enabled:  activeTab === 'history',
  });

  const spinMut = useMutation({
    mutationFn: (isFree: boolean) => spinWheel(isFree),
    onSuccess: (d: any) => {
      const prize       = d.data?.prize;
      const rewardValue = d.data?.rewardValue;
      setLastPrize({ ...prize, rewardValue });

      // Spin to a calculated degree based on prize index
      const prizes  = wheel?.prizes ?? [];
      const prizeIdx = prizes.findIndex((p: any) => p.id === prize?.id);
      const segAngle = 360 / prizes.length;
      // Land so segment center faces up (270° base - pointer at top)
      const targetDeg = 270 - (prizeIdx * segAngle + segAngle / 2);
      // Add full rotations for drama
      spinCount.current += 1;
      const extraSpins = 5 + (spinCount.current % 3);
      setSpinDeg(extraSpins * 360 + targetDeg);
      setIsSpinning(true);

      // Show result after animation (4s)
      setTimeout(() => {
        setIsSpinning(false);
        qc.invalidateQueries({ queryKey: ['wheel-spins'] });
        if (rewardValue && Number(rewardValue) > 0) {
          toast.success(`🎉 Chúc mừng! Bạn nhận được: ${prize?.label}`);
        } else {
          toast(`Bạn nhận được: ${prize?.label}`, { icon: '🎰' });
        }
      }, 4200);
    },
    onError: (e: any) => {
      setIsSpinning(false);
      toast.error(e?.response?.data?.message || 'Không thể quay');
    },
    onMutate: () => setIsSpinning(true),
  });

  const freeRemaining = mySpins?.freeSpinsRemaining ?? 0;
  const canSpin       = !isSpinning && (freeRemaining > 0 || Number(wheel?.spinCost ?? 0) === 0);

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Vòng quay may mắn</h1>
          <p className="text-xs text-gray-500">
            Lượt quay miễn phí còn lại: <span className="text-purple-500 font-bold">{freeRemaining}</span>
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 gap-1">
        {(['wheel', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500'
            }`}
          >
            {tab === 'wheel' ? '🎰 Vòng quay' : '📋 Lịch sử'}
          </button>
        ))}
      </div>

      {activeTab === 'wheel' && (
        <>
          {wheelLoading ? (
            <Skeleton className="h-72 rounded-3xl" />
          ) : !wheel ? (
            <div className="text-center text-gray-400 py-16">Vòng quay chưa được kích hoạt</div>
          ) : (
            <>
              <SpinCanvas
                prizes={wheel.prizes ?? []}
                spinDeg={spinDeg}
                isSpinning={isSpinning}
              />

              {/* Spin buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => spinMut.mutate(true)}
                  disabled={!canSpin || freeRemaining <= 0}
                  className="py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black rounded-2xl disabled:opacity-40 hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  {isSpinning ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Đang quay...
                    </span>
                  ) : (
                    `🆓 Quay miễn phí (${freeRemaining})`
                  )}
                </button>
                <button
                  onClick={() => spinMut.mutate(false)}
                  disabled={isSpinning || Number(wheel.spinCost) === 0}
                  className="py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl disabled:opacity-40 hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  💰 Quay ({formatVND(Number(wheel.spinCost))})
                </button>
              </div>

              {/* Last prize result */}
              {lastPrize && !isSpinning && (
                <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: lastPrize.color ?? '#8b5cf6' }}>
                    {lastPrize.icon ?? '🎁'}
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">Phần thưởng vừa quay</p>
                    <p className="text-base font-black text-gray-900 dark:text-white">{lastPrize.label}</p>
                  </div>
                </div>
              )}

              {/* Prize list */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Bảng giải thưởng</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(wheel.prizes ?? []).map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color ?? '#8b5cf6' }} />
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2">
          {!historyData?.data?.length ? (
            <div className="text-center text-gray-400 py-12">Chưa có lịch sử quay</div>
          ) : (
            historyData.data.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{h.prize?.label ?? '—'}</span>
                  {h.isFree && <span className="text-[10px] text-purple-500 font-bold bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded">FREE</span>}
                </div>
                <span className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
