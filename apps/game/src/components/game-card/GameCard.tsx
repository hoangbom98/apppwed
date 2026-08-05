// @ts-nocheck
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';
import { GameCardSkeleton } from '@/components/chung/KhungTaiTrang';
import { PROVIDER_LOGO, GAME_HOT_BADGE } from '@/utils/tainguyen';

interface Game {
  id: number; name: string; slug: string;
  thumbnail?: string; provider?: string; type?: string; description?: string;
  is_hot?: boolean;
}

// Helper: resolve provider logo from provider string
function resolveProviderLogo(provider?: string): string | undefined {
  if (!provider) return undefined;
  const key = provider.toLowerCase().replace(/\s+/g, '');
  return PROVIDER_LOGO[key] || PROVIDER_LOGO[provider.toLowerCase()] || undefined;
}

// ── GamePreviewModal ─────────────────────────────────────────────────────
export const GamePreviewModal: React.FC<{
  game: Game | null;
  onClose: () => void;
}> = ({ game, onClose }) => {
  const navigate = useNavigate();
  if (!game) return null;

  const providerLogo = resolveProviderLogo(game.provider);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Thumbnail */}
          <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            {game.thumbnail
              ? <img src={game.thumbnail} alt={game.name} className="w-full h-full object-cover" loading="lazy" width="400" height="225" />
              : <img src="/wap/img/home_muen.png" alt="game" className="w-16 h-16 object-contain opacity-30" width="64" height="64" />
            }
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
            {game.type && (
              <span className="absolute top-3 left-3 bg-accent text-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                {game.type}
              </span>
            )}
            {/* Provider logo in modal */}
            {providerLogo && (
              <div className="absolute bottom-2 right-2 bg-white/90 rounded-md px-1.5 py-0.5">
                <img src={providerLogo} alt={game.provider} className="h-4 w-auto object-contain" />
              </div>
            )}
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">{game.name}</h3>
              {game.provider && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Nhà cung cấp: {game.provider}</p>
              )}
            </div>
            {game.description && (
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3">{game.description}</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-sm"
              >
                Đóng
              </button>
              <button
                onClick={() => { onClose(); navigate(`/games/${game.slug}`); }}
                className="flex-1 py-2.5 bg-primary hover:bg-secondary text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4 fill-white" /> Chơi ngay
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── GameCard ──────────────────────────────────────────────────────────────
export const GameCard: React.FC<{
  game: Game;
  onPreview?: (game: Game) => void;
}> = ({ game, onPreview }) => {
  if (onPreview) {
    return (
      <button
        onClick={() => onPreview(game)}
        className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left w-full"
      >
        <CardInner game={game} />
      </button>
    );
  }
  return (
    <Link
      to={`/games/${game.slug}`}
      className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
    >
      <CardInner game={game} />
    </Link>
  );
};

const CardInner: React.FC<{ game: Game }> = ({ game }) => {
  const providerLogo = resolveProviderLogo(game.provider);
  return (
    <>
      <div className="relative overflow-hidden">
        <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          {game.thumbnail
            ? <img src={game.thumbnail} alt={game.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            : <img src="/wap/img/home_muen.png" alt="game" className="w-12 h-12 object-contain opacity-30" />
          }
        </div>

        {/* HOT badge (WAP-style) */}
        {game.is_hot && (
          <img
            src={GAME_HOT_BADGE}
            alt="hot"
            className="absolute top-1 left-1 w-7 h-7 object-contain"
          />
        )}

        {/* Game type badge */}
        {game.type && (
          <span className="absolute top-1 right-1 bg-accent text-dark text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {game.type}
          </span>
        )}

        {/* Provider logo chip */}
        {providerLogo && (
          <div className="absolute bottom-1 right-1 bg-white/85 dark:bg-gray-900/80 rounded px-1 py-0.5">
            <img src={providerLogo} alt={game.provider} className="h-3 w-auto object-contain" />
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-xs truncate leading-tight">{game.name}</h3>
        {game.provider && !providerLogo && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{game.provider}</p>
        )}
      </div>
    </>
  );
};

// ── GameGrid ──────────────────────────────────────────────────────────────
export const GameGrid: React.FC<{
  games: Game[];
  loading?: boolean;
  onPreview?: (game: Game) => void;
}> = ({ games, loading, onPreview }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
        {Array.from({ length: 9 }).map((_, i) => <GameCardSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
      {games.map(g => <GameCard key={g.id} game={g} onPreview={onPreview} />)}
    </div>
  );
};

// ── GameFilter ────────────────────────────────────────────────────────────
export const GameFilter: React.FC<{
  categories: any[];
  active: string;
  onChange: (s: string) => void;
}> = ({ categories, active, onChange }) => (
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    <button
      onClick={() => onChange('')}
      className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
        active === '' ? 'bg-primary text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      Tất cả
    </button>
    {categories.map((c: any) => (
      <button
        key={c.id}
        onClick={() => onChange(String(c.id))}
        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
          active === String(c.id) ? 'bg-primary text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        {c.name}
      </button>
    ))}
  </div>
);
