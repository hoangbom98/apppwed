// frontend/shared-ui/components/Notification/NotificationBadge.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';

/** SVG bell icon */
function BellIcon({ className = '' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

export default function NotificationBadge({ onClick }) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/notifications/unread-count'),
        api.get('/support/unread-count'),
      ]);

      let total = 0;
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const d = result.value.data;
          const n = d?.count ?? d?.unread_count ?? d?.unreadCount ?? 0;
          total += Number(n) || 0;
        }
      }
      setCount(total);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Listen to socket:notification window events (dispatched by useSocket hook)
  useEffect(() => {
    const handler = () => setCount((c) => c + 1);
    window.addEventListener('socket:notification', handler);
    return () => window.removeEventListener('socket:notification', handler);
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center justify-center p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
    >
      <BellIcon className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5 leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
