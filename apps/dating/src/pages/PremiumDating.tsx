import React from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useNavigate } from 'react-router-dom';

const MODES = [
  {
    id: 'speed',
    icon: '⚡',
    title: 'Speed Dating',
    desc: 'Gặp gỡ nhiều người trong 5 phút mỗi người',
    color: 'from-orange-400 to-amber-400',
    path: '/premium-dating/speed',
  },
  {
    id: 'blind',
    icon: '👀',
    title: 'Blind Match',
    desc: 'Ghép đôi bí ẩn, không thấy ảnh cho đến khi match',
    color: 'from-purple-400 to-pink-400',
    path: '/premium-dating/blind',
  },
  {
    id: 'voice',
    icon: '🎙',
    title: 'Voice Match',
    desc: 'Kết nối qua giọng nói trước khi xem ảnh',
    color: 'from-blue-400 to-cyan-400',
    path: '/premium-dating/voice',
  },
  {
    id: 'video',
    icon: '🎥',
    title: 'Video Match',
    desc: 'Video 1-1 ngắn ngẫu nhiên với người phù hợp',
    color: 'from-green-400 to-teal-400',
    path: '/premium-dating/video',
  },
  {
    id: 'random',
    icon: '🎲',
    title: 'Random Match',
    desc: 'Ghép đôi ngẫu nhiên, thú vị bất ngờ',
    color: 'from-pink-400 to-rose-400',
    path: '/premium-dating/random',
  },
];

export default function PremiumDating() {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Hẹn hò nâng cao" />
      <div className="px-4 pb-8 space-y-4">
        <p className="text-gray-500 text-sm">Trải nghiệm những hình thức hẹn hò độc đáo và thú vị hơn</p>
        {MODES.map(mode => (
          <button key={mode.id} onClick={() => navigate('/vip')}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform text-left">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center text-3xl flex-shrink-0`}>
              {mode.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{mode.title}</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{mode.desc}</p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-lg font-semibold flex-shrink-0">VIP</span>
          </button>
        ))}
      </div>
    </div>
  );
}
