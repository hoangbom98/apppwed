import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getStream, sendLiveGift, joinStream, leaveStream } from '@/api/live';
import { getGifts } from '@/api/shop';
import { useLiveSocket } from '@/hooks/useLiveSocket';
import { useLiveStore } from '@/store/liveStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/hooks/useSocket';
import { ArrowLeft, Heart, Share2, Gift, Users, Send } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import BottomSheet from '@/components/common/BottomSheet';

export default function LiveRoom() {
  const { id } = useParams<{ id: string }>();
  const streamId = Number(id);
  const navigate = useNavigate();
  useAuthStore();
  const { chatMessages, viewerCount, giftQueue, shiftGift } = useLiveStore();
  const [showGifts, setShowGifts] = useState(false);
  const [chatText, setChatText] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useLiveSocket(streamId);

  const { data: streamData } = useQuery({
    queryKey: ['stream', streamId],
    queryFn: () => getStream(streamId),
  });
  const { data: giftsData } = useQuery({ queryKey: ['gifts'], queryFn: getGifts });

  useEffect(() => { joinStream(streamId); return () => { leaveStream(streamId); }; }, [streamId]);
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [chatMessages.length]);

  // Process gift animation queue
  useEffect(() => {
    if (giftQueue.length > 0) {
      const t = setTimeout(() => shiftGift(), 3000);
      return () => clearTimeout(t);
    }
  }, [giftQueue.length]);

  const sendChat = () => {
    const socket = getSocket?.();
    if (socket && chatText.trim()) {
      socket.emit('live:chat', { stream_id: streamId, content: chatText });
      setChatText('');
    }
  };

  const giftMut = useMutation({
    mutationFn: (giftId: number) => sendLiveGift({ stream_id: streamId, gift_id: giftId }),
  });

  const stream = streamData?.stream;

  return (
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      {/* Video background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/60 via-transparent to-black/80" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-black/30 rounded-full text-white">
          <ArrowLeft size={20} />
        </button>
        {stream && (
          <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-1.5">
            <Avatar src={stream.streamer.avatar} name={stream.streamer.full_name} size={28} />
            <div>
              <p className="text-white text-xs font-bold">{stream.streamer.full_name}</p>
              <p className="text-white/60 text-[10px]">{stream.title}</p>
            </div>
            <button className="ml-2 bg-pink-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
              Theo dõi
            </button>
          </div>
        )}
        <div className="flex items-center gap-1 bg-black/40 rounded-full px-3 py-1.5 text-white text-xs">
          <Users size={12} /> {viewerCount}
        </div>
      </div>

      {/* Gift animation */}
      {giftQueue[0] && (
        <div className="absolute top-1/3 left-0 right-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-black/60 rounded-2xl px-6 py-4 text-center animate-bounce">
            <div className="text-5xl mb-2">{giftQueue[0].gift_icon}</div>
            <p className="text-white font-bold text-sm">{giftQueue[0].sender} tặng {giftQueue[0].gift_name}</p>
          </div>
        </div>
      )}

      {/* Right action buttons */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-4 z-10">
        <button className="flex flex-col items-center text-white">
          <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center">
            <Heart size={20} className="fill-pink-400 text-pink-400" />
          </div>
          <span className="text-[10px] mt-1">{stream?.like_count || 0}</span>
        </button>
        <button onClick={() => setShowGifts(true)} className="flex flex-col items-center text-white">
          <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center">
            <Gift size={20} className="text-amber-400" />
          </div>
          <span className="text-[10px] mt-1">Quà</span>
        </button>
        <button className="flex flex-col items-center text-white">
          <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center">
            <Share2 size={20} />
          </div>
          <span className="text-[10px] mt-1">Chia sẻ</span>
        </button>
      </div>

      {/* Chat overlay */}
      <div className="absolute bottom-16 left-0 right-0 px-4 z-10">
        <div ref={chatRef} className="max-h-40 overflow-hidden space-y-1 mb-3">
          {chatMessages.slice(-20).map((msg) => (
            <div key={msg.id} className="text-sm">
              <span className="text-pink-300 font-semibold">{msg.username} </span>
              <span className="text-white/90">{msg.content}</span>
            </div>
          ))}
        </div>
        {/* Chat input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
            <input value={chatText} onChange={e => setChatText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Nhắn tin..." className="flex-1 bg-transparent text-white text-sm placeholder-white/50 outline-none" />
          </div>
          <button onClick={sendChat} className="w-9 h-9 bg-pink-500 rounded-full flex items-center justify-center">
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* Gift panel */}
      <BottomSheet isOpen={showGifts} onClose={() => setShowGifts(false)} title="Gửi quà">
        <div className="grid grid-cols-4 gap-3 pt-2">
          {(giftsData?.gifts || []).map((gift: any) => (
            <button key={gift.id} onClick={() => giftMut.mutate(gift.id)}
              className="flex flex-col items-center p-3 rounded-2xl bg-gray-50 hover:bg-pink-50 active:scale-90 transition-all">
              <span className="text-3xl mb-1">{gift.icon}</span>
              <p className="text-[10px] text-gray-600 font-medium">{gift.name}</p>
              <p className="text-[10px] text-pink-500 font-bold">{gift.price}xu</p>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
