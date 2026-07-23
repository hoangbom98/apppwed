import { useEffect } from 'react';
import { getSocket } from './useSocket';
import { useLiveStore, LiveChatMessage, GiftAnimation } from '@/store/liveStore';

export const useLiveSocket = (streamId: number) => {
  const { setViewerCount, addChatMessage, pushGift, setPkScores } = useLiveStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('live:join', { stream_id: streamId });

    const handleChat = (msg: LiveChatMessage) => addChatMessage(msg);
    const handleViewers = (data: { count: number }) => setViewerCount(data.count);
    const handleGift = (g: GiftAnimation) => pushGift(g);
    const handlePk = (data: { left: number; right: number }) => setPkScores(data);

    socket.on('live:chat', handleChat);
    socket.on('live:viewer-count', handleViewers);
    socket.on('live:gift', handleGift);
    socket.on('live:pk-update', handlePk);

    return () => {
      socket.emit('live:leave', { stream_id: streamId });
      socket.off('live:chat', handleChat);
      socket.off('live:viewer-count', handleViewers);
      socket.off('live:gift', handleGift);
      socket.off('live:pk-update', handlePk);
    };
  }, [streamId]);
};
