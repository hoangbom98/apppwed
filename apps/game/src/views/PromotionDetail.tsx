import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Clock } from 'lucide-react';
import { getPromotion } from '@/api/apiKhuyenMai';
import { Skeleton } from '@/components/chung/KhungTaiTrang';
import { formatDate, formatVND } from '@/utils/dinhDang';

export default function PromotionDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: promo, isLoading } = useQuery({
    queryKey: ['promotion', id],
    queryFn: () => getPromotion(Number(id)),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="max-w-lg mx-auto space-y-4">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-8 w-2/3 rounded" />
      <Skeleton className="h-4 rounded w-full" />
      <Skeleton className="h-4 rounded w-3/4" />
    </div>
  );

  if (!promo) return <div className="text-center text-gray-400 py-20">Không tìm thấy khuyến mãi</div>;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <Link to="/promotions" className="flex items-center gap-1 text-gray-400 hover:text-gray-700 dark:hover:text-white text-sm">
        <ChevronLeft className="w-4 h-4" /> Quay lại
      </Link>

      <div className="h-44 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
        <img src="/wap/img/giftnew.png" alt="Khuyến mãi" className="w-20 h-20 object-contain" />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold">{promo.type}</span>
          <span className="text-sm font-bold text-primary dark:text-secondary">+{formatVND(promo.value)}</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">{promo.name}</h1>
      </div>

      {promo.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{promo.description}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock className="w-3.5 h-3.5" />
        <span>{formatDate(promo.start_date)} – {formatDate(promo.end_date)}</span>
      </div>

      {promo.conditions && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Điều kiện tham gia</h3>
          <pre className="text-xs text-gray-500 whitespace-pre-wrap">{JSON.stringify(promo.conditions, null, 2)}</pre>
        </div>
      )}

      <Link
        to="/deposit"
        className="block w-full py-4 bg-primary hover:bg-secondary text-white font-black rounded-2xl text-center text-base transition-colors"
      >
        Tham gia ngay
      </Link>
    </div>
  );
}
