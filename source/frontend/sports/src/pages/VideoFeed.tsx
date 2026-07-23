import React, { useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getShortVideos, likeVideo } from '../api/sports';
import { Heart, Share2 } from 'lucide-react';
import { formatDuration } from '../utils/formatters';

export default function VideoFeedPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['short-videos'],
    queryFn: () => getShortVideos({ limit: 20 }),
    staleTime: 60_000,
  });
  const videos: any[] = data?.videos || [];
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const likeMutation = useMutation({ mutationFn: likeVideo });

  const handleLike = (id: number) => {
    if (!liked.has(id)) {
      likeMutation.mutate(id);
      setLiked(prev => new Set(prev).add(id));
    }
  };

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (videos.length === 0) return (
    <div className="h-screen flex items-center justify-center text-gray-500">
      <div className="text-center">
        <p className="text-4xl mb-3">📹</p>
        <p>Chưa có video nào.</p>
      </div>
    </div>
  );

  return (
    <div className="snap-y snap-mandatory overflow-y-scroll h-[calc(100vh-6.5rem)]">
      {videos.map((v: any) => (
        <div key={v.id} className="snap-start relative h-[calc(100vh-6.5rem)] bg-black flex items-center">
          <video
            src={v.videoUrl}
            className="w-full max-h-full object-contain"
            autoPlay muted loop playsInline
          />
          {/* Duration badge */}
          {v.duration && (
            <span className="absolute bottom-20 left-3 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
              {formatDuration(v.duration)}
            </span>
          )}
          {/* Actions sidebar */}
          <div className="absolute right-3 bottom-20 flex flex-col gap-4 items-center">
            <button
              onClick={() => handleLike(v.id)}
              className="flex flex-col items-center gap-0.5"
            >
              <Heart size={24} className={liked.has(v.id) ? 'text-red-500 fill-red-500' : 'text-white'} />
              <span className="text-[10px] text-white">{v.likes + (liked.has(v.id) ? 1 : 0)}</span>
            </button>
            <button className="flex flex-col items-center gap-0.5">
              <Share2 size={22} className="text-white" />
              <span className="text-[10px] text-white">Chia sẻ</span>
            </button>
          </div>
          {/* Info */}
          <div className="absolute bottom-4 left-3 right-14">
            <div className="flex items-center gap-2 mb-1">
              {v.user?.avatar
                ? <img src={v.user.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                : <div className="w-7 h-7 rounded-full bg-gray-600" />}
              <span className="text-white text-xs font-semibold">{v.user?.fullName || v.user?.username}</span>
            </div>
            {v.title && <p className="text-white text-sm">{v.title}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
