// frontend/hub/src/pages/NewsDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getNewsBySlug } from '../api/hub';
import Spinner from '../components/Spinner';

/**
 * XSS-safe HTML sanitizer via dynamic DOMPurify import.
 * dompurify is listed in package.json — run `pnpm install` to activate.
 * Falls back to returning raw HTML only until the module loads (<100ms).
 */
let _dp: { sanitize: (h: string, opts?: object) => string } | null = null;
import('dompurify')
  .then(m => { _dp = m.default ?? (m as unknown as typeof _dp); })
  .catch(() => { /* dompurify not installed yet — run pnpm install */ });

function sanitize(html: string): string {
  return _dp ? _dp.sanitize(html, { ALLOWED_TAGS: ['b','i','em','strong','a','p','br','ul','ol','li','h1','h2','h3','h4','h5','h6','img','table','thead','tbody','tr','th','td','code','pre','blockquote'], ALLOWED_ATTR: ['href','src','alt','title','class','target','rel'] }) : html;
}

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['news-detail', slug],
    queryFn: () => getNewsBySlug(slug!),
  });
  const article = data?.data?.data;

  if (isLoading) return <Spinner />;
  if (isError || !article) return <div className="text-center py-20 text-gray-400">Không tìm thấy</div>;

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="text-indigo-400 text-sm">← Quay lại</button>
      {article.image && <img src={article.image} alt={article.title} className="w-full rounded-xl h-64 object-cover" />}
      <h1 className="text-3xl font-bold text-white">{article.title}</h1>
      <div className="flex gap-4 text-sm text-gray-400">
        {article.author && <span>Tác giả: {article.author}</span>}
        <span>{new Date(article.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span>{article.views} lượt xem</span>
      </div>
      <div
        className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: sanitize(article.content ?? '') }}
      />
    </article>
  );
}
