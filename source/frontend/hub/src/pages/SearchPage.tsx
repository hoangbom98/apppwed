// frontend/hub/src/pages/SearchPage.tsx
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { search as apiSearch } from '../api/hub';
import { useTranslation } from 'react-i18next';
import Spinner from '../components/Spinner';
import Card from '../components/Card';

export default function SearchPage() {
  const { t } = useTranslation();
  const [sp] = useSearchParams();
  const q = sp.get('q') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => apiSearch(q),
    enabled: !!q,
  });
  const r = data?.data?.data;

  return (
    <div className="space-y-8">
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
