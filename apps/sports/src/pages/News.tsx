import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getArticles } from '../api/sports';
import NewsCard from '../components/NewsCard';

const CATS = [
  { value: '', label: 'Tất cả' },
  { value: 'news', label: 'Tin tức' },
  { value: 'transfer', label: 'Chuyển nhượng' },
  { value: 'analysis', label: 'Phân tích' },
  { value: 'interview', label: 'Phỏng vấn' },
  { value: 'opinion', label: 'Bình luận' },
];

export default function NewsPage() {
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['articles', category],
    queryFn: () => getArticles({ category: category || undefined, limit: 30 }),
    staleTime: 120_000,
  });
  const articles: any[] = data?.articles || [];

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar bg-gray-900 border-b border-gray-800">
        {CATS.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === c.value ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-2">
        {isLoading && [...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />
        ))}
        {articles.map((a: any) => <NewsCard key={a.id} article={a} />)}
        {!isLoading && articles.length === 0 && (
          <p className="text-center text-gray-500 py-16">Không có bài viết.</p>
        )}
      </div>
    </div>
  );
}
