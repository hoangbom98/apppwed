// @ts-nocheck
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { formatDate } from '@/utils/dinhDang';
import { useEffect, useState } from 'react';
import { PROMO_TYPE_ICONS } from '@/utils/tainguyen';

const TYPE_STYLES: Record<string, { badge: string; gradient: string; icon: string; label: string }> = {
  bonus:     { badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', gradient: 'from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30', icon: PROMO_TYPE_ICONS.bonus,     label: 'Thưởng' },
  cashback:  { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',    gradient: 'from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30',   icon: PROMO_TYPE_ICONS.cashback,  label: 'Hoàn tiền' },
  vip:       { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',    gradient: 'from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30', icon: PROMO_TYPE_ICONS.vip,      label: 'VIP' },
  event:     { badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',        gradient: 'from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30',      icon: PROMO_TYPE_ICONS.event,    label: 'Sự kiện' },
  deposit:   { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',        gradient: 'from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30',  icon: PROMO_TYPE_ICONS.deposit,  label: 'Nạp tiền' },
  free_spin: { badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', gradient: 'from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30', icon: PROMO_TYPE_ICONS.free_spin, label: 'Free Spin' },
};

const DEFAULT_STYLE = TYPE_STYLES.bonus;

// ── Countdown Timer component ──────────────────────────────────────────────
export const CountdownTimer: React.FC<{ endDate?: string }> = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!endDate) { setTimeLeft(''); return; }

    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Đã kết thúc'); return; }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(d > 0 ? `${d}n ${h}g ${m}p` : `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;
  return (
    <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
      ⏱ {timeLeft}
    </span>
  );
};

export const PromotionCard: React.FC<{ promo: any }> = ({ promo }) => {
  const style = TYPE_STYLES[promo.type] || DEFAULT_STYLE;
  return (
    <Link
      to={`/promotions/${promo.id}`}
      className="flex gap-4 bg-white dark:bg-gray-800 rounded-xl shadow p-4 hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 active:scale-[0.99]"
    >
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shrink-0`}>
        <img src={style.icon} alt="" className="w-8 h-8 object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1 flex-wrap">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug flex-1">{promo.name}</h3>
          <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${style.badge}`}>
            {style.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{promo.description}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {promo.end_date && (
            <>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Đến {formatDate(promo.end_date)}</span>
              </div>
              <CountdownTimer endDate={promo.end_date} />
            </>
          )}
          {promo.value && (
            <span className="text-[11px] font-bold text-accent">+{promo.value}%</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export const PromotionList: React.FC<{ promotions: any[] }> = ({ promotions }) => (
  <div className="space-y-3">
    {promotions.map(p => <PromotionCard key={p.id} promo={p} />)}
  </div>
);
