import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as hubApi from '@/api/hub';
import { Eye } from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function NewsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['news', page],
    queryFn: () => hubApi.getNewsList({ page, limit: 12 }),
  });
  const news = data?.data?.data || [];
  const meta = data?.data?.meta;

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">Tin tức</h1>
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {news.map((n: any) => (
            <button key={n.id} onClick={() => navigate(`/news/${n.slug}`)}
              className="text-left bg-gray-800 hover:bg-gray-750 rounded-xl overflow-hidden group transition-all hover:scale-[1.01]">
              {n.image && <img src={n.image} alt={n.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />}
              <div className="p-4">
                <p className="font-bold text-sm line-clamp-2 mb-2">{n.title}</p>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{n.summary}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{n.author}</span>
                  <span className="flex items-center gap-1"><Eye size={11} />{n.views}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      <Pagination
        page={page}
        totalPages={meta?.pages || meta?.totalPages || 1}
        onPageChange={(p: number) => setPage(p)}
      />
    </div>
  );
}
