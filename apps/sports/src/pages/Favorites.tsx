import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFavourites, getMatches } from '../api/sports';
import { useSportsStore } from '../store/sportsStore';
import { useAuthStore } from '../store/authStore';
import MatchCard from '../components/MatchCard';
import { Star, Trophy, Users, Calendar, LogIn } from 'lucide-react';

export default function FavoritesPage() {
  const { isLoggedIn } = useAuthStore();
  const { favouriteTeams, favouriteLeagues, setFavourites } = useSportsStore();

  // Load saved favourites from server on mount (when logged in)
  const { data: savedFavs } = useQuery({
    queryKey: ['favourites'],
    queryFn: getFavourites,
    enabled: isLoggedIn,
    staleTime: 300_000,
  });

  useEffect(() => {
    if (savedFavs?.teams || savedFavs?.leagues) {
      setFavourites(
        savedFavs.teams?.map((t: any) => t.id) || favouriteTeams,
        savedFavs.leagues?.map((l: any) => l.id) || favouriteLeagues,
      );
    }
  }, [savedFavs]);

  // Load upcoming matches for favourite teams
  const { data: upcomingData, isLoading } = useQuery({
    queryKey: ['matches', 'favorites', favouriteTeams.join(',')],
    queryFn: () => getMatches({ team_ids: favouriteTeams.join(','), status: 'scheduled,live', limit: 20 }),
    enabled: favouriteTeams.length > 0,
    staleTime: 60_000,
  });

  const upcomingMatches: any[] = upcomingData?.data || [];
  const savedTeams: any[]   = savedFavs?.teams   || [];
  const savedLeagues: any[] = savedFavs?.leagues || [];

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <Star size={48} className="text-yellow-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Theo dõi đội yêu thích</h2>
        <p className="text-gray-400 text-sm mb-6">Đăng nhập để lưu đội bóng và nhận thông báo trận đấu</p>
        <Link
          to="/login"
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          <LogIn size={15} /> Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const hasNoFavs = favouriteTeams.length === 0 && favouriteLeagues.length === 0;

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2">
        <Star size={18} className="text-yellow-400" fill="currentColor" />
        <h1 className="text-lg font-bold text-white">Yêu thích của tôi</h1>
      </div>

      {hasNoFavs && (
        <div className="py-16 text-center text-gray-500">
          <Star size={36} className="mx-auto mb-3 text-gray-700" />
          <p className="font-medium">Chưa theo dõi đội nào</p>
          <p className="text-xs mt-1 text-gray-600">Vào trang Đội bóng hoặc Giải đấu để thêm yêu thích</p>
          <div className="flex gap-3 justify-center mt-5">
            <Link to="/teams"   className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm flex items-center gap-1.5">
              <Users size={14} /> Đội bóng
            </Link>
            <Link to="/leagues" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm flex items-center gap-1.5">
              <Trophy size={14} /> Giải đấu
            </Link>
          </div>
        </div>
      )}

      {/* Favourite teams */}
      {savedTeams.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">Đội bóng đang theo dõi</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {savedTeams.map((t: any) => (
              <Link key={t.id} to={`/teams/${t.slug || t.id}`}
                className="flex flex-col items-center text-center p-3 bg-gray-800 rounded-xl border border-gray-700/50 hover:border-green-500/30 transition-colors">
                {t.logo
                  ? <img src={t.logo} alt={t.name} className="w-10 h-10 object-contain mb-1.5" />
                  : <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center font-bold text-white text-base mb-1.5">{t.name[0]}</div>
                }
                <p className="text-xs font-medium text-white line-clamp-2">{t.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Favourite leagues */}
      {savedLeagues.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">Giải đấu đang theo dõi</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {savedLeagues.map((l: any) => (
              <Link key={l.id} to={`/leagues/${l.slug}`}
                className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl border border-gray-700/50 hover:border-green-500/30 transition-colors">
                {l.logo
                  ? <img src={l.logo} alt={l.name} className="w-8 h-8 object-contain" />
                  : <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center text-xs text-gray-400">Sport</div>
                }
                <div>
                  <p className="text-xs font-semibold text-white">{l.name}</p>
                  {l.country && <p className="text-[10px] text-gray-500">{l.country}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming matches for favourite teams */}
      {favouriteTeams.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-green-400" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase">Trận đấu sắp tới</h2>
          </div>
          {isLoading && (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          )}
          {!isLoading && upcomingMatches.length === 0 && (
            <p className="text-sm text-gray-500 py-4">Không có trận đấu sắp tới</p>
          )}
          <div className="space-y-2">
            {upcomingMatches.map((m: any) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}
    </div>
  );
}
