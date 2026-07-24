import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
  query: { project: import.meta.env.VITE_PROJECT || 'hub' }
});

export const useWebSocket = (eventName) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    socket.on(eventName, (payload) => {
      setData(payload);
    });

    return () => { socket.off(eventName); };
  }, [eventName]);

  return data;
};
