// @ts-nocheck
import { useState, useEffect, useRef } from 'react';

// Use runtime env or fallback — avoids using import.meta outside Vite context
const API_BASE = (typeof window !== 'undefined' && window.__VITE_API_URL__)
  || '/api';

/**
 * ChatRoom — shared support chat component.
 * Renders a list of messages + send box for a given roomId.
 * Connects via socket for real-time updates.
 *
 * Props:
 *   roomId       {string}   required — support room id
 *   currentUser  {object}   required — { id, username, avatar }
 *   apiClient    {function} required — pre-configured axios instance or fetch wrapper
 *   socket       {object}   optional — socket.io socket instance
 *   title        {string}   optional — header title
 *   className    {string}   optional
 */
export default function ChatRoom({ roomId, currentUser, apiClient, socket, title = 'Support Chat', className = '' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Load message history
  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    apiClient.get(`/support/rooms/${roomId}/messages`)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId]);

  // Mark read
  useEffect(() => {
    if (!roomId) return;
    apiClient.put(`/support/rooms/${roomId}/read`).catch(() => {});
  }, [roomId]);

  // Real-time via socket
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('support:join_room', roomId);
    const handler = (msg) => setMessages((prev) => [...prev, msg]);
    socket.on('support:message', handler);
    return () => {
      socket.off('support:message', handler);
      socket.emit('support:leave_room', roomId);
    };
  }, [socket, roomId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput('');
    try {
      const res = await apiClient.post(`/support/rooms/${roomId}/messages`, { content });
      const msg = res.data?.data || res.data;
      if (!socket) setMessages((prev) => [...prev, msg]);
    } catch {
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className={`chat-room${className ? ' ' + className : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 300 }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 15 }}>
        {title}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <p style={{ color: '#57606a', fontSize: 13 }}>Loading…</p>}
        {!loading && messages.length === 0 && (
          <p style={{ color: '#57606a', fontSize: 13, textAlign: 'center', marginTop: 32 }}>No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => {
          const isMe = String(msg.senderId) === String(currentUser?.id);
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '72%',
                padding: '8px 12px',
                borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: isMe ? '#3b82d4' : '#f3f4f6',
                color: isMe ? '#fff' : '#1f2328',
                fontSize: 14,
                lineHeight: 1.5,
              }}>
                {!isMe && (
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2, color: '#57606a' }}>
                    Support
                  </div>
                )}
                <span>{msg.content}</span>
                <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7, textAlign: 'right' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={2}
          placeholder="Type a message…"
          style={{
            flex: 1, resize: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
            padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          style={{
            padding: '0 16px', background: '#3b82d4', color: '#fff', border: 'none',
            borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14,
            opacity: (!input.trim() || sending) ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
