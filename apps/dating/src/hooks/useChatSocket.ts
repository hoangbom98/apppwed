import { useEffect } from 'react';
import { useChatStore, Message } from '@/store/chatStore';

/**
 * Subscribes to chat-related events broadcast from the main `useSocket` hook.
 * This avoids race conditions and direct socket dependencies.
 */
export const useChatSocket = (userId: number) => {
  const { addMessage, setTyping, markSeen } = useChatStore();

  useEffect(() => {
    const handleNewMessage = (e: CustomEvent<Message>) => {
      const msg = e.detail;
      // Determine the other user's ID for storing the message correctly
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      addMessage(otherId, msg);
    };

    const handleTypingStart = (e: CustomEvent<{ userId: number }>) => {
      if (e.detail.userId === userId) setTyping(userId, true);
    };

    const handleTypingStop = (e: CustomEvent<{ userId: number }>) => {
      if (e.detail.userId === userId) setTyping(userId, false);
    };

    const handleSeen = (e: CustomEvent<{ userId: number }>) => {
      if (e.detail.userId === userId) markSeen(userId);
    };

    // Listen to window events dispatched by the main socket hook
    window.addEventListener('socket:message_new', handleNewMessage as EventListener);
    window.addEventListener('socket:typing_start', handleTypingStart as EventListener);
    window.addEventListener('socket:typing_stop', handleTypingStop as EventListener);
    window.addEventListener('socket:message_seen', handleSeen as EventListener);

    return () => {
      // Cleanup: remove listeners when the component unmounts
      window.removeEventListener('socket:message_new', handleNewMessage as EventListener);
      window.removeEventListener('socket:typing_start', handleTypingStart as EventListener);
      window.removeEventListener('socket:typing_stop', handleTypingStop as EventListener);
      window.removeEventListener('socket:message_seen', handleSeen as EventListener);
    };
  }, [userId, addMessage, setTyping, markSeen]);
};
