import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getStream, getStreamChat, joinStream, leaveStream } from '../api/sports';
import { getSocket } from '../hooks/useSocket';
import { useAuthStore } from '../store/authStore';
import { Send, Eye } from 'lucide-react';

export default function StreamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const streamId = Number(id);
  const { user, isLoggedIn } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const chatBottom = useRef<HTMLDivElement>(null);

  const { data: stream } = useQuery({
    queryKey: ['stream', streamId],
    queryFn: () => getStream(streamId),
    staleTime: 30_000,
  });

  const { data: chatHistory } = useQuery({
    queryKey: ['stream-chat', streamId],
    queryFn: () => getStreamChat(streamId),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (chatHistory?.messages) setMessages(chatHistory.messages);
  }, [chatHistory]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('join_sports_live', streamId);
    joinStream(streamId).catch(() => {});

    const onMsg = (e: Event) => {
      const msg = (e as CustomEvent).detail;
      setMessages(prev => [...prev, msg]);
      chatBottom.current?.scrollIntoView({ behavior: 'smooth' });
    };
    window.addEventListener('sports:live_chat', onMsg);

    return () => {
      socket.emit('leave_sports_live', streamId);
      leaveStream(streamId).catch(() => {});
      window.removeEventListener('sports:live_chat', onMsg);
    };
  }, [streamId]);

  const sendMsg = () => {
    const socket = getSocket();
    if (!socket || !msg.trim() || !isLoggedIn) return;
    socket.emit('sports_live_chat', {
      streamId,
      message: msg.trim(),
      username: user?.fullName || user?.username,
      avatar: null,
    });
    setMsg('');
  };

  if (!stream) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Video player */}
      <div className="relative bg-black aspect-video w-full">
        {stream.recordUrl || stream.status === 'live' ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-400">
            <div className="text-center">
              <p className="text-2xl mb-1">📡</p>
              <p className="text-xs">Stream đang phát</p>
              {stream.status === 'live' && (
                <span className="inline-block mt-1 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</span>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-400">
            <p className="text-sm">Stream đã kết thúc</p>
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
          <Eye size={10} /> {stream.viewers} đang xem
        </div>
      </div>

      {/* Stream info */}
      <div className="px-3 py-2 bg-gray-900 border-b border-gray-800">
        <p className="text-sm font-semibold">{stream.title}</p>
        {stream.streamer && (
          <p className="text-xs text-gray-400">{stream.streamer.displayName || stream.streamer.user?.fullName}</p>
        )}
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-950">
        {messages.map((m: any, i: number) => (
          <div key={m.id || i} className="flex gap-2 text-sm">
            <span className="font-semibold text-green-400 flex-shrink-0">{m.username}:</span>
            <span className="text-gray-200">{m.message}</span>
          </div>
        ))}
        <div ref={chatBottom} />
      </div>

      {/* Chat input */}
      {isLoggedIn ? (
        <div className="flex gap-2 p-2 bg-gray-900 border-t border-gray-800">
          <input
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-gray-800 rounded-full px-3 py-1.5 text-sm focus:outline-none"
          />
          <button onClick={sendMsg} className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <Send size={14} />
          </button>
        </div>
      ) : (
        <div className="p-2 bg-gray-900 border-t border-gray-800 text-center text-xs text-gray-500">
          Đăng nhập để chat
        </div>
      )}
    </div>
  );
}
