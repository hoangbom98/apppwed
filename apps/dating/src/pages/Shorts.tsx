import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShorts, likeShort, shareShort } from '@/api/shorts';
import { useAuthStore } from '@/store/authStore';
import { Heart, MessageCircle, Share2, Gift, Music, Crown, Volume2, VolumeX, Pause } from 'lucide-react';
import Avatar from '@/components/common/Avatar';

// VIP prompt overlay — based on applive18 video_detail.html pattern
function VipPrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-28 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
      <div className="bg-gradient-to-b from-amber-900/90 to-amber-950/95 border border-amber-700/50 rounded-2xl p-5 mx-6 mb-4 text-center backdrop-blur-sm">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
          <Crown size={28} className="text-white" />
        </div>
        <h3 className="text-white font-black text-lg mb-1">Nội dung VIP</h3>
        <p className="text-amber-200/80 text-sm mb-4 leading-relaxed">
          Đây là video dành riêng cho thành viên VIP.<br />
          Nâng cấp ngay để xem toàn bộ nội dung!
        </p>
        <div className="space-y-2">
          <button className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-white font-black rounded-xl text-sm shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2">
            <Crown size={16} /> Nâng cấp VIP ngay
          </button>
          <button onClick={onClose} className="w-full py-2.5 text-amber-300/70 hover:text-white text-xs transition-colors">
            Xem sau
          </button>
        </div>
      </div>
    </div>
  );
}

