// frontend/hub/src/pages/WebsitesPage.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { getWebsites } from '../api/hub';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';

export default function WebsitesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['websites', page, search],
    queryFn: () => getWebsites({ page, limit: 20, search: search || undefined }),
  });

  return (
    <div className="space-y-6">
      {/* Title + search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="text-2xl font-bold text-white">Websites</h1>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--hub-text-muted, #9ca3af)' }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm website..."
            style={{
              background: 'var(--hub-bg-secondary, #1f2937)',
              border: '1px solid var(--hub-border, #374151)',
              borderRadius: 20, paddingLeft: 32, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
              fontSize: 13, color: 'var(--hub-text, #fff)', outline: 'none', width: 200,
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data?.data?.data?.map((w: any) => (
            <Card key={w.id} title={w.name} subtitle={w.description} image={w.logo} href={w.link} />
          ))}
          {!isLoading && data?.data?.data?.length === 0 && (
            <p className="col-span-full text-center text-gray-400 py-10">Không tìm thấy website nào.</p>
          )}
        </div>
      )}

      <Pagination page={page} totalPages={data?.data?.totalPages || 1} onPageChange={setPage} />
    </div>
  );
}
