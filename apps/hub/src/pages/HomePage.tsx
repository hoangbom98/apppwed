/**
 * HomePage — Trang chủ Hub
 * Banner video, activities, alliance members, tin tức, games
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as hubApi from '@/api/hub';
import {
  ArrowRight, Gamepad2, Smartphone, Gift, Crown,
  Handshake, ChevronRight, Newspaper, Download,
} from 'lucide-react';

// ── Dữ liệu tĩnh fallback ──────────────────────────────────────────────
const ACTIVITIES = [
  { name: 'OKlive',     img: '/assets/alliance/oklive.png',    fallbackIcon: 'live' },
  { name: 'OKgift',     img: '/assets/alliance/okgift.png',    fallbackIcon: 'gift' },
  { name: 'OKheart',    img: '/assets/alliance/okheart.png',   fallbackIcon: 'heart' },
  { name: 'Thành viên', img: '/assets/alliance/thanh-vien.png', fallbackIcon: 'user' },
  { name: 'Đối tác',    img: '/assets/alliance/doi-tac.png',   fallbackIcon: 'partner' },
];

const SPORTS = [
  { name: 'OK9', img: '/assets/alliance/ok9.png' },
];

const GAMBLING = [
  { name: 'FLY88',  img: '/assets/alliance/fly88.png' },
  { name: 'CM88',   img: '/assets/alliance/cm88.png' },
  { name: 'OK8386', img: '/assets/alliance/ok8386.png' },
  { name: 'OPEN88', img: '/assets/alliance/open88.png' },
  { name: 'SC88',   img: '/assets/alliance/sc88.png' },
  { name: 'C168',   img: '/assets/alliance/c168.png' },
];

const NEWS_IMGS = [
  '/assets/news/1.jpg',
  '/assets/news/2.jpg',
  '/assets/news/3.jpg',
  '/assets/news/4.jpg',
];

// ── Subcomponent: Skeleton ─────────────────────────────────────────────
const Skeleton = ({ cls }: { cls: string }) => (
  <div className={`hub-skeleton ${cls}`} />
);

interface Game {
  id: string;
  name: string;
  link?: string;
  slug: string;
  image?: string;
  category?: { name: string };
}

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  image?: string;
  summary: string;
}

// ── Icon fallback cho activities ──────────────────────────────────────
function ActivityIcon({ name }: { name: string }) {
  const map: Record<string, React.ReactElement> = {
    OKlive:     <span className="hub-activity-svg">▶</span>,
    OKgift:     <Gift size={22} className="text-yellow-400" />,
    OKheart:    <Crown size={22} className="text-pink-400" />,
    'Thành viên': <Handshake size={22} className="text-blue-400" />,
    'Đối tác':  <Handshake size={22} className="text-green-400" />,
  };
  return map[name] ?? <Gamepad2 size={22} className="text-gray-400" />;
}

export default function HomePage() {
  const navigate = useNavigate();

  const { data: gamesData,  isLoading: gamesLoading }  = useQuery({
    queryKey: ['games', { limit: 8 }],
    queryFn:  () => hubApi.getGames({ limit: 8, status: 'active' }),
  });
  const { data: newsData,   isLoading: newsLoading }   = useQuery({
    queryKey: ['news', { limit: 4 }],
    queryFn:  () => hubApi.getNewsList({ limit: 4 }),
  });
  const { data: bannerData } = useQuery({
    queryKey: ['banners', 'home'],
    queryFn:  () => hubApi.getBanners({ position: 'home' }),
  });

  const games   = (gamesData?.data?.data   as Game[]) || [];
  const news    = (newsData?.data?.data    as NewsItem[]) || [];
  const banners = (bannerData?.data?.data  as unknown[]) || [];

  return (
    <div className="hub-home">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <section className="hub-hero">
        {banners.length > 0 ? (
          <img src={banners[0].image} alt={banners[0].title} className="hub-banner-img" fetchPriority="high" width="800" height="300" />
        ) : (
          <div className="hub-banner-video-wrap">
            <video
              src="/assets/videos/banner.mp4"
              autoPlay muted loop playsInline
              className="hub-banner-video"
              poster="/assets/png/bg-banner.png"
            />
            <div className="hub-banner-overlay">
              <h1 className="hub-banner-title">LKVIP HUB</h1>
              <p className="hub-banner-sub">Cổng giải trí hàng đầu Việt Nam</p>
              <div className="hub-banner-btns">
                <button onClick={() => navigate('/games')}
                  className="hub-btn hub-btn--primary">
                  <Gamepad2 size={14} /> Games
                </button>
                <button onClick={() => navigate('/download')}
                  className="hub-btn hub-btn--outline">
                  <Smartphone size={14} /> Tải App
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Activity Shortcuts ───────────────────────────────── */}
      <section className="hub-section">
        <div className="hub-activity-list">
          {ACTIVITIES.map(a => (
            <button key={a.name} className="hub-activity-item" aria-label={a.name}>
              <div className="hub-activity-icon">
                <img src={a.img} alt={a.name} loading="lazy"
                  onError={e => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.display = 'none';
                    const fb = el.nextElementSibling as HTMLElement | null;
                    if (fb) fb.style.display = 'flex';
                  }} />
                <span className="hub-activity-fallback" style={{ display: 'none' }}>
                  <ActivityIcon name={a.name} />
                </span>
              </div>
              <span>{a.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Games nổi bật ────────────────────────────────────── */}
      <section className="hub-section">
        <div className="hub-section-header">
          <h2 className="hub-section-title flex items-center gap-2">
            <Gamepad2 size={16} className="text-[var(--hub-primary)]" />
            Games nổi bật
          </h2>
          <button className="hub-view-all" onClick={() => navigate('/games')}>
            Xem tất cả <ArrowRight size={14} />
          </button>
        </div>
        <div className="hub-games-grid">
          {gamesLoading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} cls="hub-game-skeleton" />)
            : games.length > 0
              ? games.map((g: Game) => (
                  <a key={g.id} href={g.link || `/games/${g.slug}`}
                    target={g.link ? '_blank' : '_self'} rel="noreferrer"
                    className="hub-game-card">
                    {g.image
                      ? <img src={g.image} alt={g.name} className="hub-game-thumb" loading="lazy" />
                      : <div className="hub-game-no-img">
                          <Gamepad2 size={22} className="text-gray-500" />
                        </div>
                    }
                    <div className="hub-game-info">
                      <p className="hub-game-name">{g.name}</p>
                      <p className="hub-game-cat">{g.category?.name}</p>
                    </div>
                  </a>
                ))
              : GAMBLING.map(g => (
                  <div key={g.name} className="hub-game-card hub-game-card--logo">
                    <img src={g.img} alt={g.name} className="hub-game-logo" loading="lazy"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.4'; }} />
                    <p className="hub-game-name">{g.name}</p>
                  </div>
                ))
          }
        </div>
      </section>

      {/* ── Alliance Members ─────────────────────────────────── */}
      <section className="hub-section hub-alliance">
        <h2 className="hub-section-title flex items-center gap-2">
          <Handshake size={16} className="text-[var(--hub-primary)]" />
          Thành viên liên minh
        </h2>

        {/* Thể thao */}
        <div className="hub-alliance-cat">
          <div className="hub-alliance-cat-title">
            <span className="hub-cat-dot" />
            <span>Thể Thao</span>
          </div>
          <div className="hub-alliance-list">
            {SPORTS.map(s => (
              <div key={s.name} className="hub-alliance-item">
                <div className="hub-alliance-logo">
                  <img src={s.img} alt={s.name} loading="lazy" />
                </div>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Casino · Nổ Hũ · Bắn Cá */}
        <div className="hub-alliance-cat">
          <div className="hub-alliance-cat-title">
            <span className="hub-cat-dot" />
            <span>Casino · Nổ Hũ · Bắn Cá</span>
          </div>
          <div className="hub-alliance-list">
            {GAMBLING.map(g => (
              <div key={g.name} className="hub-alliance-item">
                <div className="hub-alliance-logo">
                  <img src={g.img} alt={g.name} loading="lazy"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tin tức ─────────────────────────────────────────── */}
      <section className="hub-section">
        <div className="hub-section-header">
          <h2 className="hub-section-title flex items-center gap-2">
            <Newspaper size={16} className="text-[var(--hub-primary)]" />
            Tin tức mới nhất
          </h2>
          <button className="hub-view-all" onClick={() => navigate('/news')}>
            Xem thêm <ChevronRight size={14} />
          </button>
        </div>
        <div className="hub-news-grid">
          {newsLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} cls="hub-news-skeleton" />)
            : news.length > 0
              ? news.map((n: NewsItem, i: number) => (
                  <button key={n.id} onClick={() => navigate(`/news/${n.slug}`)}
                    className="hub-news-card">
                    <img src={n.image || NEWS_IMGS[i % NEWS_IMGS.length]} alt={n.title}
                      className="hub-news-img" loading="lazy"
                      onError={e => { (e.currentTarget as HTMLImageElement).src = NEWS_IMGS[i % NEWS_IMGS.length]; }} />
                    <div className="hub-news-body">
                      <p className="hub-news-title">{n.title}</p>
                      <p className="hub-news-summary">{n.summary}</p>
                    </div>
                  </button>
                ))
              : NEWS_IMGS.slice(0, 4).map((img, i) => (
                  <button key={i} onClick={() => navigate('/news')} className="hub-news-card">
                    <img src={img} alt={`Tin tức ${i + 1}`} className="hub-news-img" loading="lazy" />
                    <div className="hub-news-body">
                      <p className="hub-news-title">Tin tức nổi bật #{i + 1}</p>
                      <p className="hub-news-summary">Cập nhật tin tức mới nhất từ LKVIP...</p>
                    </div>
                  </button>
                ))
          }
        </div>
      </section>

      {/* ── Download CTA ─────────────────────────────────────── */}
      <section className="hub-section hub-cta">
        <div className="hub-cta-box">
          <div className="hub-cta-text">
            <p className="hub-cta-title flex items-center gap-2">
              <Smartphone size={16} />
              Tải App LKVIP
            </p>
            <p className="hub-cta-sub">Android APK · iOS Enterprise · Tự động nhận diện</p>
          </div>
          <button onClick={() => navigate('/download')} className="hub-btn hub-btn--primary flex items-center gap-1">
            Tải ngay <Download size={14} />
          </button>
        </div>
      </section>

    </div>
  );
}
