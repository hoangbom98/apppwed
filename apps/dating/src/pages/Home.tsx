/**
 * Dating Home.tsx — antd-mini inspired UI
 * Stories row, user thumb cards, section headers with indicator bars,
 * quick action tiles, CSS token colours, shimmer skeletons
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getHomeData } from '@/api/users';
import { getStories } from '@/api/stories';
import { useAuthStore } from '@/store/authStore';
import { MapPin, Zap, Crown, Users, Star, Heart } from 'lucide-react';
import {
  HeartOutlined, GiftOutlined, PlaySquareOutlined, StarFilled,
  MobileOutlined, TeamOutlined, RocketOutlined, DiamondOutlined,
  FireOutlined, CheckCircleFilled, EnvironmentOutlined, StarOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { ASSET_UI } from '@/utils/constants';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface UserCard {
  id: number; full_name: string; avatar: string | null;
  age: number; city: string; is_online: boolean; vip_level: number;
  views?: number; rating?: number; is_live?: boolean;
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION HEADER — antd-mini pattern: indicator bar + title + see-all
   ══════════════════════════════════════════════════════════════════════════ */
function SectionHeader({
  title,
  icon,
  onSeeAll,
}: {
  title: string;
  icon?: React.ReactNode;
  onSeeAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 mb-3">
      <div className="dating-section-title">
        {/* antd-mini style: left accent indicator bar */}
        <span className="dating-section-indicator" aria-hidden="true" />
        {icon}
        <span>{title}</span>
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="text-[11px] font-semibold transition-opacity hover:opacity-80"
          style={{ color: 'var(--dating-primary)' }}
        >
          Xem tất cả
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   USER THUMB CARD — antd-mini card pattern with CSS token border-radius
   ══════════════════════════════════════════════════════════════════════════ */
function UserThumb({ user, onClick }: { user: UserCard; onClick: () => void }) {
  return (
    <div
      className="dating-user-thumb flex-shrink-0"
      style={{ width: 80, height: 108 }}
      onClick={onClick}
    >
      {/* Avatar */}
      {user.avatar
        ? <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
        : <img src={ASSET_UI.DEFAULT_AVATAR} alt="" className="w-full h-full object-cover" style={{ background: 'var(--dating-border)' }} />
      }

      {/* LIVE badge (antd-mini style pulse dot) */}
      {user.is_live && (
        <span className="dating-live-badge absolute top-1.5 left-1.5">
          LIVE
        </span>
      )}

      {/* Online dot */}
      {user.is_online && !user.is_live && (
        <span
          className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-white"
          style={{ background: '#22c55e' }}
        />
      )}

      {/* VIP crown */}
      {user.vip_level > 0 && (
        <div className="vip-ring absolute top-1.5 left-1.5 w-5 h-5 flex items-center justify-center">
          <Crown size={10} className="text-white" />
        </div>
      )}

      {/* Bottom info overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 pt-5"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)' }}
      >
        <p className="text-white text-[10px] font-bold truncate">
          {user.full_name.split(' ').pop()}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Heart size={8} className="text-pink-300 fill-pink-300" />
          <span className="text-white/70 text-[8px]">
            {(user.rating ?? (Math.random() * 2 + 8).toFixed(1))}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   USER ROW SECTION — horizontal scroll (antd-mini style)
   ══════════════════════════════════════════════════════════════════════════ */
function UserSection({
  title, icon, users, onSeeAll, navigate,
}: {
  title: string;
  icon?: React.ReactNode;
  users: UserCard[];
  onSeeAll?: () => void;
  navigate: (path: string) => void;
}) {
  if (!users.length) return null;
  return (
    <div className="mb-5">
      <SectionHeader title={title} icon={icon} onSeeAll={onSeeAll} />
      <div className="flex gap-2.5 px-4 overflow-x-auto no-scrollbar">
        {users.map(u => (
          <UserThumb
            key={u.id} user={u}
            onClick={() => navigate(`/profile/${u.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STORY BUBBLE — antd-mini ring gradient indicator
   ══════════════════════════════════════════════════════════════════════════ */
function StoryBubble({
  avatar, name, isNew, onClick,
}: {
  avatar?: string;
  name: string;
  isNew?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="flex-shrink-0 flex flex-col items-center gap-1"
      onClick={onClick}
    >
      {isNew ? (
        /* Add story: dashed circle */
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            border: '2px dashed var(--dating-primary)',
            background: 'var(--dating-primary-light)',
          }}
        >
          <span className="text-xl font-light" style={{ color: 'var(--dating-primary)' }}>+</span>
        </div>
      ) : (
        /* Story with gradient ring */
        <div className="story-ring" style={{ width: 56, height: 56 }}>
          <div className="story-ring-inner">
            <img
              src={avatar || ''} alt={name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>
      )}
      <span
        className="text-[10px] text-center w-14 truncate"
        style={{ color: 'var(--dating-text-muted)' }}
      >
        {name}
      </span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   QUICK ACTION TILES — antd-mini grid of rounded tile buttons
   ══════════════════════════════════════════════════════════════════════════ */
const QUICK_ACTIONS: { icon: React.ReactNode; label: string; path: string }[] = [
  { icon: <HeartOutlined />,      label: 'Swipe',     path: '/swipe' },
  { icon: <GiftOutlined />,       label: 'Quà',       path: '/shop' },
  { icon: <PlaySquareOutlined />, label: 'Party',     path: '/party' },
  { icon: <StarFilled />,         label: 'VIP',       path: '/vip' },
  { icon: <MobileOutlined />,     label: 'Shorts',    path: '/shorts' },
  { icon: <TeamOutlined />,       label: 'Cộng đồng', path: '/community' },
  { icon: <RocketOutlined />,     label: 'Sự kiện',   path: '/events' },
  { icon: <DiamondOutlined />,    label: 'Nạp xu',    path: '/recharge' },
];

/* ══════════════════════════════════════════════════════════════════════════
   HOME PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  useAuthStore();

  const { data: home, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: getHomeData,
  });
  const { data: storiesData } = useQuery({
    queryKey: ['stories'],
    queryFn: getStories,
  });

  const stories     = storiesData?.stories  || [];
  const banners     = home?.banners         || [];
  const hotUsers    = home?.hot_users       || [];
  const onlineUsers = home?.online_users    || [];
  const nearbyUsers = home?.nearby_users    || [];
  const newUsers    = home?.new_users       || [];
  const vipUsers    = home?.vip_users       || [];
  const recommended = home?.recommended     || [];

  return (
    <div className="pb-6" style={{ background: 'var(--dating-bg)' }}>

      {/* ── Stories row (antd-mini horizontal scroll) ─────────── */}
      <div
        className="px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar"
        style={{ borderBottom: '1px solid var(--dating-border)' }}
      >
        {/* Add story */}
        <StoryBubble
          name="Story" isNew
          onClick={() => navigate('/stories')}
        />

        {stories.map((s: any) => (
          <StoryBubble
            key={s.id}
            avatar={s.user.avatar}
            name={s.user.full_name.split(' ').pop() ?? s.user.full_name}
            onClick={() => navigate('/stories')}
          />
        ))}

        {/* Shimmer when loading */}
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="dating-skeleton w-14 h-14 rounded-full" />
            <div className="dating-skeleton w-10 h-2 rounded" />
          </div>
        ))}
      </div>

      {/* ── Banner ─────────────────────────────────────────────── */}
      {banners.length > 0 && (
        <div className="px-4 mt-4 mb-2">
          <div
            className="h-36 rounded-2xl overflow-hidden relative"
            style={{ boxShadow: 'var(--dating-card-shadow)' }}
          >
            <img
              src={banners[0]?.image} alt=""
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 flex items-center px-5"
              style={{ background: 'linear-gradient(90deg, rgba(236,72,153,0.72) 0%, transparent 100%)' }}
            >
              <div>
                <p className="text-white font-black text-lg leading-tight">
                  {banners[0]?.title}
                </p>
                {banners[0]?.subtitle && (
                  <p className="text-white/80 text-xs mt-1">{banners[0].subtitle}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick action grid (antd-mini tile buttons) ─────────── */}
      <div className="px-4 mt-3 mb-1">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="dating-quick-btn"
            >
              <span className="dating-quick-btn-icon">{item.icon}</span>
              <span className="dating-quick-btn-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* antd-mini page section divider */}
      <div className="h-2 mt-3" style={{ background: 'var(--dating-bg-sheet)' }} />

      {/* ── User sections ──────────────────────────────────────── */}
      <div className="mt-4">

        <UserSection
          title="Nổi bật hôm nay"
          icon={<FireOutlined style={{ color: '#f97316' }} />}
          users={hotUsers}
          onSeeAll={() => navigate('/discovery')}
          navigate={navigate}
        />

        <UserSection
          title="Đang online"
          icon={<CheckCircleFilled style={{ color: '#22c55e' }} />}
          users={onlineUsers}
          onSeeAll={() => navigate('/discovery?filter=online')}
          navigate={navigate}
        />

        <UserSection
          title="Gần bạn"
          icon={<EnvironmentOutlined style={{ color: '#3b82f6' }} />}
          users={nearbyUsers}
          onSeeAll={() => navigate('/nearby')}
          navigate={navigate}
        />

        <UserSection
          title="Gợi ý cho bạn"
          icon={<StarOutlined style={{ color: '#eab308' }} />}
          users={recommended}
          onSeeAll={() => navigate('/discovery')}
          navigate={navigate}
        />

        <UserSection
          title="Thành viên mới"
          icon={<TeamOutlined style={{ color: '#22c55e' }} />}
          users={newUsers}
          navigate={navigate}
        />

        <UserSection
          title="VIP"
          icon={<CrownOutlined style={{ color: '#eab308' }} />}
          users={vipUsers}
          navigate={navigate}
        />
      </div>

      {/* ── Loading shimmer ─────────────────────────────────────── */}
      {isLoading && (
        <div className="px-4 mt-4 space-y-4">
          {[1, 2].map(i => (
            <div key={i}>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex-shrink-0 dating-skeleton rounded-2xl" style={{ width: 80, height: 108 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
