import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { MapPin, Navigation } from 'lucide-react';
import api from '@/api/client';

// Định nghĩa kiểu dữ liệu User dựa trên cấu trúc backend
interface User {
  id: number;
  name: string;
  age: number;
  dist: number;
  online: boolean;
}

export default function Nearby() {
  const navigate = useNavigate();
  const [radius, setRadius] = useState(10);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/dating/nearby', { params: { radius } });
        setUsers(data?.data ?? []);
      } catch (error) {
        console.error('Failed to fetch nearby users', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [radius]);

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
          <p className="text-blue-400 text-xs mt-1">{loading ? 'Đang tải vị trí...' : 'Đã tải dữ liệu'}</p>
        </div>
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
        <h3 className="font-bold text-gray-900 text-sm mb-3">👥 {users.length} người trong {radius}km</h3>
        {loading ? (
          <p className="text-center text-gray-500 py-4">Đang tải...</p>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
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
        )}
      </div>
    </div>
  );
}
