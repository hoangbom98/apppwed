import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStories, viewStory } from '@/api/stories';
import { X, Plus } from 'lucide-react';

export default function Stories() {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['stories'], queryFn: getStories });
  const stories = data?.stories || [];
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const current = stories[activeIdx];

  useEffect(() => {
    if (!current) return;
    viewStory(current.id);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (activeIdx < stories.length - 1) { setActiveIdx(i => i + 1); return 0; }
          else { navigate(-1); return 100; }
        }
        return p + (100 / 50);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [activeIdx]);

  if (stories.length === 0) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <button onClick={() => navigate(-1)} className="text-white">Không có story</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Progress bars */}
      <div className="flex gap-1 px-4 pt-12 z-20 relative">
        {stories.map((_: any, i: number) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-none"
              style={{ width: `${i < activeIdx ? 100 : i === activeIdx ? progress : 0}%` }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 z-20 relative">
        <div className="flex items-center gap-2">
          {current && <>
            <img src={current.user.avatar || ''} alt="" className="w-8 h-8 rounded-full object-cover" />
            <div>
              <p className="text-white font-bold text-sm">{current.user.full_name}</p>
              <p className="text-white/60 text-xs">{current.created_at}</p>
            </div>
          </>}
        </div>
        <button onClick={() => navigate(-1)} className="text-white"><X size={22} /></button>
      </div>

      {/* Story content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {current?.media_url && (
          current.type === 'video'
            ? <video src={current.media_url} autoPlay loop muted className="w-full h-full object-cover" />
            : <img src={current.media_url} alt="" className="w-full h-full object-cover" />
        )}
        {current?.text && (
          <div className="absolute bottom-20 left-4 right-4 text-center">
            <p className="text-white text-2xl font-bold text-shadow-lg">{current.text}</p>
          </div>
        )}
      </div>

      {/* Tap areas */}
      <div className="absolute inset-0 flex z-10">
        <div className="flex-1" onClick={() => activeIdx > 0 && setActiveIdx(i => i - 1)} />
        <div className="flex-1" onClick={() => activeIdx < stories.length - 1 ? setActiveIdx(i => i + 1) : navigate(-1)} />
      </div>
    </div>
  );
}
