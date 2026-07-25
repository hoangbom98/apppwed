import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStreams } from '../api/sports';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

export default function StreamsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['streams'],
    queryFn: () => getStreams(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const streams: any[] = data?.streams || [];

  return (
    <div className="p-4">
      <h1 className="text-base font-bold mb-4">Livestream</h1>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="aspect-video bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {streams.map((s: any) => (
          <Link key={s.id} to={`/streams/${s.id}`} className="block">
            <div className="relative aspect-video bg-gray-700 rounded-xl overflow-hidden">
              {s.thumbnail
                ? <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Live</div>}
              {s.status === 'live' && (
                <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse">LIVE</span>
              )}
              <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 text-white text-[9px] px-1 rounded">
                <Eye size={9} />{s.viewers}
              </span>
            </div>
            <p className="text-xs font-medium mt-1.5 line-clamp-2 leading-snug">{s.title}</p>
            {s.streamer && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                {s.streamer.user?.fullName || s.streamer.displayName}
              </p>
            )}
          </Link>
        ))}
      </div>

      {!isLoading && streams.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-sm text-gray-500 mb-3">Không có livestream</p>
          <p>Không có livestream nào đang diễn ra.</p>
        </div>
      )}
    </div>
  );
}
