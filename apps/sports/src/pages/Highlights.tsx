import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHighlights } from '../api/sports';
import HighlightCard from '../components/HighlightCard';

export default function HighlightsPage() {
  const [playing, setPlaying] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['highlights'],
    queryFn: () => getHighlights({ limit: 30 }),
    staleTime: 120_000,
  });
  const highlights: any[] = data?.highlights || [];

  return (
    <div className="p-4">
      <h1 className="text-base font-bold mb-4">Highlights</h1>

      {/* Video modal */}
      {playing && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPlaying(null)}>
          <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <video src={playing.videoUrl} controls autoPlay className="w-full rounded-xl" />
            <p className="text-sm font-semibold mt-2">{playing.title}</p>
            <button onClick={() => setPlaying(null)} className="mt-2 text-xs text-gray-400 hover:text-white">Đóng</button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-video bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {highlights.map((h: any) => (
          <HighlightCard key={h.id} highlight={h} onClick={() => setPlaying(h)} />
        ))}
      </div>

      {!isLoading && highlights.length === 0 && (
        <p className="text-center text-gray-500 py-16">Chưa có highlight.</p>
      )}
    </div>
  );
}
