// frontend/hub/src/pages/SearchPage.tsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AutoComplete, type AutoCompleteItem } from '@ui';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { search as apiSearch } from '../api/hub';

export default function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') || '';
  const [inputVal, setInputVal] = useState(q);

  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => apiSearch(q),
    enabled: !!q,
  });
  const r = data?.data?.data;

  const handleSelect = (item: AutoCompleteItem) => {
    // Navigate based on the item's slug/value if available, else search
    const slug = (item.value as any)?.slug ?? item.label;
    const type = (item.value as any)?.type ?? 'game';
    if (type === 'news')  { navigate(`/news/${slug}`);  return; }
    if (type === 'tool')  { navigate(`/tools/${slug}`); return; }
    navigate(`/games/${slug}`);
  };

  const handleChange = (val: string) => {
    setInputVal(val);
    if (val.length >= 1) setSp({ q: val });
  };

  return (
    <div className="space-y-8">
      {/* ── AutoComplete search bar ─────────────────────────────────────── */}
      <AutoComplete
        value={inputVal}
        onChange={handleChange}
        onSelect={handleSelect}
        apiPrefix="/api/hub"
        source="all"
        placeholder={t('search.placeholder', 'Tìm game, tin tức, công cụ...')}
        inputClassName="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
      />

      <h1 className="text-xl font-bold text-white">{t('search.results_for')}: <span className="text-indigo-400">"{q}"</span></h1>

      {isLoading && <Spinner />}

      {r && (
        <>
          {r.games?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-200 mb-3">Games ({r.games.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {r.games.map((g: any) => <Card key={g.id} title={g.name} image={g.image} href={`/games/${g.slug}`} />)}
              </div>
            </section>
          )}
          {r.tools?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-200 mb-3">Tools ({r.tools.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {r.tools.map((t: any) => <Card key={t.id} title={t.name} image={t.logo} href={`/tools/${t.slug}`} />)}
              </div>
            </section>
          )}
          {r.news?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-200 mb-3">Tin tức ({r.news.length})</h2>
              <div className="space-y-2">
                {r.news.map((n: any) => (
                  <a key={n.id} href={`/news/${n.slug}`} className="block bg-gray-800 rounded p-3 text-gray-100 text-sm hover:bg-gray-750 no-underline">{n.title}</a>
                ))}
              </div>
            </section>
          )}
          {!r.games?.length && !r.tools?.length && !r.news?.length && (
            <p className="text-gray-400">{t('search.no_results')}</p>
          )}
        </>
      )}
    </div>
  );
}
