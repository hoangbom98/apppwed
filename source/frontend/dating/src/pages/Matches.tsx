import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMatches, getFavorites, getWhoLikedMe } from '@/api/match';
import { useAuthStore } from '@/store/authStore';
import Avatar from '@/components/common/Avatar';
import { Heart, Star, Clock, Eye, Crown } from 'lucide-react';
import { formatTime } from '@/utils/formatters';

const TABS = [
  { id: 'match',   label: '💘 Match',       icon: Heart },
  { id: 'liked',   label: '❤️ Thích tôi',  icon: Eye },
  { id: 'fav',     label: '⭐ Yêu thích',  icon: Star },
];

export default function Matches() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState('match');

  const { data: matchData } = useQuery({ queryKey: ['matches'], queryFn: getMatches, enabled: tab === 'match' });
  const { data: likedData } = useQuery({ queryKey: ['liked-me'], queryFn: getWhoLikedMe, enabled: tab === 'liked' });
  const { data: favData } = useQuery({ queryKey: ['favorites'], queryFn: getFavorites, enabled: tab === 'fav' });

  const items = tab === 'match' ? (matchData?.matches || [])
    : tab === 'liked' ? (likedData?.users || [])
    : (favData?.favorites || []);

  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-black text-gray-900">💘 Ghép đôi</h1>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mb-4 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${tab === t.id ? 'bg-pink-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Lock VIP teaser */}
      {tab === 'liked' && (
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <Crown size={20} className="text-amber-500" />
            <div>
              <p className="text-sm font-bold text-amber-800">Nâng cấp VIP để xem ai thích bạn</p>
              <p className="text-xs text-amber-600">Unlimited likes, Super Like, Boost…</p>
            </div>
            <button onClick={() => navigate('/vip')} className="ml-auto text-xs bg-amber-400 text-white px-3 py-1.5 rounded-lg font-semibold">
              VIP
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">🌸</div>
          <p className="text-gray-500">Chưa có {tab === 'match' ? 'match' : 'ai'} nào</p>
          <button onClick={() => navigate('/swipe')} className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-xl text-sm font-semibold">
            Swipe ngay
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map((item: any) => {
            const u = item.user || item;
            return (
              <div key={item.id || u.id} className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/chat/${u.id}`)}>
                <Avatar src={u.avatar} name={u.full_name} size={52} isOnline={u.is_online} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">{u.full_name}</p>
                    {u.vip_level > 0 && <Crown size={12} className="text-amber-400 flex-shrink-0" />}
                  </div>
                  <p className="text-gray-400 text-xs truncate">{item.last_message || 'Bắt đầu cuộc trò chuyện!'}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {item.matched_at && <p className="text-xs text-gray-400">{formatTime(item.matched_at)}</p>}
                  {item.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {item.unread}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
