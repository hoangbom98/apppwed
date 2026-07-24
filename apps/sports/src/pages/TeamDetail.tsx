import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTeam, getMatches } from '../api/sports';
import { useSportsStore } from '../store/sportsStore';
import MatchCard from '../components/MatchCard';
import { ChevronLeft, Star, Calendar, Trophy, Users } from 'lucide-react';

type Tab = 'matches' | 'info';

export default function TeamDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<Tab>('matches');
  const { favouriteTeams, toggleFavTeam } = useSportsStore();

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', slug],
    queryFn: () => getTeam(slug!),
    enabled: !!slug,
    staleTime: 600_000,
  });

  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['team-matches', slug],
    queryFn: () => getMatches({ team_slug: slug, limit: 20 }),
    enabled: !!slug && tab === 'matches',
    staleTime: 60_000,
  });

  const matches: any[] = matchesData?.data || [];
  const isFav = team ? favouriteTeams.includes(team.id) : false;

  if (isLoading) return (
    <div className="p-4 animate-pulse space-y-3">
      <div className="h-32 bg-gray-800 rounded-2xl" />
      {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl" />)}
    </div>
  );

  if (!team) return <div className="p-4 text-gray-400">Không tìm thấy đội bóng.</div>;

  const TABS = [
    { key: 'matches', icon: Calendar, label: 'Trận đấu' },
    { key: 'info',    icon: Trophy,   label: 'Thông tin' },
  ] as const;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <Link to="/teams" className="p-1.5 text-gray-400 hover:text-white rounded-lg">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {team.logo
            ? <img src={team.logo} alt={team.name} className="w-7 h-7 object-contain rounded-full" />
            : <div className="w-7 h-7 rounded-full bg-green-600/40 flex items-center justify-center text-sm font-bold text-white">{team.name[0]}</div>
          }
          <h1 className="font-bold text-white text-sm truncate">{team.name}</h1>
        </div>
        <button
          onClick={() => toggleFavTeam(team.id)}
          className={`p-2 rounded-lg transition-colors ${isFav ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}
          title={isFav ? 'Bỏ theo dõi' : 'Theo dõi đội'}
        >
          <Star size={17} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Hero */}
      <div className="relative mx-4 mt-4 rounded-2xl overflow-hidden bg-gradient-to-br from-green-900/40 to-gray-800 p-5 mb-4">
        <div className="flex items-center gap-4">
          {team.logo
            ? <img src={team.logo} alt={team.name} className="w-20 h-20 object-contain rounded-xl" />
            : <div className="w-20 h-20 rounded-xl bg-green-600/30 flex items-center justify-center text-4xl font-black text-white">{team.name[0]}</div>
          }
          <div>
            <h2 className="text-xl font-black text-white">{team.name}</h2>
            {team.country && <p className="text-sm text-gray-400 mt-0.5">🌍 {team.country}</p>}
            {team.founded && <p className="text-xs text-gray-500 mt-0.5">Thành lập: {team.founded}</p>}
            {team.stadium && <p className="text-xs text-gray-500 mt-0.5">🏟 {team.stadium}</p>}
          </div>
        </div>
        {team.description && (
          <p className="text-sm text-gray-400 mt-3 line-clamp-2">{team.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-4">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === key ? 'border-green-500 text-green-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'matches' && (
          <div>
            {matchesLoading && (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            )}
            {!matchesLoading && matches.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <Calendar size={32} className="mx-auto mb-2 text-gray-700" />
                <p>Chưa có trận đấu nào</p>
              </div>
            )}
            <div className="space-y-2">
              {matches.map((m: any) => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        )}

        {tab === 'info' && (
          <div className="space-y-3">
            {[
              { label: 'Tên đầy đủ',   value: team.fullName || team.name },
              { label: 'Quốc gia',      value: team.country },
              { label: 'Thành lập',     value: team.founded },
              { label: 'Sân nhà',       value: team.stadium },
              { label: 'HLV',           value: team.manager },
              { label: 'Màu áo',        value: team.colors },
            ].filter(r => r.value).map(r => (
              <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-gray-800/50">
                <span className="text-sm text-gray-500">{r.label}</span>
                <span className="text-sm text-white font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
