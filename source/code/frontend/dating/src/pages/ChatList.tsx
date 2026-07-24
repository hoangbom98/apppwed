import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getConversations } from '@/api/chat';
import Avatar from '@/components/common/Avatar';
import { formatTime } from '@/utils/formatters';
import { Search, Edit } from 'lucide-react';

export default function ChatList() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['conversations'], queryFn: getConversations });
  const conversations = data?.conversations || [];

  return (
    <div>
      <div className="px-4 pt-4 flex items-center justify-between mb-3">
        <h1 className="text-2xl font-black text-gray-900">💬 Tin nhắn</h1>
        <button onClick={() => navigate('/search')} className="p-2 rounded-full hover:bg-gray-100">
          <Search size={20} className="text-gray-600" />
        </button>
      </div>

      {isLoading ? (
        <div className="px-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded-full w-32 animate-pulse" />
                <div className="h-2.5 bg-gray-100 rounded-full w-48 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div className="text-6xl mb-4">💌</div>
          <p className="text-gray-500">Chưa có cuộc trò chuyện nào</p>
          <button onClick={() => navigate('/matches')} className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-xl text-sm font-semibold">
            Xem Match
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {conversations.map((conv: any) => (
            <div key={conv.user_id} className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/chat/${conv.user_id}`)}>
              <Avatar src={conv.user.avatar} name={conv.user.full_name} size={52} isOnline={conv.user.is_online} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-900 text-sm">{conv.user.full_name}</p>
                  <p className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatTime(conv.last_message_at)}</p>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className={`text-xs truncate ${conv.unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {conv.last_message}
                  </p>
                  {conv.unread > 0 && (
                    <span className="flex-shrink-0 ml-2 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {conv.unread > 9 ? '9+' : conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
