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

    window.addEventListener('socket:notification', handleNotification);
    window.addEventListener('socket:announcement', handleAnnouncement);

    return () => {
      window.removeEventListener('socket:notification', handleNotification);
      window.removeEventListener('socket:announcement', handleAnnouncement);
    };
  }, [socket]);

  return socket;
};

export { getSocket };
