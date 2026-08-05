// frontend/hub/src/pages/ToolsPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTools } from '../api/hub';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import { Link } from 'react-router-dom';

const OS_LIST = ['windows', 'android', 'ios', 'linux', 'macos'];

export default function ToolsPage() {
  const [page, setPage] = useState(1);
  const [os, setOs] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tools', page, os],
    queryFn: () => getTools({ page, limit: 20, os: os || undefined }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Công cụ & Phần mềm</h1>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setOs('')} className={`px-3 py-1.5 text-sm rounded ${!os ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Tất cả</button>
        {OS_LIST.map(o => (
          <button key={o} onClick={() => setOs(o)} className={`px-3 py-1.5 text-sm rounded capitalize ${os === o ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>{o}</button>
        ))}
      </div>

      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(data?.data?.data as unknown[])?.map((t: unknown) => {
            const tool = t as { id: string; slug: string; name: string; logo?: string; version?: string; os?: string; file_size?: string };
            return (
              <Link key={tool.id} to={`/tools/${tool.slug}`} className="bg-gray-800 rounded-lg p-4 hover:ring-1 hover:ring-indigo-500 transition-all no-underline flex gap-3 items-start">
                {tool.logo && <img src={tool.logo} alt={tool.name} className="w-12 h-12 object-cover rounded" />}
                <div>
                  <div className="text-gray-100 font-medium">{tool.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{tool.version} · {tool.os}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{tool.file_size}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={data?.data?.totalPages || 1} onPageChange={setPage} />
    </div>
  );
}
