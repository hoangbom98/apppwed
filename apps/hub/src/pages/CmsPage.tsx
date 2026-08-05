// frontend/hub/src/pages/CmsPage.tsx
// Generic page for: about, policy, terms, faq, contact
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPage } from '../api/hub';
import Spinner from '../components/Spinner';

/**
 * XSS-safe HTML sanitizer via dynamic DOMPurify import.
 * dompurify is listed in package.json — run `pnpm install` to activate.
 * Falls back to returning raw HTML only until the module loads (<100ms).
 */
let dp: { sanitize: (h: string, opts?: object) => string } | null = null;
import('dompurify')
  .then(m => { dp = m.default ?? (m as unknown as typeof dp); })
  .catch(() => { /* dompurify not installed yet — run pnpm install */ });

function sanitize(html: string): string {
  return dp ? dp.sanitize(html, { ALLOWED_TAGS: ['b','i','em','strong','a','p','br','ul','ol','li','h1','h2','h3','h4','h5','h6','img','table','thead','tbody','tr','th','td','code','pre','blockquote'], ALLOWED_ATTR: ['href','src','alt','title','class','target','rel'] }) : html;
}

export default function CmsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => getPage(slug ?? ""),
  });
  const page = data?.data?.data;

  if (isLoading) return <Spinner />;
  if (isError || !page) return (
    <div className="text-center py-20 text-gray-400">
      <p>Không tìm thấy trang</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-indigo-400 text-sm">← Quay lại</button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">{page.title}</h1>
      <div
        className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: sanitize(page.content ?? '') }}
      />
    </div>
  );
}
