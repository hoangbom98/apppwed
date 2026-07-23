import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getHomeData } from '@/api/users';
import { getStories } from '@/api/stories';
import { useAuthStore } from '@/store/authStore';
import Avatar from '@/components/common/Avatar';
import { MapPin, Zap, Crown, Users, Star } from 'lucide-react';
import { ASSET_UI } from '@/utils/constants';

interface UserCard {
  id: number; full_name: string; avatar: string | null;
  age: number; city: string; is_online: boolean; vip_level: number;
  views?: number; rating?: number; is_live?: boolean;
}

function UserThumb({ user, onClick }: { user: UserCard; onClick: () => void }) {
  return (
    <div className="flex-shrink-0 cursor-pointer" onClick={onClick}>
      <div className="relative w-20 rounded-2xl overflow-hidden" style={{ height: 104 }}>
        {user.avatar
          ? <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
          : <img src={ASSET_UI.DEFAULT_AVATAR} alt="" className="w-full h-full object-cover bg-gray-100" />}

        {/* LIVE badge */}
        {user.is_live && (
          <img src={ASSET_UI.LIVE_BADGE} alt="LIVE"
            className="absolute top-1 left-1 w-8 h-8 object-contain"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.cssText = '';
              el.outerHTML = '<span class="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded">LIVE</span>';
            }} />
        )}

        {user.is_online && !user.is_live && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
        )}
        {user.vip_level > 0 && <Crown size={12} className="absolute top-1.5 left-1.5 text-amber-400" />}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4">
          <p className="text-white text-[10px] font-semibold truncate">{user.full_name.split(' ').pop()}</p>
          {/* Views + rating */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <img src={ASSET_UI.ICON_VIEWS} alt="" className="w-2.5 h-2.5 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-white/70 text-[8px]">{(user.views || Math.floor(Math.random()*10000)).toLocaleString()}</span>
            <img src={ASSET_UI.ICON_LOVE} alt="" className="w-2.5 h-2.5 object-contain ml-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-white/70 text-[8px]">{(user.rating || (Math.random()*2+8).toFixed(1))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children, onSeeAll }: { title: string; icon: React.ReactNode; children: React.ReactNode; onSeeAll?: () => void }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-1.5">
          {icon}
          <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        </div>
        {onSeeAll && <button onClick={onSeeAll} className="text-xs text-pink-500 font-medium">Xem tất cả</button>}
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none">
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: home, isLoading } = useQuery({ queryKey: ['home'], queryFn: getHomeData });
  const { data: storiesData } = useQuery({ queryKey: ['stories'], queryFn: getStories });

  const stories = storiesData?.stories || [];
  const banners = home?.banners || [];
  const hotUsers = home?.hot_users || [];
  const onlineUsers = home?.online_users || [];
  const nearbyUsers = home?.nearby_users || [];
  const newUsers = home?.new_users || [];
  const vipUsers = home?.vip_users || [];
  const recommended = home?.recommended || [];

  return (
    <div className="pb-4">
      {/* Stories row */}
      {stories.length > 0 && (
        <div className="px-4 py-3 flex gap-3 overflow-x-auto scrollbar-none border-b border-gray-50">
          {/* Add story */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer" onClick={() => navigate('/stories')}>
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-pink-300 flex items-center justify-center bg-pink-50">
              <span className="text-2xl">+</span>
            </div>
            <span className="text-[10px] text-gray-500 text-center w-14 truncate">Story</span>
          </div>
          {stories.map((s: any) => (
            <div key={s.id} className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer" onClick={() => navigate('/stories')}>
              <div className="w-14 h-14 rounded-full ring-2 ring-pink-400 ring-offset-2 overflow-hidden">
                <img src={s.user.avatar || ''} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-gray-600 text-center w-14 truncate">{s.user.full_name.split(' ').pop()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Banner */}
      {banners.length > 0 && (
        <div className="px-4 mt-4 mb-4">
          <div className="h-36 rounded-2xl overflow-hidden relative">
            <img src={banners[0]?.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/70 to-transparent flex items-center px-5">
              <div>
                <p className="text-white font-black text-lg">{banners[0]?.title}</p>
                <p className="text-white/80 text-xs mt-1">{banners[0]?.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hot Users */}
      {hotUsers.length > 0 && (
        <Section title="🔥 Nổi bật hôm nay" icon={<Zap size={16} className="text-orange-400" />} onSeeAll={() => navigate('/discovery')}>
          {hotUsers.map((u: UserCard) => <UserThumb key={u.id} user={u} onClick={() => navigate(`/profile/${u.id}`)} />)}
        </Section>
      )}

      {/* Online Now */}
      {onlineUsers.length > 0 && (
        <Section title="🟢 Đang online" icon={<span />} onSeeAll={() => navigate('/discovery?filter=online')}>
          {onlineUsers.map((u: UserCard) => <UserThumb key={u.id} user={u} onClick={() => navigate(`/profile/${u.id}`)} />)}
        </Section>
      )}

      {/* Nearby */}
      {nearbyUsers.length > 0 && (
        <Section title="📍 Gần bạn" icon={<MapPin size={16} className="text-blue-400" />} onSeeAll={() => navigate('/nearby')}>
          {nearbyUsers.map((u: UserCard) => <UserThumb key={u.id} user={u} onClick={() => navigate(`/profile/${u.id}`)} />)}
        </Section>
      )}

      {/* Recommended */}
      {recommended.length > 0 && (
        <Section title="⭐ Gợi ý cho bạn" icon={<Star size={16} className="text-yellow-400" />} onSeeAll={() => navigate('/discovery')}>
          {recommended.map((u: UserCard) => <UserThumb key={u.id} user={u} onClick={() => navigate(`/profile/${u.id}`)} />)}
        </Section>
      )}

      {/* New Members */}
      {newUsers.length > 0 && (
        <Section title="✨ Thành viên mới" icon={<Users size={16} className="text-green-500" />}>
          {newUsers.map((u: UserCard) => <UserThumb key={u.id} user={u} onClick={() => navigate(`/profile/${u.id}`)} />)}
        </Section>
      )}

      {/* VIP Users */}
      {vipUsers.length > 0 && (
        <Section title="👑 VIP" icon={<Crown size={16} className="text-amber-400" />}>
          {vipUsers.map((u: UserCard) => <UserThumb key={u.id} user={u} onClick={() => navigate(`/profile/${u.id}`)} />)}
        </Section>
      )}

      {/* Quick Actions */}
      <div className="mx-4 mt-2 grid grid-cols-4 gap-2">
        {[
          { icon: '💘', label: 'Swipe', path: '/swipe' },
          { icon: '🎁', label: 'Quà', path: '/shop' },
          { icon: '🎮', label: 'Party', path: '/party' },
          { icon: '🌟', label: 'VIP', path: '/vip' },
          { icon: '📺', label: 'Shorts', path: '/shorts' },
          { icon: '👥', label: 'Cộng đồng', path: '/community' },
          { icon: '🎯', label: 'Sự kiện', path: '/events' },
          { icon: '💎', label: 'Nạp xu', path: '/recharge' },
        ].map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gray-50 hover:bg-pink-50 transition-colors">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[10px] text-gray-600 font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
