/**
 * src/data/gameData.ts — Canonical game data layer
 * -------------------------------------------------
 * Single source of truth for the game app's static/mock data.
 * Uses real TCGaming CDN icon URLs from:
 *   https://images.b728484.com:42666/TCG_GAME_ICONS/{PROVIDER}/{game_code}.png
 *
 * Game codes come from /var/www/wap/src/config/game/storages/rng|fish|chess/*.json
 * Category slugs are aligned with the backend GameCategory DB seeds.
 */

import type { GameItem } from '../components/home/GameGrid';
import { tcgIcon, tcgIconVI, tcgLocalAvif, TC_PRODUCT_CODES } from '../utils/gameImages';

// ── Banners ────────────────────────────────────────────────────────────────
export interface BannerItem {
  id: string;
  image: string;
  link?: string;
}

export const getBanners = (): BannerItem[] => [
  { id: '1', image: '/wap/img/banner1.avif',  link: '/promotions' },
  { id: '2', image: '/wap/img/banner2.avif',  link: '/promotions' },
  { id: '3', image: '/wap/img/banner3.avif',  link: '/vip' },
];

// ── Notice messages ────────────────────────────────────────────────────────
export const getNotices = (): string[] => [
  'Chào mừng bạn đến với LKVIP!',
  'Nạp tiền ngay hôm nay nhận thưởng 1888 đ',
  'Sự kiện VIP cuối tuần – nhiều phần quà hấp dẫn',
  'Hoàn trả hàng ngày theo cấp VIP – nhận ngay!',
];

// ── Sidebar categories ─────────────────────────────────────────────────────
export interface CategoryItem {
  key: string;
  slug: string;   // DB GameCategory.slug
  label: string;
  icon: string;
}

export const getCategories = (): CategoryItem[] => [
  { key: 'hot',     slug: 'hot',        label: 'Hot',       icon: '/wap/img/icon_hot.png' },
  { key: 'slot',    slug: 'slot',       label: 'Slot',      icon: '/wap/img/icon_slot.png' },
  { key: 'live',    slug: 'live-casino',label: 'Live',      icon: '/wap/img/icon_live.png' },
  { key: 'banca',   slug: 'fishing',    label: 'Bắn cá',    icon: '/wap/img/icon_banca.png' },
  { key: 'bai',     slug: 'card',       label: 'Bài',       icon: '/wap/img/icon_bai.png' },
  { key: 'xoso',    slug: 'lottery',    label: 'Xổ số',     icon: '/wap/img/icon_xoso.png' },
  { key: 'thethao', slug: 'sports',     label: 'Thể thao',  icon: '/wap/img/icon_sports.png' },
];

// ── Helper factories ──────────────────────────────────────────────────────
// CDN icon (most providers)
const g = (id: string, name: string, provider: string, code: string): GameItem =>
  ({ id, name, icon: tcgIcon(provider, code) });

// CDN icon with Vietnamese locale (PG, JDB)
const gVI = (id: string, name: string, provider: string, code: string): GameItem =>
  ({ id, name, icon: tcgIconVI(provider, code) });

// Local avif thumbnail (/game_pictures/p/280/L1/{tcCode}/{dbId}/custom_VND.avif)
const gL = (id: string, name: string, tcCode: number, dbId: number): GameItem =>
  ({ id, name, icon: tcgLocalAvif(tcCode, dbId) });

