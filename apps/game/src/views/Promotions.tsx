import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPromotions } from '@/api/apiKhuyenMai';
import { PromotionList } from '@/components/khuyen-mai/TheKhuyenMai';
import { Skeleton } from '@/components/chung/KhungTaiTrang';

const FILTERS = [
  { key: 'all',     label: 'Tất cả' },
  { key: 'deposit', label: 'Nạp tiền' },
  { key: 'bonus',   label: 'Thưởng' },
  { key: 'cashback',label: 'Hoàn tiền' },
  { key: 'vip',     label: 'VIP' },
  { key: 'event',   label: 'Sự kiện' },
];

export default function Promotion() {
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: getPromotions,
    staleTime: 300_000,
  });

  const filtered = activeFilter === 'all'
    ? (promos as any[])
    : (promos as any[]).filter((p: any) => p.type === activeFilter);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Khuyến mãi</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              activeFilter === f.key
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          {activeFilter === 'all' ? 'Hiện chưa có khuyến mãi' : 'Không có khuyến mãi loại này'}
        </div>
      ) : (
        <PromotionList promotions={filtered} />
      )}
    </div>
  );
}
