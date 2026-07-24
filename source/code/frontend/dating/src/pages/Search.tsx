import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { search } from '@/api/search';
import { Search as SearchIcon, X } from 'lucide-react';
import Avatar from '@/components/common/Avatar';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

const TABS = ['Người', 'Bài viết', 'Hashtag'];

export default function Search() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('Người');
  const debouncedQ = useDebounce(q, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQ, tab],
    queryFn: () => search(debouncedQ, tab === 'Người' ? 'users' : tab === 'Bài viết' ? 'posts' : 'hashtags'),
    enabled: debouncedQ.length >= 2,
  });

  const results = data?.results || [];

  return (
    <div>
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3">
          <SearchIcon size={18} className="text-gray-400 flex-shrink-0" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm kiếm..."
            autoFocus className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400" />
          {q && <button onClick={() => setQ('')}><X size={16} className="text-gray-400" /></button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 pt-3 mb-3">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${tab === t ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {!q ? (
        <div className="px-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">🔥 Trending</h3>
          <div className="flex flex-wrap gap-2">
            {['#hẹnhò', '#tìmbạn', '#tâmsự', '#live', '#gamers', '#travel'].map(tag => (
              <button key={tag} onClick={() => setQ(tag.slice(1))}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy kết quả</div>
      ) : tab === 'Người' ? (
        <div className="divide-y divide-gray-50">
          {results.map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-gray-50"
              onClick={() => navigate(`/profile/${u.id}`)}>
              <Avatar src={u.avatar} name={u.full_name} size={44} isOnline={u.is_online} />
              <div>
                <p className="font-semibold text-sm text-gray-900">{u.full_name}</p>
                <p className="text-xs text-gray-400">{u.city} • {u.age} tuổi</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {results.map((r: any, i: number) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-800">{r.content || r.tag}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
