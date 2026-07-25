import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLevel, getAchievements } from '@/api/gamification';
import PageHeader from '@/components/common/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { Zap } from 'lucide-react';
import {
  MedalOutlined, StarOutlined, DiamondOutlined, TrophyOutlined,
  FireOutlined, HeartOutlined, StarFilled, PlaySquareOutlined,
  CheckOutlined,
} from '@ant-design/icons';

export default function Level() {
  const { user } = useAuthStore();
  const { data: levelData } = useQuery({ queryKey: ['level'], queryFn: getLevel });
  const { data: achData } = useQuery({ queryKey: ['achievements'], queryFn: getAchievements });

  const level = levelData?.level || user?.level || 1;
  const exp = levelData?.exp || user?.exp || 0;
  const nextExp = levelData?.next_level_exp || 1000;
  const achievements = achData?.achievements || [];
  const progress = Math.min(100, (exp / nextExp) * 100);

  return (
    <div>
      <PageHeader title="Level & Thành tích" />
      <div className="px-4 pb-8 space-y-6">

        {/* Level card */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white text-center">
          <div className="text-5xl font-black mb-1">Lv.{level}</div>
          <p className="text-white/80 text-sm mb-4">EXP: {exp.toLocaleString()} / {nextExp.toLocaleString()}</p>
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-white/70 text-xs mt-2">Còn {(nextExp - exp).toLocaleString()} EXP lên cấp tiếp</p>
        </div>

        {/* Badges */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3"><MedalOutlined /> Huy hiệu</h3>
          <div className="grid grid-cols-4 gap-3">
            {([
              { icon: <StarOutlined />,      name: 'Ngôi sao', desc: 'Lv.5+' },
              { icon: <DiamondOutlined />,   name: 'Kim cương', desc: 'VIP' },
              { icon: <TrophyOutlined />,    name: 'Champion', desc: 'Top 10' },
              { icon: <FireOutlined />,      name: 'Hot', desc: '50 match' },
              { icon: <HeartOutlined />,     name: 'Tình nhân', desc: '100 like' },
              { icon: <StarFilled />,        name: 'Sao sáng', desc: 'Livestream' },
              { icon: <PlaySquareOutlined />,name: 'Gamer', desc: 'Party' },
              { icon: <CheckOutlined />,     name: 'Xác minh', desc: 'Verified' },
            ] as { icon: React.ReactNode; name: string; desc: string }[]).map(badge => (
              <div key={badge.name} className="flex flex-col items-center gap-1 p-2.5 bg-gray-50 rounded-2xl">
                <span className="text-2xl">{badge.icon}</span>
                <p className="text-[10px] font-semibold text-gray-700">{badge.name}</p>
                <p className="text-[9px] text-gray-400">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3"><TrophyOutlined /> Thành tích</h3>
            <div className="space-y-2">
              {achievements.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                  <span className="text-2xl">{a.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-400">{a.description}</p>
                  </div>
                  {a.is_unlocked && <CheckOutlined className="text-green-500 text-xs font-bold" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
