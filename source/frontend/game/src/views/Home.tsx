/**
 * Game Home.tsx — antd-mini inspired UI
 * Section indicators, token-based colours, shimmer skeletons, smooth cards
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCategories, getGames } from '@/api/apiGame';
import { getPromotions } from '@/api/apiKhuyenMai';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { GameGrid } from '@/components/the-bai/TheGame';
import { PromotionList } from '@/components/khuyen-mai/TheKhuyenMai';
import { BannerSlider } from '@/components/trang-chu/BannerQuangCao';
import { CATEGORY_ICON_MAP, PLACEHOLDER_BANNERS, GAME_PROVIDERS, HOME_IMGS } from '@/utils/tainguyen';

/* ── antd-mini inspired section header ─────────────────────────────────── */
function SectionHeader({ title, viewAllTo }: { title: string; viewAllTo?: string }) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <div className="flex items-center gap-1.5">
        {/* antd-mini style: left accent bar */}
        <span className="game-section-indicator" aria-hidden="true" />
        <h2 className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
          {title}
        </h2>
      </div>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="text-[11px] font-bold transition-opacity hover:opacity-80"
          style={{ color: 'var(--game-accent)' }}
        >
          Xem tất cả →
        </Link>
      )}
    </div>
  );
}

/* ── Shimmer skeleton (antd-mini style) ─────────────────────────────────── */
function GameSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="shimmer-bg rounded-xl" style={{ height: 110 }} />
      ))}
    </div>
  );
}

/* ── Quick-link tile ────────────────────────────────────────────────────── */
function QuickBtn({ to, img, label }: { to: string; img: string; label: string }) {
  return (
    <Link to={to} className="game-quick-btn">
      <img
        src={img} alt={label}
        className="w-8 h-8 object-contain"
        onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
      />
      <span
        className="text-[10px] font-semibold text-center leading-tight"
        style={{ color: 'var(--game-text-secondary)' }}
      >
        {label}
      </span>
    </Link>
  );
}

/* ── Category chip ──────────────────────────────────────────────────────── */
function CategoryChip({ cat }: { cat: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22 }}
    >
      <Link
        to={`/games?category=${cat.id}`}
        className="flex flex-col items-center gap-1.5 p-2 rounded-xl
          border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-800
          hover:border-yellow-400 hover:bg-yellow-400/5
          active:scale-95 transition-all group"
      >
        {CATEGORY_ICON_MAP[cat.slug] ? (
          <img
            src={CATEGORY_ICON_MAP[cat.slug]}
            alt={cat.name}
            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-2xl">{cat.icon || '🎮'}</span>
        )}
        <span
          className="text-[10px] font-semibold text-center leading-tight"
          style={{ color: 'var(--game-text-secondary)' }}
        >
          {cat.name}
        </span>
      </Link>
    </motion.div>
  );
}

/* ── Provider logo item ─────────────────────────────────────────────────── */
function ProviderItem({ provider }: { provider: { name: string; logo: string } }) {
  return (
    <div className="game-provider-item shrink-0">
      <img
        src={provider.logo}
        alt={provider.name}
        className="h-7 w-14 object-contain"
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
      <span
        className="text-[9px] font-semibold text-center leading-tight"
        style={{ color: 'var(--game-text-muted)' }}
      >
        {provider.name}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HOME PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { user } = useAuthStore();
  const { setCategories } = useGameStore();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const c = await getCategories();
      setCategories(c);
      return c;
    },
    staleTime: 300_000,
  });

  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['games', 'home'],
    queryFn: () => getGames({ limit: 9, page: 1 }),
    staleTime: 60_000,
  });

  const { data: promos = [] } = useQuery({
    queryKey: ['promotions'],
    queryFn: getPromotions,
    staleTime: 300_000,
  });

  const games = gamesData?.data || [];

  const banners = (promos as any[]).length > 0
    ? (promos as any[]).slice(0, 3).map((p: any) => ({
        id: p.id,
        title: p.name,
        description: p.description,
        link: `/promotions/${p.id}`,
      }))
    : PLACEHOLDER_BANNERS.map(b => ({
        id: b.id, title: b.title,
        description: b.description, link: b.link,
      }));

  return (
    <div className="space-y-0 pb-2">

      {/* ── Hero banner slider ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <BannerSlider banners={banners} showCta={!user} />
      </motion.div>

      {/* ── Quick links — antd-mini tile row ───────────────────── */}
      <section className="px-3 pt-3">
        <div className="grid grid-cols-4 gap-2">
          <QuickBtn to="/deposit"    img={HOME_IMGS.wallet}  label="Nạp tiền" />
          <QuickBtn to="/promotions" img={HOME_IMGS.gift}    label="Khuyến mãi" />
          <QuickBtn to="/vip"        img={HOME_IMGS.vip}     label="VIP" />
          <QuickBtn to="/download"   img={HOME_IMGS.service} label="Hỗ trợ" />
        </div>
      </section>

      {/* ── Divider thick (antd-mini page section break) ────────── */}
      <div className="h-2 bg-gray-100 dark:bg-gray-900/60 mt-3" />

      {/* ── Game categories ─────────────────────────────────────── */}
      {(categories as any[]).length > 0 && (
        <section className="px-3 pt-3">
          <SectionHeader title="Thể loại" />
          <div className="grid grid-cols-4 gap-2">
            {(categories as any[]).slice(0, 8).map((c: any) => (
              <CategoryChip key={c.id} cat={c} />
            ))}
          </div>
        </section>
      )}

      <div className="h-2 bg-gray-100 dark:bg-gray-900/60 mt-3" />

      {/* ── Hot games ───────────────────────────────────────────── */}
      <section className="px-3 pt-3">
        <SectionHeader title="Game nổi bật" viewAllTo="/games" />
        {gamesLoading ? <GameSkeleton /> : <GameGrid games={games} loading={false} />}
      </section>

      {/* ── Promotions ──────────────────────────────────────────── */}
      {(promos as any[]).length > 0 && (
        <>
          <div className="h-2 bg-gray-100 dark:bg-gray-900/60 mt-3" />
          <section className="px-3 pt-3 pb-1">
            <SectionHeader title="Khuyến mãi" viewAllTo="/promotions" />
            <PromotionList promotions={(promos as any[]).slice(0, 3)} />
          </section>
        </>
      )}

      <div className="h-2 bg-gray-100 dark:bg-gray-900/60 mt-3" />

      {/* ── Game providers — horizontal scroll ──────────────────── */}
      <section className="px-3 pt-3 pb-1">
        <SectionHeader title="Nhà cung cấp" />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {GAME_PROVIDERS.map(p => (
            <ProviderItem key={p.name} provider={p} />
          ))}
        </div>
      </section>

      {/* ── Download App CTA (antd-mini gradient card) ──────────── */}
      {!user && (
        <>
          <div className="h-2 bg-gray-100 dark:bg-gray-900/60 mt-1" />
          <section className="px-3 pt-3 pb-4">
            <Link
              to="/download"
              className="flex items-center justify-between p-4 rounded-2xl text-white
                transition-opacity hover:opacity-92 active:scale-[0.99]"
              style={{
                background: 'linear-gradient(135deg, var(--game-primary), var(--game-secondary))',
              }}
            >
              <div>
                <p className="text-sm font-black flex items-center gap-2">
                  <span>📲</span> Tải App GAMEX
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Android APK · iOS Enterprise · Tự động nhận diện
                </p>
              </div>
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                →
              </span>
            </Link>
          </section>
        </>
      )}

    </div>
  );
}
