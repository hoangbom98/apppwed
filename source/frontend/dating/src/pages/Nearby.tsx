import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import Avatar from '@/components/common/Avatar';
import { MapPin, Navigation } from 'lucide-react';

// Simple visual Nearby page — real GPS/map integration would need react-leaflet
export default function Nearby() {
  const navigate = useNavigate();
  const [radius, setRadius] = useState(10);

  // Mock nearby users for display
  const MOCK = [
    { id: 1, name: 'Nguyễn Lan Anh', age: 23, dist: 0.8, online: true },
    { id: 2, name: 'Trần Minh Tuấn', age: 26, dist: 1.2, online: false },
    { id: 3, name: 'Lê Thị Hoa', age: 24, dist: 2.5, online: true },
    { id: 4, name: 'Phạm Đức Việt', age: 28, dist: 3.1, online: true },
    { id: 5, name: 'Vũ Thị Mai', age: 22, dist: 4.7, online: false },
    { id: 6, name: 'Hoàng Nam', age: 27, dist: 6.2, online: true },
  ];

  return (
    <div>
      <PageHeader title="Gần đây" rightSlot={
        <button className="p-2 text-gray-500"><Navigation size={18} /></button>
      } />

      {/* Map placeholder */}
      <div className="mx-4 h-52 bg-gradient-to-b from-blue-100 to-blue-50 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden border border-blue-200">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#93c5fd,#93c5fd 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#93c5fd,#93c5fd 1px,transparent 1px,transparent 40px)' }} />
        <div className="relative z-10 text-center">
          <MapPin size={32} className="text-blue-400 mx-auto mb-2" />
          <p className="text-blue-600 font-semibold text-sm">Bản đồ GPS</p>
          <p className="text-blue-400 text-xs mt-1">Đang tải vị trí...</p>
        </div>
        {/* Mock user pins */}
        {MOCK.slice(0, 4).map((u, i) => (
          <div key={u.id} className="absolute"
            style={{ left: `${20 + i * 20}%`, top: `${25 + (i % 2) * 30}%` }}>
            <div className={`w-7 h-7 rounded-full border-2 border-white shadow bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-[10px] text-white font-bold ${u.online ? 'ring-1 ring-green-400' : ''}`}>
              {u.name.charAt(0)}
            </div>
          </div>
        ))}
      </div>

      {/* Radius slider */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-700">Bán kính</span>
          <span className="text-sm font-bold text-pink-500">{radius} km</span>
        </div>
        <input type="range" min={1} max={50} value={radius} onChange={e => setRadius(+e.target.value)}
          className="w-full accent-pink-500" />
      </div>

      {/* User list */}
      <div className="px-4">
        <h3 className="font-bold text-gray-900 text-sm mb-3">👥 {MOCK.length} người trong {radius}km</h3>
        <div className="space-y-2">
          {MOCK.filter(u => u.dist <= radius).map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer active:bg-gray-50"
              onClick={() => navigate(`/profile/${u.id}`)}>
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-300 to-rose-300 flex items-center justify-center text-white font-bold">
                  {u.name.charAt(0)}
                </div>
                {u.online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-400">{u.age} tuổi</p>
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin size={11} /> {u.dist} km
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
