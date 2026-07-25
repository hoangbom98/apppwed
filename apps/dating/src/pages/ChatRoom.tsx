import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getMessages, sendMessage } from '@/api/chat';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getUserById } from '@/api/users';
import Avatar from '@/components/common/Avatar';
import { ArrowLeft, Phone, Video, Send, Image, Smile, Mic, Gift } from 'lucide-react';
import { formatTime } from '@/utils/formatters';

export default function ChatRoom() {
  const { userId } = useParams<{ userId: string }>();
  const uid = Number(userId);
  const navigate = useNavigate();
  const { user: me } = useAuthStore();
  const { messages: threadMap, addMessage, typingUsers } = useChatStore();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useChatSocket(uid);

  const { data: partner } = useQuery({ queryKey: ['user', uid], queryFn: () => getUserById(uid) });

  useQuery({
    queryKey: ['messages', uid],
    queryFn: async () => {
      const data = await getMessages(uid);
      useChatStore.getState().setMessages(uid, data.messages || []);
      return data;
    },
  });

  const { mutate: sendMsg } = useMutation({
    mutationFn: () => sendMessage({ receiver_id: uid, content: text, type: 'text' }),
    onSuccess: (data: any) => { addMessage(uid, data.message); setText(''); },
  });

  const messages = threadMap[uid] || [];
  const isTyping = typingUsers.has(uid);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 text-gray-600">
          <ArrowLeft size={22} />
        </button>
        {partner && (
          <div className="flex items-center gap-2.5 flex-1 cursor-pointer" onClick={() => navigate(`/profile/${uid}`)}>
            <Avatar src={partner.avatar} name={partner.full_name} size={40} isOnline={partner.is_online} />
            <div>
              <p className="font-bold text-sm text-gray-900">{partner.full_name}</p>
              <p className="text-xs text-gray-400">{partner.is_online ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/voice-call/${uid}`)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Phone size={20} />
          </button>
          <button onClick={() => navigate(`/video-call/${uid}`)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Video size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = String(msg.sender_id) === String(me?.id);
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {!isMe && <Avatar src={partner?.avatar} name={partner?.full_name} size={28} />}
              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {msg.is_recalled ? (
                  <div className={`px-4 py-2.5 rounded-2xl text-sm italic text-gray-400 ${isMe ? 'bg-gray-100' : 'bg-white border border-gray-100'}`}>
                    Tin nhắn đã bị thu hồi
                  </div>
                ) : msg.type === 'image' ? (
                  <img src={msg.media_url} alt="" className="rounded-2xl max-w-full max-h-48 object-cover" />
                ) : (
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white' : 'bg-white text-gray-900 border border-gray-100 shadow-sm'}`}>
                    {msg.content}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[10px] text-gray-400 px-1">
                  {formatTime(msg.created_at)}
                  {isMe && msg.seen && <span className="text-blue-400">✓✓</span>}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex items-center gap-2">
            <Avatar src={partner?.avatar} name={partner?.full_name} size={28} />
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex gap-1.5">
              {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2">
        <button className="p-2 text-gray-400 hover:text-pink-500"><Image size={20} /></button>
        <button className="p-2 text-gray-400 hover:text-pink-500"><Gift size={20} /></button>
        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 flex items-center gap-2">
          <input
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && text.trim() && sendMsg()}
            placeholder="Nhắn tin..." className="flex-1 bg-transparent text-sm outline-none" />
          <button className="text-gray-400 hover:text-pink-500"><Smile size={18} /></button>
        </div>
        {text.trim()
          ? <button onClick={() => sendMsg()} className="p-2.5 bg-pink-500 rounded-full text-white"><Send size={18} /></button>
          : <button className="p-2 text-gray-400"><Mic size={20} /></button>}
      </div>
    </div>
  );
}
