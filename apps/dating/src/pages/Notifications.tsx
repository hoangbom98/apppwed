import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markRead, markAllRead } from '@/api/notifications';
import PageHeader from '@/components/common/PageHeader';
import { formatTime } from '@/utils/formatters';
import { Heart, MessageCircle, Gift, Bell, Zap } from 'lucide-react';
import { BellOutlined } from '@ant-design/icons';

const TYPES: Record<string, { icon: React.ElementType; color: string }> = {
  like:    { icon: Heart,          color: 'bg-pink-100 text-pink-500' },
  match:   { icon: Heart,          color: 'bg-red-100 text-red-500' },
  message: { icon: MessageCircle,  color: 'bg-blue-100 text-blue-500' },
  gift:    { icon: Gift,           color: 'bg-amber-100 text-amber-500' },
  system:  { icon: Bell,           color: 'bg-gray-100 text-gray-500' },
  promo:   { icon: Zap,            color: 'bg-purple-100 text-purple-500' },
};

const TABS = ['Tất cả', 'Chưa đọc', 'Match', 'Tin nhắn', 'Quà'];

export default function Notifications() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('Tất cả');

  const { data } = useQuery({ queryKey: ['notifications', tab], queryFn: () => getNotifications({ type: tab === 'Tất cả' ? undefined : tab }) });
  const notifications = data?.notifications || [];

  const markAllMut = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div>
      <PageHeader title="Thông báo"
        rightSlot={
          <button onClick={() => markAllMut.mutate()} className="text-xs text-pink-500 font-medium">Đọc hết</button>
        }
      />

      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${tab === t ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="text-5xl mb-3"><BellOutlined style={{ fontSize: 48, color: '#d1d5db' }} /></div>
          <p className="text-gray-400 text-sm">Chưa có thông báo</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {notifications.map((n: any) => {
            const type = TYPES[n.type] || TYPES.system;
            const Icon = type.icon;
            return (
              <div key={n.id}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer active:bg-gray-50 ${!n.is_read ? 'bg-pink-50/30' : ''}`}
                onClick={() => markRead(n.id)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${type.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-snug">{n.content}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatTime(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
