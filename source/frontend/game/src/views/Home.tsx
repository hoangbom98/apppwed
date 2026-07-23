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

  // Build banners: try promotions first, fallback to placeholders
  const banners = (promos as any[]).length > 0
    ? (promos as any[]).slice(0, 3).map((p: any) => ({
        id: p.id,
        title: p.name,
        description: p.description,
        link: `/promotions/${p.id}`,
      }))
    : PLACEHOLDER_BANNERS.map(b => ({ id: b.id, title: b.title, description: b.description, link: b.link }));

  return (
    <div className="space-y-4 pb-2">
      {/* ── Hero Banner Slider ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <BannerSlider banners={banners} showCta={!user} />
      </motion.div>

      {/* ── Quick Links Row (WAP style) ────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-4 gap-2">
          {[
            { to: '/deposit',    img: HOME_IMGS.wallet,  label: 'Nạp tiền' },
            { to: '/promotions', img: HOME_IMGS.gift,    label: 'Khuyến mãi' },
            { to: '/vip',        img: HOME_IMGS.vip,     label: 'VIP' },
            { to: '/download',   img: HOME_IMGS.service, label: 'Hỗ trợ' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl py-2.5 px-1 active:scale-95 transition-all"
            >
              <img src={item.img} alt={item.label} className="w-8 h-8 object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }} />
              <span className="text-[10px] text-gray-700 dark:text-gray-300 font-semibold text-center leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Quick Categories ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2.5 uppercase tracking-wider">Thể loại</h2>
          <div className="grid grid-cols-4 gap-2">
            {(categories as any[]).slice(0, 8).map((c: any, i: number) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Link
                  to={`/games?category=${c.id}`}
                  className="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-800 hover:bg-primary/5 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl p-2 transition-all active:scale-95 group"
                >
                  {CATEGORY_ICON_MAP[c.slug] ? (
                    <img
                      src={CATEGORY_ICON_MAP[c.slug]}
                      alt={c.name}
                      className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        el.style.display = 'none';
                        const fb = el.nextElementSibling as HTMLElement | null;
                        if (fb) fb.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <span className="text-xl hidden">{c.icon || '🎮'}</span>
                  {!CATEGORY_ICON_MAP[c.slug] && (
                    <span className="text-2xl">{c.icon || '🎮'}</span>
                  )}
                  <span className="text-[10px] text-gray-700 dark:text-gray-300 font-semibold text-center leading-tight">{c.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Hot Games ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <img src={HOME_IMGS.hotsports} alt="hot" className="w-5 h-5 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <h2 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Game Nổi Bật</h2>
          </div>
          <Link to="/games" className="text-xs text-primary hover:text-secondary font-semibold">Xem tất cả →</Link>
        </div>
        <GameGrid games={games} loading={gamesLoading} />
      </section>

      {/* ── Promotions ─────────────────────────────────────────────────── */}
      {(promos as any[]).length > 0 && (
        <section className="pb-1">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <img src={HOME_IMGS.gift} alt="gift" className="w-5 h-5 object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              <h2 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Khuyến Mãi</h2>
            </div>
            <Link to="/promotions" className="text-xs text-primary hover:text-secondary font-semibold">Xem tất cả →</Link>
          </div>
          <PromotionList promotions={(promos as any[]).slice(0, 3)} />
        </section>
      )}

      {/* ── Game Providers — WAP logo scroll ───────────────────────────── */}
      <section className="pb-2">
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2.5 uppercase tracking-wider">Nhà cung cấp</h2>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {GAME_PROVIDERS.map((p) => (
            <div
              key={p.name}
              className="shrink-0 flex flex-col items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl min-w-[64px]"
            >
              <img
                src={p.logo}
                alt={p.name}
                className="h-7 w-14 object-contain"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = 'none';
                  const fb = el.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = 'block';
                }}
              />
              <span className="hidden text-[9px] text-gray-500 font-semibold text-center">{p.name}</span>
              <span className="text-[9px] text-gray-500 dark:text-gray-400 font-semibold text-center leading-tight">{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Download App CTA ───────────────────────────────────────────── */}
      {!user && (
        <section className="pb-4">
          <Link
            to="/download"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-primary to-secondary rounded-2xl text-white hover:opacity-90 transition-opacity active:scale-[0.99]"
          >
            <div>
              <p className="text-sm font-black flex items-center gap-2">
                <img src="/wap/img/home_service.png" alt="" className="w-4 h-4 object-contain" />
                Tải App GAMEX
              </p>
              <p className="text-xs text-white/70 mt-0.5">Android APK · iOS Enterprise · Tự động nhận diện</p>
            </div>
            <span className="text-2xl shrink-0">→</span>
          </Link>
        </section>
      )}
    </div>
  );
}
