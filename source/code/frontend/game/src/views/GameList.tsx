import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getCategories, getGames } from '@/api/apiGame';
import { useGameStore } from '@/store/gameStore';
import { GameGrid, GameFilter, GamePreviewModal } from '@/components/the-bai/TheGame';

export default function Games() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const { categories, activeCategory, setActiveCategory, setCategories } = useGameStore();
  const catId = searchParams.get('category') || activeCategory || '';
  const [page, setPage] = useState(1);
  const [allGames, setAllGames] = useState<any[]>([]);
  const [previewGame, setPreviewGame] = useState<any | null>(null);

  // Debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); setAllGames([]); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: catsData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const c = await getCategories();
      setCategories(c);
      return c;
    },
    staleTime: 300_000,
  });
  const cats = categories.length ? categories : (catsData as any[]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['games', catId, search, page],
    queryFn: () => getGames({ category: catId || undefined, search: search || undefined, page, limit: 16 }),
    staleTime: 30_000,
  });

  // Append games on page change (load more)
  useEffect(() => {
    if (!data?.data) return;
    if (page === 1) {
      setAllGames(data.data);
    } else {
      setAllGames(prev => {
        const ids = new Set(prev.map((g: any) => g.id));
        return [...prev, ...data.data.filter((g: any) => !ids.has(g.id))];
      });
    }
  }, [data, page]);

  const totalPages = data?.totalPages || 1;
  const hasMore = page < totalPages;

  const handleCategoryChange = useCallback((id: string) => {
    setActiveCategory(id);
    const params: Record<string, string> = {};
    if (id) params.category = id;
    if (search) params.search = search;
    setSearchParams(params);
    setPage(1);
    setAllGames([]);
  }, [search, setActiveCategory, setSearchParams]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Tất cả game</h1>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm tên game..."
          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary dark:focus:border-secondary transition-colors"
        />
      </div>

      {/* Category filter */}
      <GameFilter categories={cats} active={catId} onChange={handleCategoryChange} />

      {/* Grid (append mode) */}
      <GameGrid
        games={allGames}
        loading={isLoading && page === 1}
        onPreview={setPreviewGame}
      />

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={isFetching}
            className="px-8 py-3 bg-primary hover:bg-secondary disabled:opacity-50 text-white font-bold rounded-full text-sm transition-colors"
          >
            {isFetching ? 'Đang tải...' : 'Xem thêm game'}
          </button>
        </div>
      )}

      {/* Game Preview Modal */}
      <GamePreviewModal game={previewGame} onClose={() => setPreviewGame(null)} />
    </div>
  );
}
