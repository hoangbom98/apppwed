import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDailyStatus, checkin, getMissions, spin } from '@/api/gamification';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';
import { CheckCircle, Circle, RotateCw } from 'lucide-react';
import {
  DollarOutlined, GiftOutlined, StarOutlined,
  CloseCircleOutlined, CalendarOutlined, CheckOutlined, PlaySquareOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SPIN_PRIZES = ['Xu 50', 'Kim 5', 'Xu 100', 'Quà', 'Xu 200', '+10 EXP', 'Xu 30', 'Thử lại'];

export default function Daily() {
  const qc = useQueryClient();
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState('');
  const [rotation, setRotation] = useState(0);

  const { data: status } = useQuery({ queryKey: ['daily-status'], queryFn: getDailyStatus });
  const { data: missionsData } = useQuery({ queryKey: ['missions'], queryFn: getMissions });

  const checkinMut = useMutation({
    mutationFn: checkin,
    onSuccess: (data: any) => {
      toast.success(`Điểm danh thành công! +${data.reward} xu`);
      qc.invalidateQueries({ queryKey: ['daily-status'] });
    },
    onError: () => toast.error('Đã điểm danh hôm nay'),
  });

  const spinMut = useMutation({
    mutationFn: spin,
    onSuccess: (data: any) => {
      const deg = Math.floor(Math.random() * 360) + 720 * 3;
      setRotation(prev => prev + deg);
      setSpinning(true);
      setTimeout(() => {
        setSpinning(false);
        setSpinResult(data.prize || 'Thử lại');
        toast.success(`Bạn nhận được: ${data.prize || 'Thử lại'}!`);
      }, 3000);
    },
    onError: () => toast.error('Không đủ lượt quay'),
  });

  const missions = missionsData?.missions || [];
  const checkinDays = status?.checked_days || 0;

  return (
    <div>
      <PageHeader title="Phần thưởng hàng ngày" />

      <div className="px-4 space-y-6 pb-8">
        {/* Check-in calendar */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-4">
          <h3 className="font-bold text-gray-900 mb-3"><CalendarOutlined /> Điểm danh</h3>
          <div className="flex gap-2 mb-4">
            {DAYS.map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-500">{day}</span>
                <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm ${i < checkinDays ? 'bg-pink-500 text-white' : 'bg-white border border-gray-200 text-gray-400'}`}>
                  {i < checkinDays ? <CheckOutlined /> : `+${(i + 1) * 10}`}
                </div>
              </div>
            ))}
          </div>
          <Button onClick={() => checkinMut.mutate()} loading={checkinMut.isPending}
            fullWidth disabled={status?.checked_today}>
            {status?.checked_today ? <><CheckOutlined /> Đã điểm danh hôm nay</> : <><GiftOutlined /> Điểm danh nhận thưởng</>}
          </Button>
        </div>

        {/* Lucky Spin */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-bold text-gray-900 mb-3"><PlaySquareOutlined /> Vòng quay may mắn</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-48 h-48">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 text-2xl">▼</div>
              <div
                className="w-full h-full rounded-full border-4 border-pink-200 overflow-hidden transition-transform"
                style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none' }}
              >
                {SPIN_PRIZES.map((p, i) => (
                  <div key={p} className="absolute w-full h-full"
                    style={{ transform: `rotate(${i * 45}deg)` }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-700 bg-white/70 px-1 rounded">{p}</div>
                  </div>
                ))}
              </div>
            </div>
            {spinResult && <p className="text-pink-500 font-bold">Kết quả: {spinResult}</p>}
            <p className="text-xs text-gray-400">Còn {status?.spin_count || 0} lượt quay</p>
            <Button onClick={() => spinMut.mutate()} loading={spinning || spinMut.isPending}
              disabled={!status?.spin_count}>
              <RotateCw size={16} /> Quay ngay
            </Button>
          </div>
        </div>

        {/* Missions */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3"><FileTextOutlined /> Nhiệm vụ hàng ngày</h3>
          <div className="space-y-2">
            {missions.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100">
                {m.is_completed ? <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  : <Circle size={20} className="text-gray-300 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{m.title}</p>
                  <p className="text-xs text-gray-400">{m.description}</p>
                </div>
                <span className="text-xs font-bold text-amber-500">+{m.reward}xu</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
