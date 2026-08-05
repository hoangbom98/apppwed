import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSwipeProfiles, likeUser, nopeUser, superLike } from '@/api/match';
import { useMatchStore } from '@/store/matchStore';
import { Heart, X, Star, Zap } from 'lucide-react';
import { CheckOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

import { Profile } from '@/types';

function MatchPopup({ user, onClose }: { user: Profile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-pink-500/90 to-rose-600/90 z-50 flex flex-col items-center justify-center px-8">
      <div className="text-center">
        <div className="mb-6 animate-bounce"><Heart size={72} className="text-pink-400 fill-pink-400" /></div>
        <h2 className="text-white text-3xl font-black mb-2">Match!</h2>
        <p className="text-white/80 text-base mb-8">Bạn và {user?.full_name} đã ghép đôi!</p>
        <div className="flex gap-4 justify-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/40" />}
          </div>
        </div>
        <div className="space-y-3 w-full max-w-xs">
          <button onClick={() => { onClose(); }}
            className="w-full py-3.5 bg-white text-pink-500 font-bold rounded-2xl shadow-lg">
            Nhắn tin ngay
          </button>
          <button onClick={onClose} className="w-full py-3 text-white/80 text-sm">Tiếp tục swipe</button>
        </div>
      </div>
    </div>
  );
}

function SwipeCard({ profile, onLike, onNope, onSuperLike, isTop }: {
  profile: Profile; onLike: () => void; onNope: () => void; onSuperLike: () => void; isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-20, 0, 20]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);
  const navigate = useNavigate();

  const handleDragEnd = (unusedEvent: any, info: any) => {
    if (info.offset.x > 120) onLike();
    else if (info.offset.x < -120) onNope();
    else if (info.offset.y < -80) onSuperLike();
    else animate(x, 0, { type: 'spring', stiffness: 300 });
  };

  return (
    <motion.div
      style={{ x, rotate, zIndex: isTop ? 10 : 5 }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 rounded-3xl overflow-hidden shadow-xl cursor-grab active:cursor-grabbing"
    >
      {/* Background photo */}
      {profile.photos?.[0] || profile.avatar
        ? <img src={profile.photos?.[0] || profile.avatar} alt="" className="w-full h-full object-cover" loading="lazy" width="400" height="600" />
        : <div className="w-full h-full bg-gradient-to-b from-pink-300 to-rose-500" />}

      {/* Like overlay */}
      <motion.div style={{ opacity: likeOpacity }}
        className="absolute top-12 left-6 border-4 border-green-400 rounded-xl px-4 py-2 rotate-[-15deg]">
        <span className="text-green-400 font-black text-2xl">LIKE</span>
      </motion.div>

      {/* Nope overlay */}
      <motion.div style={{ opacity: nopeOpacity }}
        className="absolute top-12 right-6 border-4 border-red-400 rounded-xl px-4 py-2 rotate-[15deg]">
        <span className="text-red-400 font-black text-2xl">NOPE</span>
      </motion.div>

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 py-6"
        onClick={() => navigate(`/profile/${profile.id}`)}>
        <div className="flex items-end gap-2 mb-2">
          <h2 className="text-white font-black text-2xl">{profile.full_name}</h2>
          <span className="text-white/80 text-xl font-semibold">{profile.age}</span>
          {profile.is_verified && <CheckOutlined className="text-blue-400 text-lg" />}
        </div>
        <p className="text-white/80 text-sm mb-2"><EnvironmentOutlined /> {profile.city}</p>
        {profile.bio && <p className="text-white/70 text-xs line-clamp-2">{profile.bio}</p>}
        {profile.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.tags.slice(0, 4).map((tag: string) => (
              <span key={tag} className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Swipe() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { deck, setDeck, removeTop, newMatch, setNewMatch } = useMatchStore();

  useQuery({
    queryKey: ['swipe-profiles'],
    queryFn: async () => {
      const data = await getSwipeProfiles();
      setDeck(data.profiles || []);
      return data;
    },
    enabled: deck.length === 0,
  });

  const likeMut   = useMutation({ mutationFn: (id: number) => likeUser(id),
    onSuccess: (data: any) => { if (data.match) setNewMatch(deck[0]); removeTop(); } });
  const nopeMut   = useMutation({ mutationFn: (id: number) => nopeUser(id), onSuccess: removeTop });
  const superMut  = useMutation({ mutationFn: (id: number) => superLike(id),
    onSuccess: (data: any) => { if (data.match) setNewMatch(deck[0]); removeTop(); } });

  const top = deck[0];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] px-4">
      {/* Card stack */}
      <div className="relative flex-1 mt-4 max-w-sm mx-auto w-full">
        {deck.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl mb-4"><Heart size={56} className="text-pink-200 fill-pink-100" /></div>
            <h3 className="text-gray-700 font-bold text-lg">Hết người rồi!</h3>
            <p className="text-gray-400 text-sm mt-1">Quay lại sau để xem thêm</p>
            <button onClick={() => qc.invalidateQueries({ queryKey: ['swipe-profiles'] })}
              className="mt-6 px-6 py-3 bg-pink-500 text-white rounded-xl font-semibold">
              Làm mới
            </button>
          </div>
        ) : (
          deck.slice(0, 3).toReversed().map((profile, idx, arr) => (
            <SwipeCard key={profile.id} profile={profile}
              isTop={idx === arr.length - 1}
              onLike={() => top && likeMut.mutate(top.id)}
              onNope={() => top && nopeMut.mutate(top.id)}
              onSuperLike={() => top && superMut.mutate(top.id)}
            />
          ))
        )}
      </div>

      {/* Action buttons */}
      {deck.length > 0 && (
        <div className="flex items-center justify-center gap-4 pb-4 mt-4">
          <button onClick={() => top && nopeMut.mutate(top.id)}
            className="w-14 h-14 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center active:scale-90 transition-transform">
            <X size={28} className="text-red-400" />
          </button>
          <button onClick={() => top && superMut.mutate(top.id)}
            className="w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center active:scale-90 transition-transform">
            <Star size={22} className="text-blue-400" />
          </button>
          <button onClick={() => top && likeMut.mutate(top.id)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-400 shadow-md shadow-pink-200 flex items-center justify-center active:scale-90 transition-transform">
            <Heart size={28} className="text-white fill-white" />
          </button>
          <button
            className="w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center active:scale-90 transition-transform">
            <Zap size={22} className="text-amber-400" />
          </button>
        </div>
      )}

      {/* Match popup */}
      {newMatch && <MatchPopup user={newMatch} onClose={() => { setNewMatch(null); navigate('/chat'); }} />}
    </div>
  );
}
