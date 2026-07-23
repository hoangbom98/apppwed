import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, CheckCircle, Users, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAgentInfo } from '@/api/apiDaiLy';
import { useAuthStore } from '@/store/authStore';
import { formatVND } from '@/utils/dinhDang';
import { Skeleton } from '@/components/chung/KhungTaiTrang';

export default function Agent() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['agent'],
    queryFn: getAgentInfo,
    enabled: !!user,
  });

  const copyLink = () => {
    if (data?.referral_link) {
      navigator.clipboard.writeText(data.referral_link);
      setCopied(true);
      toast.success('Đã sao chép link giới thiệu!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-60 text-gray-400 gap-3">
      <Users className="w-12 h-12 text-gray-300" />
      <p>Đăng nhập để xem thông tin đại lý</p>
    </div>
  );

  if (isLoading) return (
    <div className="max-w-lg mx-auto space-y-4">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Hệ thống đại lý</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-accent">{data?.total_referred || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Người được mời</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-xl font-black text-primary dark:text-secondary">
            {formatVND(data?.total_commission || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Tổng hoa hồng</p>
        </div>
      </div>

      {/* Referral code & link */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-2">Mã giới thiệu của bạn</p>
        <div className="flex items-center gap-2 mb-3">
          <code className="text-xl font-black text-gray-900 dark:text-white tracking-widest flex-1">
            {user.referral_code}
          </code>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-secondary rounded-lg text-xs font-bold text-white transition-colors"
          >
            {copied
              ? <><CheckCircle className="w-3.5 h-3.5" /> Đã copy</>
              : <><Copy className="w-3.5 h-3.5" /> Copy link</>
            }
          </button>
        </div>
        {data?.referral_link && (
          <p className="text-[10px] text-gray-400 break-all">{data.referral_link}</p>
        )}
      </div>

      {/* Commission rate */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <TrendingUp className="w-6 h-6 text-accent shrink-0" />
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Tỷ lệ hoa hồng</p>
          <p className="text-xs text-gray-500">Nhận {data?.agent?.commission_rate || 2}% từ giao dịch của người bạn mời</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Cách nhận hoa hồng</h3>
        {[
          ['1', 'Chia sẻ mã / link giới thiệu cho bạn bè'],
          ['2', 'Bạn bè đăng ký bằng mã của bạn'],
          ['3', 'Nhận hoa hồng khi họ nạp tiền & chơi game'],
        ].map(([n, t]) => (
          <div key={n} className="flex items-start gap-3 mb-2 last:mb-0">
            <span className="w-6 h-6 rounded-full bg-accent/20 text-accent font-black text-xs flex items-center justify-center shrink-0">{n}</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
