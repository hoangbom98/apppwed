// frontend/hub/src/pages/ToolDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getToolBySlug } from '../api/hub';
import Spinner from '../components/Spinner';

export default function ToolDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tool', slug],
    queryFn: () => getToolBySlug(slug ?? ""),
  });
  const tool = data?.data?.data;

  if (isLoading) return <Spinner />;
  if (isError || !tool) return <div className="text-center py-20 text-gray-400">Không tìm thấy</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="text-indigo-400 text-sm">← Quay lại</button>
      <div className="bg-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          {tool.logo && <img src={tool.logo} alt={tool.name} className="w-16 h-16 rounded object-cover" />}
          <div>
            <h1 className="text-2xl font-bold text-white">{tool.name}</h1>
            <p className="text-gray-400 text-sm">{tool.version} · {tool.os}</p>
          </div>
        </div>
        {tool.description && <p className="text-gray-300 leading-relaxed">{tool.description}</p>}
        <div className="flex gap-4 text-sm text-gray-400">
          {tool.file_size && <span>Size: {tool.file_size}</span>}
        </div>
        <a
          href={tool.download_link}
          className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium no-underline"
        >
          ⬇ Tải xuống
        </a>
      </div>
    </div>
  );
}
