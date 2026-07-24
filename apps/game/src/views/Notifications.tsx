import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellOff, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getNotifications, markRead, markAllRead } from '@/api/apiThongBao';
import { relativeTime } from '@/utils/dinhDang';
import { Skeleton } from '@/components/chung/KhungTaiTrang';
import { EmptyState } from '@/components/chung/TrangRong';
import { NOTIF_TYPE_ICONS } from '@/utils/tainguyen';

export default function Notification() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ limit: 30 }),
  });

  const markAllMut = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã đánh dấu tất cả là đã đọc');
    },
  });

  const markOneMut = useMutation({
    mutationFn: (id: number) => markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifs = data?.data || [];
  const unread = data?.unread || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Thông báo
          {unread > 0 && (
            <span className="ml-2 text-xs bg-danger text-white px-2 py-0.5 rounded-full">{unread}</span>
          )}
        </h1>
        {unread > 0 && (
          <button
            onClick={() => markAllMut.mutate()}
            className="flex items-center gap-1.5 text-sm text-primary dark:text-secondary hover:opacity-80 font-semibold"
          >
            <CheckCheck className="w-4 h-4" /> Đọc tất cả
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <EmptyState icon={<BellOff className="w-12 h-12" />} title="Không có thông báo" />
      ) : (
        <div className="space-y-2">
          {notifs.map((n: any) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markOneMut.mutate(n.id)}
              className={`flex gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                n.is_read
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                  : 'bg-primary/5 border-primary/20 dark:bg-primary/10 hover:bg-primary/10'
              }`}
            >
              <img
                src={NOTIF_TYPE_ICONS[n.type] || NOTIF_TYPE_ICONS.default}
                alt={n.type}
                className="w-8 h-8 object-contain shrink-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${n.is_read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.content}</p>
                <p className="text-[10px] text-gray-400 mt-1">{relativeTime(n.created_at)}</p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
