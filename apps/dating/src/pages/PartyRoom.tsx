import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPartyRooms, joinPartyRoom } from '@/api/community';
import PageHeader from '@/components/common/PageHeader';
import { Users, Plus } from 'lucide-react';

import { MessageOutlined, PlaySquareOutlined, SoundOutlined, AudioOutlined, GiftOutlined } from '@ant-design/icons';

const ROOM_TYPE_ICONS: Record<string, React.ReactNode> = {
  chat:    <MessageOutlined />,
  game:    <PlaySquareOutlined />,
  music:   <SoundOutlined />,
  karaoke: <AudioOutlined />,
};

const ROOM_TYPES = [
  { id: 'chat',    label: 'Tâm sự'  },
  { id: 'game',    label: 'Game'    },
  { id: 'music',   label: 'Âm nhạc' },
  { id: 'karaoke', label: 'Karaoke' },
];

export default function PartyRoom() {
  const navigate = useNavigate(); // used in room click handlers below
  const { data, isLoading } = useQuery({ queryKey: ['party-rooms'], queryFn: getPartyRooms });
  const rooms = data?.rooms || [];

  return (
    <div>
      <PageHeader title="Party Room" rightSlot={
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 text-white text-xs font-semibold rounded-xl">
          <Plus size={14} /> Tạo phòng
        </button>
      } />

      {/* Categories */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-none">
        {ROOM_TYPES.map(t => (
          <button key={t.id}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold whitespace-nowrap">
            {ROOM_TYPE_ICONS[t.id]} {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3 px-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="text-5xl mb-3"><GiftOutlined style={{ fontSize: 48, color: '#d1d5db' }} /></div>
          <p className="text-gray-500 text-sm">Chưa có phòng nào</p>
          <p className="text-gray-400 text-xs mt-1">Tạo phòng mới ngay!</p>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {rooms.map((room: any) => (
            <div key={room.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => joinPartyRoom(room.id)}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-2xl flex-shrink-0">
                {ROOM_TYPE_ICONS[room.type] ?? <MessageOutlined />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-900 truncate">{room.title}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{room.host?.full_name}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users size={12} /> {room.member_count}/{room.max_members}
                </span>
                <span className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <span className="block h-full bg-pink-400 rounded-full" style={{ width: `${(room.member_count / room.max_members) * 100}%` }} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
