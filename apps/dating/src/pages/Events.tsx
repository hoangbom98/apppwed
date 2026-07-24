import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEvents } from '@/api/community';
import PageHeader from '@/components/common/PageHeader';
import { Calendar, Trophy, Users } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export default function Events() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['events'], queryFn: getEvents });
  const events = data?.events || [];

  return (
    <div>
      <PageHeader title="Sự kiện" />

      {isLoading ? (
        <div className="space-y-4 px-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-gray-400">Chưa có sự kiện nào</p>
        </div>
      ) : (
        <div className="px-4 space-y-4 pb-6">
          {events.map((e: any) => (
            <div key={e.id} className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white cursor-pointer active:scale-[0.98] transition-transform">
              {e.banner && <img src={e.banner} alt="" className="w-full h-36 object-cover" />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{e.title}</h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(e.start_at)} – {formatDate(e.end_at)}
                    </p>
                  </div>
                  {e.prize && (
                    <div className="flex items-center gap-1 bg-amber-50 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                      <Trophy size={13} className="text-amber-500" />
                      <span className="text-xs font-bold text-amber-600">{e.prize}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{e.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Users size={12} /> {e.participant_count} tham gia
                  </span>
                  <button className="px-4 py-1.5 bg-pink-500 text-white text-xs font-semibold rounded-lg">
                    Tham gia
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
