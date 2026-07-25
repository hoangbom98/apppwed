// @ts-nocheck
// frontend/shared-ui/components/Notification/NotificationDrawer.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import Spinner from '../Spinner';
import Button from '../Button';

/**
 * Returns a human-readable relative time string, e.g. "5 mins ago".
 * @param {string|Date} date
 */
function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)                    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) === 1 ? '' : 's'} ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) === 1 ? '' : 's'} ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? '' : 's'} ago`;
}

export default function NotificationDrawer({ open, onClose, apiBase = '' }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const baseUrl = apiBase ? apiBase.replace(/\/$/, '') : '';

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`${baseUrl}/notifications`);
      setNotifications(res.data?.data ?? res.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  // Fetch when drawer opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const markRead = useCallback(async (notification) => {
    const id = notification.id;
    // Optimistically mark as read in local state
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n))
    );
    try {
      await api.put(`${baseUrl}/notifications/${id}/read`);
    } catch {
      // revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false, read_at: null } : n))
      );
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  }, [baseUrl]);

  const markAllRead = useCallback(async () => {
    // Optimistically mark all as read
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.put(`${baseUrl}/notifications/read-all`);
    } catch {
      // best-effort; don't revert — fetch will reconcile next open
    }
  }, [baseUrl]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        className={[
          'fixed top-0 right-0 h-full w-80 max-w-full bg-white shadow-2xl z-50',
          'flex flex-col transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="xs" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none p-1"
              aria-label="Close notifications"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-10 px-4">{error}</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-sm">No notifications yet.</span>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((item) => {
                const isUnread = !item.read;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => markRead(item)}
                      className={[
                        'w-full text-left px-4 py-3 flex gap-3 items-start',
                        'hover:bg-gray-50 transition-colors',
                        isUnread ? 'bg-blue-50/60' : '',
                      ].join(' ')}
                    >
                      {/* Unread dot */}
                      <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${isUnread ? 'bg-blue-500' : 'bg-transparent'}`} />

                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className={`text-sm leading-snug ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {item.title}
                        </span>
                        {item.content && (
                          <span className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {item.content}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 mt-0.5">
                          {timeAgo(item.createdAt ?? item.created_at)}
                        </span>
                      </div>

                      {item.link && (
                        <svg className="w-4 h-4 shrink-0 text-gray-300 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
