import React, { useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useSportsStore } from '../store/sportsStore';
import { getFavourites, getUnreadCount } from '../api/sports';

export default function ProfilePage() {
  const { user, isLoggedIn, logout } = useAuthStore();
  const { unreadCount, setUnreadCount, favouriteTeams, favouriteLeagues, setFavourites } = useSportsStore();

  const { data: favData } = useQuery({
    queryKey: ['favourites'],
    queryFn: getFavourites,
    enabled: isLoggedIn,
    staleTime: 300_000,
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    getUnreadCount().then(setUnreadCount).catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    if (!favData?.favorites) return;
    const teams = favData.favorites.filter((f: any) => f.teamId).map((f: any) => f.teamId);
    const leagues = favData.favorites.filter((f: any) => f.leagueId).map((f: any) => f.leagueId);
    setFavourites(teams, leagues);
  }, [favData]);

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="p-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        {user?.avatar
          ? <img src={user.avatar} className="w-16 h-16 rounded-full object-cover" alt="" />
          : <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-2xl font-black text-white">
              {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
            </div>}
        <div>
          <p className="text-base font-bold">{user?.fullName || user?.username}</p>
          <p className="text-xs text-gray-500">@{user?.username}</p>
          {user?.role !== 'user' && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-green-600/20 text-green-400 text-[10px] rounded-full font-semibold uppercase">{user?.role}</span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Yêu thích', value: (favouriteTeams.length + favouriteLeagues.length) },
          { label: 'Thông báo', value: unreadCount },
          { label: 'Vai trò', value: user?.role },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="space-y-2">
        {[
          { label: 'Thông báo', to: '/notifications' },
          { label: 'Yêu thích', to: '/schedule' },
          { label: 'Video của tôi', to: '/videos' },
          { label: 'Cài đặt', to: '/settings' },
          { label: 'Hỗ trợ', to: '/support' },
          { label: 'FAQ', to: '/knowledge' },
          { label: 'Tải ứng dụng', to: '/download' },
          ...(user?.role === 'admin' ? [{ label: 'Admin Sports', to: '/admin' }] : []),
        ].map(m => (
          <Link key={m.to} to={m.to} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
            <span className="text-sm">{m.label}</span>
            <span className="text-gray-500">›</span>
          </Link>
        ))}

        <button
          onClick={() => { logout(); }}
          className="w-full bg-red-900/30 border border-red-800/30 text-red-400 rounded-xl px-4 py-3 text-sm font-medium mt-4"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
