/**
 * GamesPage — nâng cấp theme OKVIP
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import * as hubApi from '@/api/hub';
import { useGameStore } from '@/store/gameStore';

export default function GamesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [search, setSearch]           = useState(searchParams.get('search') || '');
  const [page, setPage]               = useState(1);
  const [allGames, setAllGames]       = useState<any[]>([]);

  const { categories, setActiveCategory, setCategories } = useGameStore();
  const catId = searchParams.get('category') || '';

  // debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); setAllGames([]); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: catData } = useQuery({
    queryKey: ['categories', 'game'],
    queryFn: async () => {
      const r = await hubApi.getCategories('game');
      setCategories(r.data?.data || []);
      return r;
    },
    staleTime: 300_000,
  });
  const cats = categories.length ? categories : (catData?.data?.data || []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['games', catId, search, page],
    queryFn: () => hubApi.getGames({ category: catId || undefined, search: search || undefined, page, limit: 24 }),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!data?.data?.data) return;
    const incoming = data.data.data as any[];
    if (page === 1) {
      setAllGames(incoming);
    } else {
      setAllGames(prev => {
        const ids = new Set(prev.map((g: any) => g.id));
        return [...prev, ...incoming.filter((g: any) => !ids.has(g.id))];
      });
    }
  }, [data, page]);

  const totalPages = data?.data?.meta?.pages || data?.data?.totalPages || 1;
  const hasMore    = page < totalPages;

  const handleCat = useCallback((id: string) => {
    setActiveCategory(id);
    const p: Record<string, string> = {};
    if (id)     p.category = id;
    if (search) p.search   = search;
    setSearchParams(p);
    setPage(1); setAllGames([]);
  }, [search, setActiveCategory, setSearchParams]);

  return (
    <div className="hub-page">
      {/* Title + search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <h1 className="hub-page-title" style={{ margin: 0 }}>🎮 Games</h1>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--hub-text-muted)' }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm game..."
            style={{
              background: 'var(--hub-bg-secondary)', border: '1px solid var(--hub-border)',
              borderRadius: 20, paddingLeft: 32, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
              fontSize: 13, color: 'var(--hub-text)', outline: 'none', width: 180,
            }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }} className="scrollbar-none">
        <button onClick={() => handleCat('')}
          style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap',
            background: !catId ? 'var(--hub-primary)' : 'var(--hub-bg-secondary)',
            color: !catId ? '#111' : 'var(--hub-text-muted)' }}>
          Tất cả
        </button>
        {(cats as any[]).map((c: any) => (
          <button key={c.id} onClick={() => handleCat(String(c.id))}
            style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap',
              background: catId === String(c.id) ? 'var(--hub-primary)' : 'var(--hub-bg-secondary)',
              color: catId === String(c.id) ? '#111' : 'var(--hub-text-muted)' }}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading && page === 1 ? (
        <div className="hub-games-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="hub-skeleton" style={{ height: 90 }} />
          ))}
        </div>
      ) : (
        <div className="hub-games-grid">
          {allGames.map((g: any) => (
            <a key={g.id}
              href={g.link || `/games/${g.slug}`}
              target={g.link ? '_blank' : '_self'} rel="noreferrer"
              className="hub-game-card">
              {g.image
                ? <img src={g.image} alt={g.name} className="hub-game-thumb" loading="lazy" />
                : <div className="hub-game-no-img">🎮</div>
              }
              <div className="hub-game-info">
                <p className="hub-game-name">{g.name}</p>
                <p className="hub-game-cat">{g.category?.name}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <button onClick={() => setPage(p => p + 1)} disabled={isFetching}
            style={{ padding: '10px 32px', background: 'var(--hub-primary)', color: '#111',
              borderRadius: 20, fontWeight: 700, fontSize: 14, opacity: isFetching ? .6 : 1 }}>
            {isFetching ? 'Đang tải...' : 'Xem thêm game'}
          </button>
        </div>
      )}
    </div>
  );
}
