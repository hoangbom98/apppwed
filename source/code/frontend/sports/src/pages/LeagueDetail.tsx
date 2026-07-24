import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLeague, getMatches, getStandings } from '@/api/sports';
import MatchCard from '@/components/MatchCard';
import { BarChart2, Calendar, Trophy, ChevronLeft } from 'lucide-react';

type Tab = 'matches' | 'standings' | 'teams';

export default function LeagueDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<Tab>('matches');
  const [season] = useState(new Date().getFullYear().toString());

  const { data: league, isLoading: leagueLoading } = useQuery({
    queryKey: ['league', slug],
    queryFn: () => getLeague(slug!),
    enabled: !!slug,
    staleTime: 600_000,
  });

  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['league-matches', slug, tab],
    queryFn: () => getMatches({ league_slug: slug, status: tab === 'matches' ? 'all' : undefined, limit: 30 }),
    enabled: !!slug && tab === 'matches',
    staleTime: 60_000,
  });

  const { data: standing, isLoading: standingsLoading } = useQuery({
    queryKey: ['standings', league?.id, season],
    queryFn: () => getStandings(league!.id, season),
    enabled: !!league?.id && tab === 'standings',
    staleTime: 300_000,
  });

  const matches: any[] = matchesData?.data || [];
  const rows: any[] = standing?.standings || [];

  const TABS = [
    { key: 'matches',   icon: Calendar,  label: 'Trận đấu'       },
    { key: 'standings', icon: BarChart2, label: 'Bảng xếp hạng' },
  ] as const;

  if (leagueLoading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-32 bg-gray-800 rounded-2xl" />
        <div className="h-8 bg-gray-800 rounded-xl" />
        {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Back header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <Link to="/schedule" className="p-1.5 text-gray-400 hover:text-white rounded-lg">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {league?.logo
            ? <img src={league.logo} alt={league.name} className="w-7 h-7 object-contain rounded" />
            : <div className="w-7 h-7 rounded bg-gray-700 flex items-center justify-center text-xs font-bold text-white">⚽</div>
          }
          <div className="min-w-0">
            <h1 className="font-bold text-white text-sm truncate">{league?.name ?? slug}</h1>
            {league?.country && <p className="text-[10px] text-gray-500">{league.country}</p>}
          </div>
        </div>
        {league?.currentSeason && (
          <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {league.currentSeason}
          </span>
        )}
      </div>

      {/* Hero banner */}
      <div className="relative mx-4 mt-4 rounded-2xl overflow-hidden bg-gradient-to-br from-green-900/50 to-gray-800 p-5 mb-4">
        <div className="flex items-start gap-4">
          {league?.logo
            ? <img src={league.logo} alt={league.name} className="w-16 h-16 object-contain" />
            : <div className="w-16 h-16 rounded-xl bg-green-600/40 flex items-center justify-center text-3xl">⚽</div>
          }
          <div>
            <h2 className="text-xl font-black text-white">{league?.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{league?.country} · {league?.sport ?? 'Bóng đá'}</p>
            {league?.teamsCount && (
              <p className="text-xs text-gray-500 mt-1">{league.teamsCount} đội · Mùa {season}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mx-0 px-4">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === key
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Matches tab */}
        {tab === 'matches' && (
          <div>
            {matchesLoading && (
              <div className="space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            )}
            {!matchesLoading && matches.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Calendar size={36} className="mx-auto mb-3 text-gray-700" />
                <p>Chưa có trận đấu nào</p>
              </div>
            )}
            <div className="space-y-2">
              {matches.map((m: any) => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        )}

        {/* Standings tab */}
        {tab === 'standings' && (
          <div>
            {standingsLoading && (
              <div className="space-y-2">
                {[...Array(10)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />)}
              </div>
            )}
            {!standingsLoading && rows.length > 0 && (
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
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r: any, idx: number) => (
                      <tr key={r.id} className={`border-b border-gray-800/50 ${
                        idx < 4 ? 'text-green-400' : idx < 6 ? 'text-yellow-400' : idx >= rows.length - 3 ? 'text-red-400' : 'text-gray-200'
                      }`}>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!standingsLoading && rows.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Trophy size={36} className="mx-auto mb-3 text-gray-700" />
                <p>Chưa có bảng xếp hạng</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
