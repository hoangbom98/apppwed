import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMatches } from '../api/sports';
import MatchCard from '../components/MatchCard';
import { formatDate } from '../utils/formatters';

function getDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (i - 2));
    return d;
  });
}

export default function SchedulePage() {
  const days = getDays(7);
  const [selected, setSelected] = useState(days[2]); // today = index 2

  const dateStr = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`;

  const { data, isLoading } = useQuery({
    queryKey: ['matches', 'schedule', dateStr],
    queryFn: () => getMatches({ date: dateStr, limit: 50 }),
    staleTime: 60_000,
  });

  const matches: any[] = data?.data || [];

  // Group by league
  const grouped: Record<string, any[]> = matches.reduce((acc: Record<string, any[]>, m: any) => {
    const key = m.league?.name || 'Khác';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const today = days[2];
  const dayLabel = (d: Date) => {
    if (d.toDateString() === today.toDateString()) return 'Hôm nay';
    const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
    if (diff === -1) return 'Hôm qua';
    if (diff === 1)  return 'Ngày mai';
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div>
      {/* Day tabs */}
      <div className="flex overflow-x-auto no-scrollbar bg-gray-900 border-b border-gray-800 px-2">
        {days.map((d) => {
          const isToday  = d.toDateString() === today.toDateString();
          const isActive = d.toDateString() === selected.toDateString();
          return (
            <button
              key={d.toDateString()}
              onClick={() => setSelected(d)}
              className={`flex-shrink-0 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              } ${isToday ? 'font-bold' : ''}`}
            >
              {dayLabel(d)}
            </button>
          );
        })}
      </div>

      <div className="p-4 space-y-4">
        {isLoading && (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        )}

        {!isLoading && Object.keys(grouped).length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p>Không có trận đấu nào ngày {formatDate(selected)}</p>
          </div>
        )}

        {Object.entries(grouped).map(([league, ms]) => (
          <div key={league}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">{league}</h3>
            <div className="space-y-2">
              {ms.map((m: any) => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
