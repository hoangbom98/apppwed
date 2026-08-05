import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLeagues, getStandings } from '../api/sports';

export default function StandingsPage() {
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [season] = useState(new Date().getFullYear().toString());

  const { data: leaguesData } = useQuery({
    queryKey: ['leagues'],
    queryFn: () => getLeagues({ status: 'active' }),
    staleTime: 600_000,
  });
  const leagues: any[] = leaguesData?.data || [];

  const activeLeague = leagueId || leagues[0]?.id || null;

  const { data: standing, isLoading } = useQuery({
    queryKey: ['standings', activeLeague, season],
    queryFn: () => getStandings(activeLeague!, season),
    enabled: !!activeLeague,
    staleTime: 300_000,
  });

  const rows: any[] = standing?.standings || [];

  return (
    <div>
      {/* League selector */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar bg-gray-900 border-b border-gray-800">
        {leagues.map((l: any) => (
          <button
            key={l.id}
            onClick={() => setLeagueId(l.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              (activeLeague === l.id) ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>

      <div className="p-4">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />)}
          </div>
        )}

        {!isLoading && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700">
                  <th className="pb-2 text-left w-6">#</th>
                  <th className="pb-2 text-left">Đội bóng</th>
                  <th className="pb-2 text-center">Trận</th>
                  <th className="pb-2 text-center">T</th>
                  <th className="pb-2 text-center">H</th>
                  <th className="pb-2 text-center">B</th>
                  <th className="pb-2 text-center">HS</th>
                  <th className="pb-2 text-center font-bold">Điểm</th>
                  <th className="pb-2 text-center">Form</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any, idx: number) => (
                  <tr key={r.id} className={`border-b border-gray-800/50 ${idx < 4 ? 'text-green-400' : idx < 6 ? 'text-yellow-400' : idx >= rows.length - 3 ? 'text-red-400' : 'text-gray-200'}`}>
                    <td className="py-2">{r.rank}</td>
                    <td className="py-2 flex items-center gap-1.5">
                      {r.team?.logo && <img src={r.team.logo} className="w-4 h-4 object-contain" alt="" />}
                      <span className="truncate max-w-[100px]">{r.team?.name}</span>
                    </td>
                    <td className="py-2 text-center text-gray-300">{r.played}</td>
                    <td className="py-2 text-center">{r.wins}</td>
                    <td className="py-2 text-center">{r.draws}</td>
                    <td className="py-2 text-center">{r.losses}</td>
                    <td className="py-2 text-center text-gray-300">{r.goalDiff > 0 ? '+' : ''}{r.goalDiff}</td>
                    <td className="py-2 text-center font-bold">{r.points}</td>
                    <td className="py-2 text-center">
                      <span className="text-[9px] tracking-tight text-gray-400">{r.form}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && rows.length === 0 && (
          <p className="text-center text-gray-500 py-10">Chưa có dữ liệu BXH.</p>
        )}
      </div>
    </div>
  );
}
