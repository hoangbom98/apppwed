/**
 * FavoritesPage.tsx — Hub favorites page
 * Route: /favorites
 * Shows user's saved games, websites, tools, and news articles.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Navigate, Link } from 'react-router-dom';
import { Heart, Gamepad2, Globe, Wrench, Newspaper, Trash2, ExternalLink } from 'lucide-react';
import api from '@/api/client';
import DarkCard from '@/components/DarkCard';

const getFavorites  = () => api.get('/hub/favorites').then(r => r.data);
const removeFav     = (id: string) => api.delete(`/hub/favorites/${id}`).then(r => r.data);

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; base: string }> = {
  game:    { label: 'Game',    icon: <Gamepad2 size={14} />, color: 'text-purple-400', base: '/games' },
  website: { label: 'Website', icon: <Globe     size={14} />, color: 'text-blue-400',   base: '/websites' },
  tool:    { label: 'Công cụ', icon: <Wrench    size={14} />, color: 'text-green-400',  base: '/tools' },
  news:    { label: 'Tin tức', icon: <Newspaper size={14} />, color: 'text-yellow-400', base: '/news' },
};

export default function FavoritesPage() {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" state={{ from: '/favorites' }} replace />;

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['hub-favorites'],
    queryFn:  getFavorites,
  });
  const favorites: any[] = data?.data ?? [];

  const removeMutation = useMutation({
    mutationFn: removeFav,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hub-favorites'] }),
  });

  // Group by type
  const grouped = favorites.reduce<Record<string, any[]>>((acc, fav) => {
    const t = fav.targetType ?? 'game';
    if (!acc[t]) acc[t] = [];
    acc[t].push(fav);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <Heart size={20} className="text-red-400 fill-red-400" />
          <h1 className="font-extrabold text-lg text-white">Yêu thích</h1>
          {favorites.length > 0 && (
            <span className="ml-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {favorites.length > 99 ? '99+' : favorites.length}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <Heart size={48} className="mx-auto text-gray-700" />
            <p className="text-gray-400 font-semibold">Chưa có mục yêu thích nào</p>
            <p className="text-gray-600 text-sm">Nhấn ♥ trên game, tin tức, hoặc công cụ để lưu vào đây</p>
            <Link
              to="/games"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Khám phá game
            </Link>
          </div>
        ) : (
          Object.entries(grouped).map(([type, items]) => {
            const meta = TYPE_META[type] ?? TYPE_META.game;
            return (
              <section key={type}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={meta.color}>{meta.icon}</span>
                  <h2 className="font-bold text-white text-sm uppercase tracking-wider">{meta.label}</h2>
                  <span className="ml-1 text-xs text-gray-500">({items.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {items.map((fav: any) => {
                    const item = fav.game ?? fav.website ?? fav.tool ?? fav.news ?? {};
                    const slug = item.slug ?? item.id ?? fav.targetId;
                    const href = `${meta.base}/${slug}`;
                    return (
                      <DarkCard key={fav.id} className="group relative overflow-hidden rounded-2xl">
                        {/* Remove button */}
                        <button
                          onClick={() => removeMutation.mutate(fav.id)}
                          className="absolute top-2 right-2 z-10 w-7 h-7 bg-gray-900/80 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          title="Xoá khỏi yêu thích"
                        >
                          <Trash2 size={12} className="text-white" />
                        </button>

                        <Link to={href} className="block p-3">
                          {/* Thumbnail */}
                          <div className="w-full aspect-video bg-gray-800 rounded-xl overflow-hidden mb-3">
                            {(item.image || item.thumbnail || item.logo || item.cover) ? (
                              <img
                                src={item.image ?? item.thumbnail ?? item.logo ?? item.cover}
                                alt={item.name ?? item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${meta.color}`}>
                                {meta.icon}
                              </div>
                            )}
                          </div>

                          {/* Name */}
                          <p className="text-white font-semibold text-sm leading-tight line-clamp-2">
                            {item.name ?? item.title ?? 'N/A'}
                          </p>

                          {/* Metadata */}
                          {item.publisher && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{item.publisher}</p>
                          )}

                          {/* External link for websites/tools */}
                          {item.link && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
                              <ExternalLink size={10} />
                              <span className="truncate">{item.link.replace(/^https?:\/\//, '').split('/')[0]}</span>
                            </div>
                          )}
                        </Link>
                      </DarkCard>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
