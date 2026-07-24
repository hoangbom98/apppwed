import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, Play, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { getGameBySlug, startSession } from '@/api/apiGame';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/chung/KhungTaiTrang';

export default function GameDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  const { data: game, isLoading } = useQuery({
    queryKey: ['game', slug],
    queryFn: () => getGameBySlug(slug!),
    enabled: !!slug,
  });

  const startMut = useMutation({
    mutationFn: () => startSession(game.id),
    onSuccess: (data: any) => {
      if (data.playUrl) setIframeSrc(data.playUrl);
      else navigate('/login?redirect=/games/' + slug);
    },
    onError: (err: any) => {
      if (err.response?.status === 401) navigate('/login?redirect=/games/' + slug);
      else toast.error(err?.response?.data?.message || 'Không thể khởi động game');
    },
  });

  if (isLoading) return (
    <div className="max-w-lg mx-auto space-y-4 animate-pulse">
      <Skeleton className="h-8 w-1/3 rounded" />
      <Skeleton className="h-52 rounded-2xl" />
      <Skeleton className="h-4 rounded w-3/4" />
      <Skeleton className="h-4 rounded w-1/2" />
    </div>
  );

  if (!game) return <div className="text-center text-gray-400 py-20">Game không tồn tại</div>;

  // Full-screen game iframe mode
  if (iframeSrc) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
        <div className="flex items-center gap-3 px-4 h-12 bg-dark border-b border-white/10">
          <button onClick={() => setIframeSrc(null)} className="text-gray-300 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-white">{game.name}</span>
        </div>
        <iframe src={iframeSrc} className="flex-1 w-full border-0" title={game.name} allow="fullscreen" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-400 hover:text-gray-700 dark:hover:text-white text-sm">
        <ChevronLeft className="w-4 h-4" /> Quay lại
      </button>

      {/* Game cover */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 aspect-video flex items-center justify-center">
        {game.thumbnail
          ? <img src={game.thumbnail} alt={game.name} className="w-full h-full object-cover" />
          : <img src="/wap/img/home_muen.png" alt="game" className="w-20 h-20 object-contain opacity-40" />
        }
      </div>

      {/* Info */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          {game.type && (
            <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded-full font-semibold">{game.type}</span>
          )}
          {game.provider && <span className="text-xs text-gray-500">{game.provider}</span>}
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">{game.name}</h1>
        {game.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-2">{game.description}</p>
        )}
      </div>

      {/* CTA */}
      {user ? (
        <button
          onClick={() => startMut.mutate()}
          disabled={startMut.isPending}
          className="w-full py-4 bg-primary hover:bg-secondary text-white font-black rounded-2xl text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          {startMut.isPending
            ? 'Đang vào game...'
            : <><Play className="w-5 h-5" /> Chơi ngay</>
          }
        </button>
      ) : (
        <button
          onClick={() => navigate('/login?redirect=/games/' + slug)}
          className="w-full py-4 bg-primary hover:bg-secondary text-white font-black rounded-2xl text-lg flex items-center justify-center gap-2 transition-colors"
        >
          <ExternalLink className="w-5 h-5" /> Đăng nhập để chơi
        </button>
      )}
    </div>
  );
}
