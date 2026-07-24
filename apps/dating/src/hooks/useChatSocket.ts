import { useEffect } from 'react';
import { getSocket } from './useSocket';
import { useChatStore, Message } from '@/store/chatStore';

export const useChatSocket = (userId: number) => {
  const { addMessage, setTyping, markSeen } = useChatStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      const otherId = msg.sender_id === userId ? msg.sender_id : msg.receiver_id;
      addMessage(otherId, msg);
    };

    const handleTypingStart = (data: { userId: number }) => {
      if (data.userId === userId) setTyping(userId, true);
    };

    const handleTypingStop = (data: { userId: number }) => {
      if (data.userId === userId) setTyping(userId, false);
    };

    const handleSeen = (data: { userId: number }) => {
      if (data.userId === userId) markSeen(userId);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:seen', handleSeen);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:seen', handleSeen);
    };
  }, [userId]);
};
