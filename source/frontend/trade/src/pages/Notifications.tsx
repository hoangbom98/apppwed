import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, getUnreadCount, markNotifRead } from '@/api/trade';

const TYPE_ICON: Record<string, string> = {
  order_filled: '✅',
  kyc_update:   '🪪',
  deposit:      '💰',
  withdraw:     '📤',
  price_alert:  '🔔',
  margin_call:  '⚠️',
  system:       '📢',
};

export default function Notifications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['tradeNotifications', filter],
    queryFn:  () => getNotifications(),
    refetchInterval: 30_000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['tradeUnreadCount'],
    queryFn:  getUnreadCount,
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => markNotifRead(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['tradeNotifications'] });
      qc.invalidateQueries({ queryKey: ['tradeUnreadCount'] });
    },
  });

  const notifications: any[] = data?.data ?? [];
  const unreadCount: number  = unreadData?.data?.count ?? 0;

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="min-h-screen bg-[#0f1117] py-6 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            Thông báo
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs text-white font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </h1>
          <div className="flex gap-2">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
                ].join(' ')}
              >
                {f === 'all' ? 'Tất cả' : 'Chưa đọc'}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-[#1a1d27] rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#1a1d27] rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">🔕</div>
            <p className="text-gray-400">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif: any) => (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && markRead.mutate(notif.id)}
                className={[
                  'bg-[#1a1d27] rounded-2xl p-4 flex gap-3 cursor-pointer hover:bg-[#1f2333] transition-colors',
                  !notif.isRead ? 'border-l-2 border-blue-500' : '',
                ].join(' ')}
              >
                {/* Icon */}
                <div className="text-2xl flex-shrink-0 mt-0.5">
                  {TYPE_ICON[notif.type] ?? '📬'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={['text-sm font-semibold', notif.isRead ? 'text-gray-300' : 'text-white'].join(' ')}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.content}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(notif.createdAt).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
