import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { getAlbum, getProfileStats } from '@/api/profile';
import { Settings, Edit, Crown, Shield, Grid3X3 } from 'lucide-react';
import {
  CreditCardOutlined, CrownOutlined, GiftOutlined, RocketOutlined,
  CalendarOutlined, UsergroupAddOutlined, GlobalOutlined,
  SettingOutlined, MobileOutlined, DollarOutlined, DiamondOutlined,
} from '@ant-design/icons';
import { VIP_NAMES } from '@/utils/constants';
import { formatAge } from '@/utils/formatters';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: albumData } = useQuery({ queryKey: ['album-me'], queryFn: () => getAlbum() });
  const { data: statsData } = useQuery({ queryKey: ['profile-stats-me'], queryFn: getProfileStats });
  const photos = albumData?.photos || [];
  const stats = statsData?.stats;

  if (!user) return null;

  return (
    <div className="pb-6">
      {/* Cover + Avatar */}
      <div className="relative h-48 bg-gradient-to-br from-pink-400 to-rose-500">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="relative">
            <img src={user.avatar || ''} alt={user.full_name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg bg-pink-200" />
            {user.vip_level > 0 && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                <Crown size={12} className="text-white" />
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => navigate('/settings')} className="p-2 bg-black/30 rounded-full text-white">
            <Settings size={18} />
          </button>
          <button onClick={() => navigate('/profile/edit')} className="p-2 bg-black/30 rounded-full text-white">
            <Edit size={18} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="pt-16 px-4 text-center">
        <h2 className="text-xl font-black text-gray-900">
          {user.full_name}
          {user.is_verified && <Shield size={14} className="inline ml-1.5 text-blue-500" />}
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">{formatAge(user.dob)} tuổi • {user.city}</p>
        {user.vip_level > 0 && (
          <span className="inline-flex items-center gap-1 mt-1.5 px-3 py-1 bg-amber-100 text-amber-600 text-xs font-bold rounded-full">
            <Crown size={11} /> VIP {VIP_NAMES[user.vip_level]}
          </span>
        )}
        {user.bio && <p className="text-gray-600 text-sm mt-3 leading-relaxed">{user.bio}</p>}

        {/* Stats row */}
        <div className="flex justify-around mt-5 py-4 border-y border-gray-100">
          {[
            { label: 'Lượt thích', value: stats?.likes_received ?? '---' },
            { label: 'Match', value: stats?.matches ?? '---' },
            { label: 'Người theo dõi', value: stats?.followers ?? '---' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-black text-gray-900 text-lg">
                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
              </p>
              <p className="text-gray-400 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Coin row */}
        <div className="flex justify-around mt-4">
          <div className="flex items-center gap-1.5 bg-amber-50 rounded-xl px-4 py-2">
            <DollarOutlined className="text-amber-500" />
            <span className="font-bold text-amber-700 text-sm">{user.coins.toLocaleString()} xu</span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 rounded-xl px-4 py-2">
            <DiamondOutlined className="text-blue-500" />
            <span className="font-bold text-blue-700 text-sm">{user.diamonds.toLocaleString()} kim cương</span>
          </div>
        </div>
      </div>

      {/* Quick menu */}
      <div className="px-4 mt-5 grid grid-cols-4 gap-3">
        {([
          { icon: <CreditCardOutlined />,      label: 'Ví',         path: '/wallet' },
          { icon: <CrownOutlined />,           label: 'VIP',        path: '/vip' },
          { icon: <GiftOutlined />,            label: 'Cửa hàng',   path: '/shop' },
          { icon: <RocketOutlined />,          label: 'Level',      path: '/level' },
          { icon: <CalendarOutlined />,        label: 'Điểm danh',  path: '/daily' },
          { icon: <UsergroupAddOutlined />,    label: 'Giới thiệu', path: '/referral' },
          { icon: <GlobalOutlined />,          label: 'Sáng tạo',   path: '/creator' },
          { icon: <SettingOutlined />,         label: 'Cài đặt',    path: '/settings' },
          { icon: <MobileOutlined />,          label: 'Tải App',    path: '/download' },
        ] as { icon: React.ReactNode; label: string; path: string }[]).map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 hover:bg-pink-50 rounded-2xl transition-colors">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[10px] text-gray-600">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Album */}
      {photos.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><Grid3X3 size={16} /> Album</h3>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {photos.slice(0, 9).map((p: any) => (
              <div key={p.id} className="aspect-square rounded-xl overflow-hidden">
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
