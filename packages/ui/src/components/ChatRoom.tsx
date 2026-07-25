// @ts-nocheck
// packages/shared-ui/src/components/ChatRoom.tsx
import React, { useState } from 'react';
import { Button, Input } from 'antd';

interface Message {
  id:        string | number;
  content:   string;
  sender?:   string;
  createdAt?: string;
}

interface ChatRoomProps {
  messages?:      Message[];
  onSend?:        (text: string) => void;
  loading?:       boolean;
  className?:     string;
  roomId?:        string | null;
  currentUserId?: string | number;
  apiClient?:     any;
  onClose?:       () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  messages = [], onSend, loading = false,
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend?.(text.trim());
    setText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 300 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 8, padding: '6px 12px' }}>
            {m.sender && <span style={{ fontWeight: 600, marginRight: 8 }}>{m.sender}</span>}
            <span>{m.content}</span>
          </div>
        ))}
        {loading && <div style={{ textAlign: 'center', color: '#8892b0' }}>Đang tải...</div>}
      </div>
      {onSend && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 0' }}>
          <Input
            value={text} onChange={(e) => setText(e.target.value)}
            onPressEnter={handleSend} placeholder="Nhập tin nhắn..."
          />
          <Button type="primary" onClick={handleSend}>Gửi</Button>
        </div>
      )}
    </div>
  );
};
