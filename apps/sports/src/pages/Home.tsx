import { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getLiveMatches, getTodayMatches, getHighlights, getArticles, getStreams } from '../api/sports';
import MatchCard from '../components/MatchCard';
import HighlightCard from '../components/HighlightCard';
import NewsCard from '../components/NewsCard';
import { useAuthStore } from '../store/authStore';

function Section({ title, to, children }: { title: string; to?: string; children: ReactNode }) {
  return (
    <section className="mb-4">
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="font-bold text-sm text-gray-200">{title}</h2>
        {to && <Link to={to} className="text-xs text-green-400 hover:text-green-300">Xem thêm</Link>}
      </div>
      {children}
    </section>
  );
}

export default function HomePage() {
  const { isLoggedIn } = useAuthStore();
  const { data: live }       = useQuery({ queryKey: ['matches', 'live'],      queryFn: getLiveMatches,            staleTime: 30_000 });
  const { data: today }      = useQuery({ queryKey: ['matches', 'today'],     queryFn: getTodayMatches,           staleTime: 60_000 });
  const { data: hlRes }      = useQuery({ queryKey: ['highlights', 'home'],   queryFn: () => getHighlights({ limit: 6 }), staleTime: 120_000 });
  const { data: newsRes }    = useQuery({ queryKey: ['news', 'home'],         queryFn: () => getArticles({ limit: 5 }), staleTime: 120_000 });
  const { data: streamRes }  = useQuery({ queryKey: ['streams', 'live'],      queryFn: () => getStreams({ status: 'live' }), staleTime: 30_000 });

  const liveMatches     = live    || [];
  const todayMatches    = (today  || []).slice(0, 8);
  const highlights      = hlRes?.highlights  || [];
  const articles        = newsRes?.articles  || [];
  const liveStreams      = streamRes?.streams || [];

  return (
    <div className="pt-2 pb-2">
      {/* Live matches strip */}
      {liveMatches.length > 0 && (
        <Section title={`Đang diễn ra (${liveMatches.length})`} to="/schedule">
          <div className="px-4 space-y-2">
            {liveMatches.map((m: any) => <MatchCard key={m.id} match={m} />)}
          </div>
        </Section>
      )}

      {/* Live streams */}
      {liveStreams.length > 0 && (
        <Section title="Livestream" to="/streams">
          <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar">
            {liveStreams.map((s: any) => (
              <Link key={s.id} to={`/streams/${s.id}`} className="flex-shrink-0 w-40">
                <div className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden">
                  {s.thumbnail && <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" />}
                  <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1 rounded">LIVE</span>
                </div>
                <p className="text-xs font-medium mt-1 line-clamp-1">{s.title}</p>
                <p className="text-[10px] text-gray-500">{s.viewers} đang xem</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Today matches */}
      {todayMatches.length > 0 && (
        <Section title="Hôm nay" to="/schedule">
          <div className="px-4 space-y-2">
            {todayMatches.map((m: any) => <MatchCard key={m.id} match={m} />)}
          </div>
        </Section>
      )}

      {/* Highlights row */}
      {highlights.length > 0 && (
        <Section title="Highlights" to="/highlights">
          <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar">
            {highlights.map((h: any) => (
              <div key={h.id} className="flex-shrink-0 w-52">
                <HighlightCard highlight={h} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* News */}
      {articles.length > 0 && (
        <Section title="Tin tức" to="/news">
          <div className="px-4 space-y-2">
            {articles.map((a: any) => <NewsCard key={a.id} article={a} />)}
          </div>
        </Section>
      )}

      {/* Download App CTA — shown when logged out */}
      {!isLoggedIn && (
        <section className="mx-4 mb-4 mt-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-emerald-900 p-5">
            <div className="relative z-10">
              <p className="font-black text-white text-base mb-1">Tải app Sports Live</p>
              <p className="text-green-200 text-xs mb-4">Xem tỷ số trực tiếp, livestream HD — miễn phí 100%</p>
              <div className="flex gap-2">
                <Link to="/download"
                  className="flex items-center gap-1.5 px-3 py-2 bg-white text-green-800 rounded-xl text-xs font-bold transition-opacity hover:opacity-90">
                  Android
                </Link>
                <Link to="/download"
                  className="flex items-center gap-1.5 px-3 py-2 bg-white text-green-800 rounded-xl text-xs font-bold transition-opacity hover:opacity-90">
                  iOS
                </Link>
              </div>
            </div>
            {/* Decorative ball */}
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
            <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-white/5" />
          </div>
        </section>
      )}
    </div>
  );
}