function ShortItem({ short, isActive }: { short: any; isActive: boolean }) {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const qc        = useQueryClient();
  const videoRef  = useRef<HTMLVideoElement>(null);
  const [paused,  setPaused]   = useState(false);
  const [muted,   setMuted]    = useState(true);
  const [showVip, setShowVip]  = useState(false);
  const [elapsed, setElapsed]  = useState(0);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const VIP_PAUSE_SECONDS = 20; // pause at 20s for non-VIP (applive18 pattern)
  const isVip = (user as any)?.vip_level > 0;

  const likeMut = useMutation({
    mutationFn: () => likeShort(short.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shorts'] }),
  });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive && !paused) {
      v.play().catch(() => {});
      // Start 20s VIP timer for non-VIP
      if (!isVip) {
        timerRef.current = setInterval(() => {
          setElapsed(prev => {
            if (prev >= VIP_PAUSE_SECONDS - 1) {
              clearInterval(timerRef.current!);
              v.pause();
              setShowVip(true);
              return prev;
            }
            return prev + 1;
          });
        }, 1000);
      }
    } else {
      v.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, paused, isVip]);

  // Reset when item becomes inactive
  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      setShowVip(false);
      setPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isActive]);

  const togglePause = () => {
    if (showVip) return;
    setPaused(v => !v);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(v => !v);
    }
  };

  return (
    <div className="relative w-full h-screen snap-start flex items-center justify-center bg-black">
      {/* Video */}
      {short.video_url ? (
        <video
          ref={videoRef}
          src={short.video_url}
          loop
          muted={muted}
          playsInline
          className="w-full h-full object-cover"
          onClick={togglePause}
        />
      ) : (
        // Fallback: thumbnail image for demo
        <img
          src={short.thumbnail || short.author?.avatar || '/images/sample/1.jpg'}
          alt={short.caption}
          className="w-full h-full object-cover"
          onClick={togglePause}
        />
      )}

      {/* Progress bar (non-VIP countdown) */}
      {isActive && !isVip && !showVip && elapsed > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-amber-400 transition-all"
            style={{ width: `${(elapsed / VIP_PAUSE_SECONDS) * 100}%` }}
          />
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* VIP prompt */}
      {showVip && <VipPrompt onClose={() => { setShowVip(false); setPaused(true); }} />}

      {/* Pause indicator */}
      {paused && !showVip && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
            <Pause size={32} className="text-white opacity-80" />
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-14 right-4 z-20 flex flex-col gap-2">
        <button onClick={toggleMute}
          className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white">
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-24 left-4 right-16 z-10">
        <div className="flex items-center gap-2 mb-2 cursor-pointer"
          onClick={() => navigate(`/profile/${short.author?.id}`)}>
          <Avatar src={short.author?.avatar} name={short.author?.full_name} size={32} />
          <span className="text-white font-bold text-sm drop-shadow">{short.author?.full_name || 'Ẩn danh'}</span>
          <button className="ml-1 border border-white/70 rounded-md px-2 py-0.5 text-white text-[10px] font-semibold backdrop-blur-sm">
            + Theo dõi
          </button>
          {(short.author?.vip_level > 0) && (
            <Crown size={14} className="text-amber-400 ml-1" />
          )}
        </div>
        <p className="text-white text-sm mb-2 line-clamp-2 drop-shadow">{short.caption}</p>
        <div className="flex items-center gap-2 text-white/80 text-xs">
          <Music size={12} />
          {/* marquee is non-standard; use scrolling text div instead */}
          <span className="truncate max-w-[180px] text-xs overflow-hidden inline-block" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{short.music_name || 'Nhạc gốc'}</span>
        </div>
      </div>

      {/* Right action bar */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
        {/* Like */}
        <button onClick={() => user ? likeMut.mutate() : navigate('/login')}
          className="flex flex-col items-center text-white gap-1">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            short.is_liked ? 'bg-pink-500/30' : 'bg-black/30'
          }`}>
            <Heart size={24} className={short.is_liked ? 'fill-pink-400 text-pink-400' : ''} />
          </div>
          <span className="text-xs font-medium drop-shadow">{(short.like_count || 0).toLocaleString()}</span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center text-white gap-1">
          <div className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center">
            <MessageCircle size={24} />
          </div>
          <span className="text-xs font-medium drop-shadow">{(short.comment_count || 0).toLocaleString()}</span>
        </button>

        {/* Share */}
        <button onClick={() => shareShort(short.id)}
          className="flex flex-col items-center text-white gap-1">
          <div className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center">
            <Share2 size={22} />
          </div>
          <span className="text-xs font-medium drop-shadow">Chia sẻ</span>
        </button>

        {/* Gift (VIP feature) */}
        <button onClick={() => !user ? navigate('/login') : null}
          className="flex flex-col items-center text-white gap-1">
          <div className="w-11 h-11 rounded-full bg-amber-500/30 flex items-center justify-center">
            <Gift size={22} className="text-amber-300" />
          </div>
          <span className="text-xs font-medium drop-shadow text-amber-300">Quà</span>
        </button>

        {/* Rotating music disc */}
        <div className="w-9 h-9 rounded-full border-2 border-white/50 overflow-hidden animate-spin-slow">
          <img
            src={short.author?.avatar || '/icons/ui/userpic.png'}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}

// Mock data for demo
const MOCK_SHORTS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  video_url: null, // No video — use thumbnail fallback
  thumbnail: `/images/sample/${(i % 30) + 1}.jpg`,
  caption: [
    'Hẹn hò lần đầu tại Đà Lạt ❤️🌸 #dating #love',
    'Đêm Sài Gòn lung linh quá 🌃 #saigon #night',
    'Ăn bánh mì vỉa hè cùng người yêu 🥖 #streetfood',
    'Check-in Hội An cổ kính 🏮 #hoian #travel',
    'Cà phê trứng Hà Nội thật tuyệt 🥚☕ #hanoi #cafe',
    'Bãi biển Phú Quốc đẹp quá 🏖️ #phuquoc #beach',
    'Món lẩu cua đồng ngon nhất Việt Nam 🦀🍲',
    'Hoàng hôn Mũi Né không thể không yêu 🌅',
    'Chợ đêm Đà Nẵng sôi động 🛍️ #danang',
    'Tự nấu bữa ăn lãng mạn cho người yêu 👨‍🍳❤️',
  ][i],
  like_count: Math.floor(Math.random() * 10000),
  comment_count: Math.floor(Math.random() * 500),
  is_liked: false,
  music_name: ['Yêu - Đen Vâu', 'Sóng gió - Jack', 'Có chắc yêu là đây', 'Hãy trao cho anh', 'Người ơi người ở đừng về'][i % 5],
  author: {
    id: i + 100,
    full_name: ['Minh Anh', 'Thu Hà', 'Quang Minh', 'Linh Chi', 'Hoàng Nam'][i % 5],
    avatar: null,
    vip_level: i % 3 === 0 ? 1 : 0,
  },
}));

export default function Shorts() {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useInfiniteQuery({
    queryKey: ['shorts'],
    queryFn: ({ pageParam = 0 }) => getShorts({ offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last: any, all) => last.has_more ? all.length * 10 : undefined,
  });

  const serverShorts = data?.pages.flatMap((p: any) => p.shorts || []) || [];
  const shorts = serverShorts.length > 0 ? serverShorts : MOCK_SHORTS;

  const handleScroll = () => {
    if (!containerRef.current) return;
    const idx = Math.round(containerRef.current.scrollTop / window.innerHeight);
    setActiveIdx(idx);
  };

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
      onScroll={handleScroll}
    >
      {shorts.map((s: any, idx: number) => (
        <ShortItem key={s.id || idx} short={s} isActive={idx === activeIdx} />
      ))}

      {/* Load more trigger */}
      {shorts.length > 0 && (
        <div className="h-screen snap-start flex items-center justify-center bg-black">
          <div className="text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Đang tải thêm...</p>
          </div>
        </div>
      )}
    </div>
  );
}
