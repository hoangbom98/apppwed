import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStreams } from '@/api/live';
import { Users, Radio } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import { useAuthStore } from '@/store/authStore';

const CATEGORIES = ['Tất cả', 'Hẹn hò', 'Tâm sự', 'Game', 'Âm nhạc', 'Trực tiếp'];

export default function Live() {
  const navigate = useNavigate();
  useAuthStore();
  const [cat, setCat] = useState('Tất cả');
  const { data, isLoading } = useQuery({
    queryKey: ['live-streams', cat],
    queryFn: () => getStreams({ category: cat === 'Tất cả' ? undefined : cat }),
    refetchInterval: 30_000,
  });
  const streams = data?.streams || [];

  return (
    <div>
      <div className="px-4 pt-4 flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-gray-900">📺 Live</h1>
        <button onClick={() => navigate('/broadcast')}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-sm font-semibold rounded-xl shadow-sm">
          <Radio size={14} /> Phát Live
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-none">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${cat === c ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : streams.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="text-5xl mb-3">📡</div>
          <p className="text-gray-500">Không có ai đang live</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {streams.map((s: any) => (
            <div key={s.id} className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform aspect-[3/4]"
              onClick={() => navigate(`/live/${s.id}`)}>
              {s.thumbnail
                ? <img src={s.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" width="200" height="267" />
                : <div className="w-full h-full bg-gradient-to-b from-purple-500 to-pink-500" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              {/* LIVE badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
              </div>
              {/* Viewer count */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                <Users size={10} />{s.viewer_count}
              </div>
              {/* Streamer info */}
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-center gap-2">
                <Avatar src={s.streamer.avatar} name={s.streamer.full_name} size={28} />
                <div>
                  <p className="text-white font-semibold text-xs truncate">{s.streamer.full_name}</p>
                  <p className="text-white/70 text-[10px] truncate">{s.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
