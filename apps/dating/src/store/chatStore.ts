import { create } from 'zustand';

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  type: 'text' | 'image' | 'voice' | 'sticker' | 'gift' | 'video';
  media_url?: string;
  is_recalled: boolean;
  seen: boolean;
  created_at: string;
}

export interface Conversation {
  user_id: number;
  user: { id: number; full_name: string; avatar: string | null; is_online: boolean };
  last_message: string;
  last_message_at: string;
  unread: number;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<number, Message[]>;
  typingUsers: Set<number>;
  setConversations: (c: Conversation[]) => void;
  setMessages: (userId: number, msgs: Message[]) => void;
  addMessage: (userId: number, msg: Message) => void;
  setTyping: (userId: number, isTyping: boolean) => void;
  markSeen: (userId: number) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  conversations: [],
  messages: {},
  typingUsers: new Set(),

  setConversations: (c) => set({ conversations: c }),
  setMessages: (userId, msgs) => set((s) => ({ messages: { ...s.messages, [userId]: msgs } })),
  addMessage: (userId, msg) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [userId]: [...(s.messages[userId] || []), msg],
      },
    })),
  setTyping: (userId, isTyping) =>
    set((s) => {
      const t = new Set(s.typingUsers);
      isTyping ? t.add(userId) : t.delete(userId);
      return { typingUsers: t };
    }),
  markSeen: (userId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [userId]: (s.messages[userId] || []).map((m) => ({ ...m, seen: true })),
      },
    })),
}));
