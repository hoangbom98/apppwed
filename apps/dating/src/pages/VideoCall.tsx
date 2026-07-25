import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCallStore } from '@/store/callStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useQuery } from '@tanstack/react-query';
import { getUserById } from '@/api/users';
import { Phone, Mic, MicOff, Camera, CameraOff, Gift } from 'lucide-react';
import { formatDuration } from '@/utils/formatters';

export default function VideoCall() {
  const { userId } = useParams<{ userId: string }>();
  const uid = Number(userId);
  const navigate = useNavigate();
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const { callState, localStream, remoteStream, duration, isMuted, isCameraOff, toggleMute, toggleCamera, tick } = useCallStore();
  const { startCall, hangup } = useWebRTC(uid, 'video');
  const { data: partner } = useQuery({ queryKey: ['user', uid], queryFn: () => getUserById(uid) });

  useEffect(() => { startCall(); }, []);
  useEffect(() => {
    if (localRef.current && localStream) localRef.current.srcObject = localStream;
  }, [localStream]);
  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);
  useEffect(() => {
    if (callState !== 'active') return;
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [callState]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Remote video (full screen) */}
      <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover absolute inset-0" />

      {/* Local video (PiP) */}
      <div className="absolute top-16 right-4 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/40 shadow-xl">
        <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {isCameraOff && <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <CameraOff size={24} className="text-gray-400" />
        </div>}
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 px-4 pt-12 pb-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between">
        <div>
          <p className="text-white font-bold">{partner?.full_name}</p>
          {callState === 'active'
            ? <p className="text-green-400 font-mono text-sm">{formatDuration(duration)}</p>
            : <p className="text-yellow-300 text-sm animate-pulse">Đang kết nối…</p>}
        </div>
        <button className="px-3 py-1.5 bg-white/20 rounded-full text-white text-xs flex items-center gap-1">
          <Gift size={14} /> Gửi quà
        </button>
      </div>

      {/* Controls */}
      <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-5">
        <button onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'}`}>
          {isMuted ? <MicOff size={22} className="text-white" /> : <Mic size={22} className="text-white" />}
        </button>
        <button onClick={() => { hangup(); navigate(-1); }}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
          <Phone size={26} className="text-white rotate-[135deg]" />
        </button>
        <button onClick={toggleCamera}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${isCameraOff ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'}`}>
          {isCameraOff ? <CameraOff size={22} className="text-white" /> : <Camera size={22} className="text-white" />}
        </button>
      </div>
    </div>
  );
}