// ── Games per category ────────────────────────────────────────────────────
// Source: /var/www/wap/src/config/game/storages/
// Provider codes: PG=98, CQ9=16, JL(JILI)=140, JDB=55, FC=141, PP=39, KA=157
export const getGames = (): Record<string, GameItem[]> => ({

  // ── HOT picks (top games from all providers) ──────────────────────────
  hot: [
    gVI('hot-1',  'Mahjong Ways 2',          'PG',  'PG0053'),
    gVI('hot-2',  'Lucky Neko',              'PG',  'PG0068'),
    gVI('hot-3',  'Fortune Ox',             'PG',  'PG0054'),
    gVI('hot-4',  'Wild Bandito',           'PG',  'PG0065'),
    g  ('hot-5',  'Golden Empire',          'JL',  'JL0031'),
    g  ('hot-6',  'Money Coming',           'JL',  'JL0011'),
    g  ('hot-7',  'Mega Ace',               'JL',  'JL0048'),
    g  ('hot-8',  'Tài Xỉu CHICAGO II',     'CQ9', 'CQ0432'),
    g  ('hot-9',  'Xã hội đen',             'CQ9', 'CQ0431'),
    g  ('hot-10', 'Gates of Olympus',       'PP',  'PP-SL048'),
    gVI('hot-11', 'POP POP CANDY JDB',      'JDB', 'JDB202'),
    gVI('hot-12', 'Mahjong Ways PG',        'PG',  'PG0080'),
  ],

  // ── SLOT (RNG) ───────────────────────────────────────────────────────
  slot: [
    gVI('slot-1',  'Safari hoang dã',       'PG',  'PG0130'),
    gVI('slot-2',  'Du thuyền hoàng gia',   'PG',  'PG0129'),
    gVI('slot-3',  'Kẹo trái cây',          'PG',  'PG0128'),
    gVI('slot-4',  'Lái xe siêu tốc',       'PG',  'PG0126'),
    gVI('slot-5',  'Tinh thần huyền bí',    'PG',  'PG0125'),
    gVI('slot-6',  'Giật gân Songkran',     'PG',  'PG0124'),
    g  ('slot-7',  'Cướp kho báu CQ9',      'CQ9', 'CQ0429'),
    g  ('slot-8',  'CHICAGOⅡ CQ9',          'CQ9', 'CQ0432'),
    g  ('slot-9',  'POP POP CANDY',         'JDB', 'JDB202'),
    gVI('slot-10', 'OPEN SESAME MEGA',      'JDB', 'JDB201'),
    g  ('slot-11', 'SUPER ELEMENTS FC',     'FC',  'FC0045'),
    g  ('slot-12', 'Fortune Egg FC',        'FC',  'FC0043'),
  ],

  // ── LIVE CASINO ─────────────────────────────────────────────────────
  // Use local avif thumbnails for live casino (product code 27=DG, 118=WM, 93=SA, 112=SEX)
  live: [
    gL('live-1', 'Dream Gaming Baccarat',   TC_PRODUCT_CODES.DG,  2),
    gL('live-2', 'Dream Gaming Roulette',   TC_PRODUCT_CODES.DG,  3),
    gL('live-3', 'WM Casino Baccarat',      TC_PRODUCT_CODES.WM,  2),
    gL('live-4', 'WM Casino Sic Bo',        TC_PRODUCT_CODES.WM,  3),
    gL('live-5', 'SA Gaming Baccarat',      TC_PRODUCT_CODES.SA,  1),
    gL('live-6', 'Sexy Baccarat',           TC_PRODUCT_CODES.SEX, 2),
  ],

  // ── FISHING (Bắn cá) ────────────────────────────────────────────────
  // Source: /var/www/wap/src/config/game/storages/fish/ALL.json
  banca: [
    g  ('banca-1', 'JL Câu cá toàn sao',     'JL',  'JL0050'),
    g  ('banca-2', 'JL Câu cá Hoàng gia',    'JL',  'JL0002'),
    g  ('banca-3', 'JL Đánh cá bằng ném bom','JL',  'JL0003'),
    g  ('banca-4', 'JL Trùm khủng long',     'JL',  'JL0004'),
    g  ('banca-5', 'JL Câu cá độc đắc',      'JL',  'JL0005'),
    g  ('banca-6', 'CQ9 Câu cá anh hùng',    'CQ9', 'CQ0396'),
  ],

  // ── BÀI / CHESS / PVP ───────────────────────────────────────────────
  // Source: /var/www/wap/src/config/game/storages/chess/ALL.json (JL, KM)
  bai: [
    g  ('bai-1',  'Keno JILI',               'JL',  'JL0122'),
    g  ('bai-2',  'Pusoy Go JILI',           'JL',  'JL0120'),
    g  ('bai-3',  'mỏ vàng JILI',            'JL',  'JL0119'),
    g  ('bai-4',  'Bánh xe JILI',            'JL',  'JL0118'),
    g  ('bai-5',  'Mật Địa Hoàng Kim',       'JL',  'JL0117'),
    g  ('bai-6',  'Ace hoang dã',            'JL',  'JL0116'),
  ],

  // ── LOTTERY / XỔ SỐ ─────────────────────────────────────────────────
  // TC product codes: TCGL=2, LB=64
  xoso: [
    gL('xoso-1', 'TCG LOTTO Lobby',          TC_PRODUCT_CODES.TCGL, 1),
    gL('xoso-2', 'TCG LOTTO VN',             TC_PRODUCT_CODES.TCGL, 2),
    gL('xoso-3', 'LB-KENO',                  TC_PRODUCT_CODES.LB,   1),
    g ('xoso-4', 'Keno CQ9',                 'CQ9', 'CQ0432'),
  ],

  // ── THỂ THAO ─────────────────────────────────────────────────────────
  thethao: [
    gL('sport-1', 'BTI Sports Lobby',        TC_PRODUCT_CODES.BTI,  1),
    gL('sport-2', 'BBIN Sports',             TC_PRODUCT_CODES.BBIN, 1),
    gL('sport-3', 'BBIN Live Dealer',        TC_PRODUCT_CODES.BBIN, 2),
  ],
});

// ── Platform promo banners ────────────────────────────────────────────────
export const getPlatformBanners = (): { image: string; link?: string }[] => [
  { image: '/wap/img/platform_banner1.avif', link: '/promotions' },
];

