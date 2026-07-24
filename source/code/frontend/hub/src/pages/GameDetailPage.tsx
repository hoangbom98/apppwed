// frontend/hub/src/pages/GameDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGameBySlug } from '../api/hub';
import Spinner from '../components/Spinner';
import { useTranslation } from 'react-i18next';

export default function GameDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['game', slug],
    queryFn: () => getGameBySlug(slug!),
  });
  const game = data?.data?.data;

  if (isLoading) return <Spinner />;
  if (isError || !game) return (
    <div className="text-center py-20 text-gray-400">
      <p className="text-5xl mb-4">🎮</p>
      <p>{t('common.not_found')}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-indigo-400 text-sm">{t('common.back')}</button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="text-indigo-400 text-sm hover:text-indigo-300">← {t('common.back')}</button>
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        {game.image && <img src={game.image} alt={game.name} className="w-full h-56 object-cover" />}
        <div className="p-6 space-y-4">
          <h1 className="text-2xl font-bold text-white">{game.name}</h1>
          {game.publisher && <p className="text-gray-400 text-sm">Publisher: {game.publisher}</p>}
          {game.description && <p className="text-gray-300 leading-relaxed">{game.description}</p>}
          <a
            href={game.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium no-underline"
          >
            Truy cập →
          </a>
        </div>
      </div>
    </div>
  );
}
