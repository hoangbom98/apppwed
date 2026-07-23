// frontend/hub/src/pages/CmsPage.tsx
// Generic page for: about, policy, terms, faq, contact
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPage } from '../api/hub';
import Spinner from '../components/Spinner';

export default function CmsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => getPage(slug!),
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
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
