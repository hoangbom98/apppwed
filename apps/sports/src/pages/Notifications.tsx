import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotifRead, markAllNotifsRead } from '../api/sports';
import { useSportsStore } from '../store/sportsStore';
import { formatRelativeTime } from '../utils/formatters';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { setUnreadCount } = useSportsStore();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ limit: 50 }),
    staleTime: 30_000,
  });
  const notifications: any[] = data?.data || data?.notifications || [];

  const markAllMut = useMutation({
    mutationFn: markAllNotifsRead,
    onSuccess: () => {
      setUnreadCount(0);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markReadMut = useMutation({
    mutationFn: markNotifRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-bold">Thông báo</h1>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={() => markAllMut.mutate()}
            className="text-xs text-green-400 hover:text-green-300"
            disabled={markAllMut.isPending}
          >
            Đọc tất cả
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n: any) => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markReadMut.mutate(n.id)}
            className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
              n.isRead ? 'bg-gray-800/50' : 'bg-gray-800 ring-1 ring-green-500/20'
            }`}
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-gray-600' : 'bg-green-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{n.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.content}</p>
              <p className="text-[10px] text-gray-600 mt-1">{formatRelativeTime(n.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p>Không có thông báo nào.</p>
        </div>
      )}
    </div>
  );
}
