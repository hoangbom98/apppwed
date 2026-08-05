import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLeagues } from '../api/sports';
import { useSportsStore } from '../store/sportsStore';
import { Trophy, Star, Search } from 'lucide-react';

const REGIONS = ['Tất cả', 'Châu Âu', 'Châu Á', 'Nam Mỹ', 'Quốc tế'] as const;

export default function LeaguesPage() {
  const [region, setRegion] = useState<string>('Tất cả');
  const [search, setSearch] = useState('');
  const { favouriteLeagues, toggleFavLeague } = useSportsStore();

  const { data, isLoading } = useQuery({
    queryKey: ['leagues', 'all'],
    queryFn: () => getLeagues({ status: 'active', limit: 100 }),
    staleTime: 600_000,
  });

  const leagues: any[] = data?.data || [];

  const filtered = leagues.filter(l => {
    const matchRegion = region === 'Tất cả' || l.region === region;
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
                        (l.country || '').toLowerCase().includes(search.toLowerCase());
    return matchRegion && matchSearch;
  });

  return (
    <div>
      {/* Search bar */}
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm giải đấu, quốc gia..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Region filter */}
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar bg-gray-900 border-b border-gray-800">
        {REGIONS.map(r => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              region === r ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* League grid */}
      <div className="p-4">
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            <Trophy size={36} className="mx-auto mb-3 text-gray-700" />
            <p>Không tìm thấy giải đấu nào</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((l: any) => {
            const isFav = favouriteLeagues.includes(l.id);
            return (
              <div key={l.id} className="relative">
                <Link
                  to={`/leagues/${l.slug}`}
                  className="block bg-gray-800 hover:bg-gray-750 rounded-2xl p-4 transition-colors border border-gray-700/50 hover:border-green-500/30"
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    {l.logo
                      ? <img src={l.logo} alt={l.name} className="w-12 h-12 object-contain" />
                      : <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center text-xs font-bold text-green-400">Liga</div>
                    }
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{l.name}</p>
                      {l.country && <p className="text-[10px] text-gray-500 mt-0.5">{l.country}</p>}
                    </div>
                  </div>
                </Link>
                {/* Favourite toggle */}
                <button
                  onClick={() => toggleFavLeague(l.id)}
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
