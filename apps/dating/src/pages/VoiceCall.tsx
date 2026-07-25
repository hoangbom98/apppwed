import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCallStore } from '@/store/callStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useQuery } from '@tanstack/react-query';
import { getUserById } from '@/api/users';
import { Phone, Mic, MicOff, Volume2 } from 'lucide-react';
import { formatDuration } from '@/utils/formatters';
import Avatar from '@/components/common/Avatar';

export default function VoiceCall() {
  const { userId } = useParams<{ userId: string }>();
  const uid = Number(userId);
  const navigate = useNavigate();
  const { callState, duration, isMuted, toggleMute, tick } = useCallStore();
  const { startCall, hangup } = useWebRTC(uid, 'voice');

  const { data: partner } = useQuery({ queryKey: ['user', uid], queryFn: () => getUserById(uid) });

  useEffect(() => { startCall(); }, []);
  useEffect(() => {
    if (callState !== 'active') return;
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [callState]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-between py-16 px-8">
      <div className="text-center">
        <p className="text-gray-400 text-sm mb-6">
          {callState === 'calling' ? 'Đang gọi...' : callState === 'ringing' ? 'Đang đổ chuông...' : 'Đang kết nối'}
        </p>
        <div className="relative">
          <Avatar src={partner?.avatar} name={partner?.full_name} size={120} className="mx-auto ring-4 ring-pink-400/30" />
          {callState === 'active' && (
            <div className="absolute inset-0 rounded-full animate-ping border-2 border-pink-400/40" />
          )}
        </div>
        <h2 className="text-white text-2xl font-bold mt-6">{partner?.full_name}</h2>
        {callState === 'active' && (
          <p className="text-green-400 text-lg font-mono mt-2">{formatDuration(duration)}</p>
        )}
      </div>

      <div className="flex items-center gap-8">
        <button onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-white/10'}`}>
          {isMuted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
        </button>

        <button onClick={() => { hangup(); navigate(-1); }}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40">
          <Phone size={28} className="text-white rotate-[135deg]" />
        </button>

        <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
          <Volume2 size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
}
