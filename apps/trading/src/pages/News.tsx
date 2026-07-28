import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNewsList } from '@/api/trade';
import { ArticleList } from '@ui/components/ArticleList';
import { ArticleDetail } from '@ui/components/ArticleDetail';
import type { NewsItem } from '@/types';
import { Newspaper, ArrowLeft } from 'lucide-react';

// ── Helper styles ──────────────────────────────────────────────────────────────
const surface = { background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' };

// ── News Page ──────────────────────────────────────────────────────────────────
export default function NewsPage() {
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey:  ['news'],
    queryFn:   () => getNewsList({ page: 1, limit: 20 }),
    staleTime: 5 * 60_000,
  });

  const articles: NewsItem[] = data?.data ?? [];

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 mb-5 text-sm font-medium transition-colors hover:text-white"
          style={{ color: 'var(--bn-muted)' }}
        >
          <ArrowLeft size={15} /> Quay lại tin tức
        </button>
        <div className="rounded-2xl p-6 md:p-8" style={surface}>
          <ArticleDetail
            title={selected.title}
            content={selected.content ?? selected.summary}
            image={selected.image}
            author={selected.author}
            createdAt={selected.createdAt
              ? new Date(selected.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })
              : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.12)' }}>
          <Newspaper size={18} style={{ color: '#3b82f6' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Tin tức thị trường</h1>
          <p className="text-xs" style={{ color: 'var(--bn-muted)' }}>
            Cập nhật tin tức crypto và tài chính mới nhất
          </p>
        </div>
      </div>

      {/* Article list */}
      <div className="rounded-2xl overflow-hidden" style={surface}>
        {isLoading ? (
          <div className="divide-y" style={{ borderColor: 'var(--bn-border)' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse">
                <div className="h-4 rounded-lg mb-2" style={{ background: 'var(--bn-bg-elevated)', width: `${60 + (i % 3) * 15}%` }} />
                <div className="h-3 rounded-lg" style={{ background: 'var(--bn-bg-elevated)', width: '45%' }} />
              </div>
            ))}
          </div>
        ) : (
          <ArticleList
            articles={articles}
            loading={false}
            emptyText="Chưa có tin tức"
            onSelect={(article) => setSelected(article as NewsItem)}
          />
        )}
      </div>
    </div>
  );
}
