import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTeams, getLeagues } from '../api/sports';
import { useSportsStore } from '../store/sportsStore';
import { Users, Star, Search } from 'lucide-react';

export default function TeamsPage() {
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const { favouriteTeams, toggleFavTeam } = useSportsStore();

  const { data: leaguesData } = useQuery({
    queryKey: ['leagues'],
    queryFn: () => getLeagues({ status: 'active', limit: 50 }),
    staleTime: 600_000,
  });
  const leagues: any[] = leaguesData?.data || [];

  const { data, isLoading } = useQuery({
    queryKey: ['teams', leagueId],
    queryFn: () => getTeams(leagueId ? { league_id: leagueId, limit: 100 } : { limit: 100 }),
    staleTime: 600_000,
  });
  const teams: any[] = data?.data || [];

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm đội bóng..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      {/* League filter */}
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar bg-gray-900 border-b border-gray-800">
        <button
          onClick={() => setLeagueId(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            leagueId === null ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Tất cả
        </button>
        {leagues.map((l: any) => (
          <button
            key={l.id}
            onClick={() => setLeagueId(l.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              leagueId === l.id ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {l.logo && <img src={l.logo} alt="" className="w-3.5 h-3.5 object-contain" />}
            {l.name}
          </button>
        ))}
      </div>

      <div className="p-4">
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(12)].map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            <Users size={36} className="mx-auto mb-3 text-gray-700" />
            <p>Không tìm thấy đội bóng</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((t: any) => {
            const isFav = favouriteTeams.includes(t.id);
            return (
              <div key={t.id} className="relative">
                <Link
                  to={`/teams/${t.slug || t.id}`}
                  className="block bg-gray-800 rounded-2xl p-4 transition-colors border border-gray-700/50 hover:border-green-500/30"
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    {t.logo
                      ? <img src={t.logo} alt={t.name} className="w-12 h-12 object-contain" />
                      : <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center font-black text-white text-lg">
                          {t.name[0]}
                        </div>
                    }
                    <p className="text-sm font-semibold text-white leading-tight line-clamp-2">{t.name}</p>
                    {t.country && <p className="text-[10px] text-gray-500">{t.country}</p>}
                  </div>
                </Link>
                <button
                  onClick={() => toggleFavTeam(t.id)}
                  className={`absolute top-2.5 right-2.5 p-1 transition-colors ${isFav ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                >
                  <Star size={13} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
