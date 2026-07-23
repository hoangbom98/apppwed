import React, { useState } from 'react';
import { MessageCircle, PlusCircle, List } from 'lucide-react';
import { ChatRoom, TicketForm, TicketList } from '@ui/index';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

type Tab = 'tickets' | 'chat' | 'new-ticket';

export default function Support() {
  const { user, isLoggedIn } = useAuthStore();
  const [view, setView]           = useState<Tab>('tickets');
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  // When user picks a ticket that already has a roomId, open its chat
  const handleSelectTicket = (ticket: any) => {
    if (ticket.roomId) {
      setChatRoomId(ticket.roomId);
      setView('chat');
    }
  };

  // "Live Chat" tab — create/fetch a general support room
  const handleOpenLiveChat = async () => {
    if (chatRoomId) { setView('chat'); return; }
    setChatLoading(true);
    try {
      const res = await api.post('/sports/support/start');
      const roomId = res.data?.data?.roomId ?? res.data?.roomId;
      if (roomId) setChatRoomId(roomId);
    } catch {
      // fallback: show chat with null roomId which ChatRoom handles gracefully
    } finally {
      setChatLoading(false);
      setView('chat');
    }
  };

  const handleTicketCreated = () => {
    setView('tickets');
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'tickets',    label: 'Yêu cầu của tôi', icon: List },
    { id: 'chat',       label: 'Chat trực tiếp',   icon: MessageCircle },
    { id: 'new-ticket', label: 'Tạo yêu cầu',      icon: PlusCircle },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center text-white">
          <MessageCircle size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-lg font-semibold mb-1">Hỗ trợ khách hàng</p>
          <p className="text-sm text-gray-400">Vui lòng đăng nhập để liên hệ hỗ trợ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">Hỗ trợ</h1>
        <p className="text-xs text-gray-500 mt-0.5">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              if (id === 'chat') handleOpenLiveChat();
              else setView(id);
            }}
            disabled={id === 'chat' && chatLoading}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors border-b-2 ${
              view === id
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="py-3">
        {/* My Tickets */}
        {view === 'tickets' && (
          <div className="bg-white rounded-xl mx-3 overflow-hidden shadow-sm">
            <TicketList
              apiClient={api}
              onSelectTicket={handleSelectTicket}
            />
          </div>
        )}

        {/* Live Chat */}
        {view === 'chat' && (
          <div className="mx-3">
            {chatLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                Đang kết nối...
              </div>
            ) : (
              <ChatRoom
                roomId={chatRoomId!}
                currentUserId={user?.id ?? 0}
                apiClient={api}
                onClose={() => setView('tickets')}
                className="min-h-[480px]"
              />
            )}
          </div>
        )}

        {/* New Ticket */}
        {view === 'new-ticket' && (
          <div className="bg-white rounded-xl mx-3 shadow-sm p-4">
            <TicketForm
              apiClient={api}
              onSuccess={handleTicketCreated}
              onCancel={() => setView('tickets')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
