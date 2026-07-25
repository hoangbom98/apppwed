import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getUserById } from '@/api/users';
import { likeUser } from '@/api/match';
import { followUser } from '@/api/profile';
import { Heart, MessageCircle, Video, Shield, MapPin } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import UserBadges from '@/components/common/UserBadges';
import { formatAge } from '@/utils/formatters';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const uid = Number(id);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({ queryKey: ['user', uid], queryFn: () => getUserById(uid) });
  const user = data?.user || data;

  const likeMut = useMutation({ mutationFn: () => likeUser(uid) });
  useMutation({ mutationFn: () => followUser(uid) }); // followMut reserved for future use

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div>
      <PageHeader transparent
        rightSlot={
          <button onClick={() => {}} className="text-gray-500">⋯</button>
        }
      />

      {/* Hero */}
      <div className="relative">
        <div className="h-72 overflow-hidden">
          <img src={user.avatar || user.photos?.[0] || ''} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end gap-2 mb-1.5">
            <h1 className="text-white font-black text-2xl">{user.full_name}</h1>
            <span className="text-white/80 text-xl">{user.age || formatAge(user.dob)}</span>
            {user.is_verified && <Shield size={16} className="text-blue-400 mb-0.5" />}
          </div>
          <div className="flex items-center gap-1.5 text-white/70 text-sm mb-2">
            <MapPin size={13} /> {user.city}
            {user.distance && <span className="ml-1">• {user.distance}km</span>}
          </div>
          <UserBadges isOnline={user.is_online} isVerified={user.is_verified} vipLevel={user.vip_level} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 py-4 px-4 border-b border-gray-100">
        <button onClick={() => navigate(`/chat/${uid}`)}
          className="flex flex-col items-center gap-1 p-3 hover:bg-gray-50 rounded-xl transition-colors">
          <MessageCircle size={24} className="text-gray-600" />
          <span className="text-[10px] text-gray-500">Nhắn tin</span>
        </button>
        <button onClick={() => likeMut.mutate()}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-200 active:scale-90 transition-transform">
          <Heart size={28} className="text-white fill-white" />
        </button>
        <button onClick={() => navigate(`/video-call/${uid}`)}
          className="flex flex-col items-center gap-1 p-3 hover:bg-gray-50 rounded-xl transition-colors">
          <Video size={24} className="text-gray-600" />
          <span className="text-[10px] text-gray-500">Video</span>
        </button>
      </div>

      {/* Details */}
      <div className="px-4 py-4 space-y-4">
        {user.bio && (
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1.5">Giới thiệu</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{user.bio}</p>
          </div>
        )}

        {/* Tags */}
        {user.tags?.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-2">Sở thích</h3>
            <div className="flex flex-wrap gap-2">
              {user.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1.5 bg-pink-50 text-pink-600 text-xs font-medium rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Basic info */}
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-2">Thông tin</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: '📏', label: 'Chiều cao', value: user.height ? `${user.height}cm` : undefined },
              { icon: '🎓', label: 'Học vấn', value: user.education },
              { icon: '💼', label: 'Nghề nghiệp', value: user.job },
              { icon: '💍', label: 'Hôn nhân', value: user.marriage },
            ].filter(i => i.value).map(item => (
              <div key={item.label} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-[10px] text-gray-400">{item.label}</p>
                  <p className="text-xs font-semibold text-gray-800">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Album photos */}
        {user.photos?.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-2">Album</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {user.photos.map((p: string, i: number) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
