import { useSocket as useSharedSocket, getSocket } from '@ui';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const socket = useSharedSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (e: any) => {
      const { title } = e.detail;
      toast(title, { icon: '🔔', duration: 4000 });
    };

    const handleAnnouncement = (e: any) => {
      const { title } = e.detail;
      toast(title, { icon: '📢', duration: 6000 });
    };

    const handleMatch = (e: any) => {
      const { user } = e.detail;
      toast(`💕 Bạn match với ${user.full_name}!`, { duration: 5000 });
    };

    window.addEventListener('socket:notification', handleNotification);
    window.addEventListener('socket:announcement', handleAnnouncement);
    window.addEventListener('socket:match', handleMatch);

    return () => {
      window.removeEventListener('socket:notification', handleNotification);
      window.removeEventListener('socket:announcement', handleAnnouncement);
      window.removeEventListener('socket:match', handleMatch);
    };
  }, [socket]);

  return socket;
};

export { getSocket };
