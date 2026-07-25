import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDiscovery } from '@/api/users';
import { SlidersHorizontal } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import UserBadges from '@/components/common/UserBadges';
import BottomSheet from '@/components/common/BottomSheet';
import PageHeader from '@/components/common/PageHeader';

interface Filters { minAge: number; maxAge: number; gender: string; onlineOnly: boolean; verifiedOnly: boolean; }

export default function Discovery() {
  const navigate = useNavigate();
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Filters>({ minAge: 18, maxAge: 40, gender: 'all', onlineOnly: false, verifiedOnly: false });

  const { data, isLoading } = useQuery({
    queryKey: ['discovery', filters],
    queryFn: () => getDiscovery(filters),
  });

  const users = data?.users || [];

  return (
    <div>
      <PageHeader title="Khám phá"
        rightSlot={
          <button onClick={() => setShowFilter(true)} className="p-2 rounded-full hover:bg-gray-100">
            <SlidersHorizontal size={20} className="text-gray-600" />
          </button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 px-4 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pt-2">
          {users.map((u: any) => (
            <div key={u.id} className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform aspect-[3/4]"
              onClick={() => navigate(`/profile/${u.id}`)}>
              {u.avatar
                ? <img src={u.avatar} alt={u.full_name} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-b from-pink-300 to-rose-400" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                <p className="text-white font-bold text-sm">{u.full_name}, {u.age}</p>
                <p className="text-white/70 text-xs flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/60" />{u.city}
                </p>
                <div className="mt-1">
                  <UserBadges isOnline={u.is_online} isVerified={u.is_verified} vipLevel={u.vip_level} size="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Sheet */}
      <BottomSheet isOpen={showFilter} onClose={() => setShowFilter(false)} title="Bộ lọc">
        <div className="space-y-5 pt-2">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Độ tuổi: {filters.minAge} – {filters.maxAge}</label>
            <div className="flex gap-3">
              <input type="range" min={18} max={60} value={filters.minAge}
                onChange={e => setFilters(f => ({ ...f, minAge: +e.target.value }))}
                className="flex-1 accent-pink-500" />
              <input type="range" min={18} max={60} value={filters.maxAge}
                onChange={e => setFilters(f => ({ ...f, maxAge: +e.target.value }))}
                className="flex-1 accent-pink-500" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Giới tính</label>
            <div className="flex gap-2">
              {[{v:'all',l:'Tất cả'},{v:'female',l:'Nữ'},{v:'male',l:'Nam'}].map(g => (
                <button key={g.v} onClick={() => setFilters(f => ({ ...f, gender: g.v }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filters.gender === g.v ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-600'}`}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Chỉ online</span>
            <button onClick={() => setFilters(f => ({ ...f, onlineOnly: !f.onlineOnly }))}
              className={`w-12 h-6 rounded-full transition-colors ${filters.onlineOnly ? 'bg-pink-500' : 'bg-gray-200'}`}>
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${filters.onlineOnly ? 'translate-x-6.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Đã xác minh</span>
            <button onClick={() => setFilters(f => ({ ...f, verifiedOnly: !f.verifiedOnly }))}
              className={`w-12 h-6 rounded-full transition-colors ${filters.verifiedOnly ? 'bg-pink-500' : 'bg-gray-200'}`}>
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${filters.verifiedOnly ? 'translate-x-6.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <button onClick={() => setShowFilter(false)}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-xl font-bold">
            Áp dụng bộ lọc
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
