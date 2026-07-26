import type { GameItemBoYue } from '../components/home/GameGridBoYue';

// ── Banners ────────────────────────────────────────────────────────────────
export const getBanners = () => [
  { id: '1', image: '/wap/img/banner1.avif' },
  { id: '2', image: '/wap/img/banner2.avif' },
  { id: '3', image: '/wap/img/banner3.avif' },
];

// ── Notices ────────────────────────────────────────────────────────────────
export const getNotices = () => [
  'Chào mừng bạn đến với LKVIP!',
  'Nạp tiền ngay hôm nay nhận thưởng 1888',
  'Sự kiện VIP cuối tuần – nhiều phần quà hấp dẫn',
];

// ── Sidebar categories ─────────────────────────────────────────────────────
export const getCategories = () => [
  { key: 'hot',        label: 'Hot',       icon: '/wap/img/icon_hot.png' },
  { key: 'slot',       label: 'Slot',      icon: '/wap/img/icon_slot.png' },
  { key: 'live',       label: 'Live',      icon: '/wap/img/icon_live.png' },
  { key: 'banca',      label: 'Bắn cá',    icon: '/wap/img/icon_banca.png' },
  { key: 'bai',        label: 'Bài',       icon: '/wap/img/icon_bai.png' },
  { key: 'xoso',       label: 'Xổ số',     icon: '/wap/img/icon_xoso.png' },
  { key: 'blockchain', label: 'Blockchain', icon: '/wap/img/icon_blockchain.png' },
];

// ── Games per category ─────────────────────────────────────────────────────
const makeList = (prefix: string, count: number): GameItemBoYue[] =>
  Array.from({ length: count }, (_, i) => ({
    id:   `${prefix}-${i + 1}`,
    name: `${prefix.toUpperCase()} ${i + 1}`,
    icon: `/wap/fs/game/wap/${prefix}${i + 1}.webp`,
  }));

export const getGames = (): Record<string, GameItemBoYue[]> => ({
  hot:        makeList('hot',   12),
  slot:       makeList('slot',   9),
  live:       makeList('live',   6),
  banca:      makeList('banca',  6),
  bai:        makeList('bai',    6),
  xoso:       makeList('xoso',   4),
  blockchain: makeList('chain',  3),
});

// ── Platform banners ───────────────────────────────────────────────────────
export const getPlatformBanners = () => [
  { image: '/wap/img/platform_banner1.avif' },
];