// ── VIP levels — mirrors DB VipLevel seed exactly ─────────────────────────
export interface VipLevelInfo {
  level:            number;
  name:             string;
  minTotalDeposit:  number;
  cashbackRate:     number;   // e.g. 0.008 = 0.8%
  interestRate:     number;   // daily balance interest
  withdrawLimit:    number;
  freeSpins:        number;
  dailyBonus:       number;
  monthlyBonus:     number;
}

export const VIP_LEVELS: VipLevelInfo[] = [
  { level: 1,  name: 'Đồng',       minTotalDeposit: 0,              cashbackRate: 0.003, interestRate: 0.001, withdrawLimit: 50_000_000,      freeSpins: 0,   dailyBonus: 0,         monthlyBonus: 0 },
  { level: 2,  name: 'Bạc',        minTotalDeposit: 5_000_000,      cashbackRate: 0.005, interestRate: 0.002, withdrawLimit: 100_000_000,     freeSpins: 5,   dailyBonus: 8_000,     monthlyBonus: 80_000 },
  { level: 3,  name: 'Vàng',       minTotalDeposit: 20_000_000,     cashbackRate: 0.008, interestRate: 0.003, withdrawLimit: 200_000_000,     freeSpins: 10,  dailyBonus: 18_000,    monthlyBonus: 180_000 },
  { level: 4,  name: 'Bạch Kim',   minTotalDeposit: 50_000_000,     cashbackRate: 0.010, interestRate: 0.004, withdrawLimit: 500_000_000,     freeSpins: 20,  dailyBonus: 38_000,    monthlyBonus: 380_000 },
  { level: 5,  name: 'Kim Cương',  minTotalDeposit: 200_000_000,    cashbackRate: 0.015, interestRate: 0.005, withdrawLimit: 2_000_000_000,   freeSpins: 50,  dailyBonus: 68_000,    monthlyBonus: 680_000 },
  { level: 6,  name: 'VIP 6',      minTotalDeposit: 500_000_000,    cashbackRate: 0.018, interestRate: 0.006, withdrawLimit: 5_000_000_000,   freeSpins: 80,  dailyBonus: 108_000,   monthlyBonus: 1_080_000 },
  { level: 7,  name: 'VIP 7',      minTotalDeposit: 1_000_000_000,  cashbackRate: 0.020, interestRate: 0.007, withdrawLimit: 10_000_000_000,  freeSpins: 100, dailyBonus: 888_000,   monthlyBonus: 8_880_000 },
  { level: 8,  name: 'VIP 8',      minTotalDeposit: 2_000_000_000,  cashbackRate: 0.023, interestRate: 0.008, withdrawLimit: 20_000_000_000,  freeSpins: 150, dailyBonus: 1_888_000, monthlyBonus: 18_880_000 },
  { level: 9,  name: 'VIP 9',      minTotalDeposit: 5_000_000_000,  cashbackRate: 0.025, interestRate: 0.009, withdrawLimit: 50_000_000_000,  freeSpins: 200, dailyBonus: 3_888_000, monthlyBonus: 38_880_000 },
  { level: 10, name: 'VIP 10',     minTotalDeposit: 10_000_000_000, cashbackRate: 0.030, interestRate: 0.010, withdrawLimit: 100_000_000_000, freeSpins: 300, dailyBonus: 5_888_000, monthlyBonus: 58_880_000 },
];

// ── Rebate rates by VIP level & game type ─────────────────────────────────
export interface RebateRate {
  vip:     string;
  live:    string;
  slot:    string;
  fishing: string;
  sports:  string;
  lottery: string;
}

export const REBATE_RATES: RebateRate[] = [
  { vip: 'VIP 1',  live: '0.30%', slot: '0.40%', fishing: '0.50%', sports: '0.20%', lottery: '0.20%' },
  { vip: 'VIP 2',  live: '0.40%', slot: '0.50%', fishing: '0.60%', sports: '0.30%', lottery: '0.30%' },
  { vip: 'VIP 3',  live: '0.50%', slot: '0.60%', fishing: '0.80%', sports: '0.40%', lottery: '0.40%' },
  { vip: 'VIP 4',  live: '0.60%', slot: '0.70%', fishing: '1.00%', sports: '0.50%', lottery: '0.50%' },
  { vip: 'VIP 5',  live: '0.80%', slot: '0.90%', fishing: '1.20%', sports: '0.60%', lottery: '0.60%' },
  { vip: 'VIP 6',  live: '1.00%', slot: '1.10%', fishing: '1.50%', sports: '0.80%', lottery: '0.80%' },
  { vip: 'VIP 7',  live: '1.20%', slot: '1.30%', fishing: '1.80%', sports: '1.00%', lottery: '1.00%' },
  { vip: 'VIP 8',  live: '1.50%', slot: '1.60%', fishing: '2.00%', sports: '1.20%', lottery: '1.20%' },
  { vip: 'VIP 9',  live: '1.80%', slot: '2.00%', fishing: '2.50%', sports: '1.50%', lottery: '1.50%' },
  { vip: 'VIP 10', live: '2.00%', slot: '2.50%', fishing: '3.00%', sports: '2.00%', lottery: '2.00%' },
];
