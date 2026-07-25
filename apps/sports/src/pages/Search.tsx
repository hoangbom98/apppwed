import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { search } from '../api/sports';
import { Link } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 400);

  const { data, isFetching } = useQuery({
    queryKey: ['search', dq],
    queryFn: () => search(dq),
    enabled: dq.length >= 2,
    staleTime: 60_000,
  });

  return (
    <div className="p-4">
      <div className="relative mb-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Tìm kiếm giải đấu, đội bóng, tin tức..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
          autoFocus
        />
        {isFetching && <div className="absolute right-3 top-3 w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />}
      </div>

      {data && (
        <div className="space-y-4">
          {data.leagues?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Giải đấu</p>
              {data.leagues.map((l: any) => (
                <Link key={l.id} to={`/standings`} className="flex items-center gap-2 py-2 border-b border-gray-800">
                  {l.logo && <img src={l.logo} className="w-5 h-5 object-contain" alt="" />}
                  <span className="text-sm">{l.name}</span>
                </Link>
              ))}
            </div>
          )}
          {data.teams?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Đội bóng</p>
              {data.teams.map((t: any) => (
                <div key={t.id} className="flex items-center gap-2 py-2 border-b border-gray-800">
                  {t.logo && <img src={t.logo} className="w-5 h-5 object-contain" alt="" />}
                  <span className="text-sm">{t.name}</span>
                </div>
              ))}
            </div>
          )}
          {data.news?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Tin tức</p>
              {data.news.map((n: any) => (
                <Link key={n.id} to={`/news/${n.slug}`} className="block py-2 border-b border-gray-800 text-sm">{n.title}</Link>
              ))}
            </div>
          )}
          {data.highlights?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Highlights</p>
              {data.highlights.map((h: any) => (
                <Link key={h.id} to={`/highlights/${h.slug}`} className="block py-2 border-b border-gray-800 text-sm">{h.title}</Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!data && dq.length < 2 && q.length > 0 && (
        <p className="text-center text-gray-500 text-sm mt-8">Nhập ít nhất 2 ký tự để tìm kiếm.</p>
      )}
    </div>
  );
}
