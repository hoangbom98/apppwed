// frontend/game/src/utils/assets.ts
// Central registry of all static asset paths — reusing images from Sport_xanh WAP build

// ── Base paths ────────────────────────────────────────────────────────────
const WAP = '/wap';
const FS   = `${WAP}/fs`;

// ── Game provider logos (fs/game/wap/*.webp) ─────────────────────────────
// Mapping provider slug → image URL
export const PROVIDER_LOGO: Record<string, string> = {
  jdb:      `${FS}/game/wap/jdb.webp`,
  jili:     `${FS}/game/wap/jili.webp`,
  pg:       `${FS}/game/wap/pg.webp`,
  pg2:      `${FS}/game/wap/pg2.webp`,
  pp:       `${FS}/game/wap/pp.webp`,
  evo:      `${FS}/game/wap/evo.webp`,
  evolution:`${FS}/game/wap/evo.webp`,
  ag:       `${FS}/game/wap/ag.webp`,
  bbin:     `${FS}/game/wap/bbin.webp`,
  cq9:      `${FS}/game/wap/cq9.webp`,
  habanero: `${FS}/game/wap/hb.webp`,
  hb:       `${FS}/game/wap/hb.webp`,
  mg:       `${FS}/game/wap/mg.webp`,
  microgaming: `${FS}/game/wap/mg.webp`,
  pt:       `${FS}/game/wap/pt.webp`,
  playtech: `${FS}/game/wap/pt.webp`,
  sa:       `${FS}/game/wap/sa.webp`,
  sexy:     `${FS}/game/wap/sexy.webp`,
  bg:       `${FS}/game/wap/bg.webp`,
  ep:       `${FS}/game/wap/ep.webp`,
  fc:       `${FS}/game/wap/fc.webp`,
  fg:       `${FS}/game/wap/fg.webp`,
  joker:    `${FS}/game/wap/joker.webp`,
  ka:       `${FS}/game/wap/ka.webp`,
  mega:     `${FS}/game/wap/mega.webp`,
  naga:     `${FS}/game/wap/naga.webp`,
  spade:    `${FS}/game/wap/sp.webp`,
  sp:       `${FS}/game/wap/sp.webp`,
  ygg:      `${FS}/game/wap/ygg.webp`,
  rtg:      `${FS}/game/wap/rtg.webp`,
  netent:   `${FS}/game/wap/net.webp`,
  net:      `${FS}/game/wap/net.webp`,
  wms:      `${FS}/game/wap/wms.webp`,
  bng:      `${FS}/game/wap/bng.webp`,
  btg:      `${FS}/game/wap/btg.webp`,
  quickspin:`${FS}/game/wap/quickspin.webp`,
  bs:       `${FS}/game/wap/bs.webp`,
  ds:       `${FS}/game/wap/ds.webp`,
  eg:       `${FS}/game/wap/eg.webp`,
  dgs:      `${FS}/game/wap/dgs.webp`,
  gp:       `${FS}/game/wap/gp.webp`,
  gpi:      `${FS}/game/wap/gpi.webp`,
  isb:      `${FS}/game/wap/isb.webp`,
  km:       `${FS}/game/wap/km.webp`,
  lkg:      `${FS}/game/wap/lkg.webp`,
  mw:       `${FS}/game/wap/mw.webp`,
  on:       `${FS}/game/wap/on.webp`,
  ps:       `${FS}/game/wap/ps.webp`,
  qs:       `${FS}/game/wap/qs.webp`,
  rt:       `${FS}/game/wap/rt.webp`,
  sg:       `${FS}/game/wap/sg.webp`,
  t1:       `${FS}/game/wap/t1.webp`,
  tada:     `${FS}/game/wap/tada.webp`,
  ttg:      `${FS}/game/wap/ttg.webp`,
  va:       `${FS}/game/wap/va.webp`,
  wg:       `${FS}/game/wap/wg.webp`,
  wow:      `${FS}/game/wap/wow.webp`,
};

// HOT badge overlay
export const GAME_HOT_BADGE = `${FS}/game/hot.webp`;

// ── Category icons — mapped to WAP fs sub-folders (header/wap images) ────
export const CATEGORY_ICON_MAP: Record<string, string> = {
  game:    `${FS}/game/wap/cq9.webp`,   // placeholder webp from game folder
  slots:   `${FS}/game/wap/pg.webp`,
  casino:  `${FS}/game/wap/bbin.webp`,
  sports:  `${FS}/sport/wap/1.webp`,
  lottery: `${FS}/lottery/wap/1.webp`,
  fishing: `${FS}/fish/wap/1.webp`,
  live:    `${FS}/live/wap/1.webp`,
  joker:   `${FS}/game/wap/joker.webp`,
  all:     `${WAP}/img/home_muen.png`,
};

// ── Category display tab icons (WAP tabbar icons) ─────────────────────────
export const TABBAR_ICONS = {
  home: {
    nor:    `${WAP}/tabbar/tabbar_icon1_nor.png`,
    select: `${WAP}/tabbar/tabbar_icon1_select.png`,
  },
  promotions: {
    nor:    `${WAP}/tabbar/tabbar_icon2_nor.png`,
    select: `${WAP}/tabbar/tabbar_icon2_select.png`,
  },
  deposit: {
    nor:    `${WAP}/tabbar/tabbar_icon3_nor.png`,
    select: `${WAP}/tabbar/tabbar_icon3_select.png`,
  },
  download: {
    nor:    `${WAP}/tabbar/tabbar_icon4_nor.png`,
    select: `${WAP}/tabbar/tabbar_icon4_select.png`,
  },
  profile: {
    nor:    `${WAP}/tabbar/tabbar_icon5_nor.png`,
    select: `${WAP}/tabbar/tabbar_icon5_select.png`,
  },
};

// ── VIP badge icons (level 1–10, from WAP vip-*.png) ──────────────────────
export const VIP_BADGES: Record<number, string> = {
  0:  `${WAP}/vip/vip-1.png`,
  1:  `${WAP}/vip/vip-1.png`,
  2:  `${WAP}/vip/vip-2.png`,
  3:  `${WAP}/vip/vip-3.png`,
  4:  `${WAP}/vip/vip-4.png`,
  5:  `${WAP}/vip/vip-5.png`,
  6:  `${WAP}/vip/vip-6.png`,
  7:  `${WAP}/vip/vip-7.png`,
  8:  `${WAP}/vip/vip-8.png`,
  9:  `${WAP}/vip/vip-9.png`,
  10: `${WAP}/vip/vip-10.png`,
};

// VIP background card images
export const VIP_BG: Record<number, string> = {
  1:  `${WAP}/vip/vip-1_bg.png`,
  2:  `${WAP}/vip/vip-2_bg.png`,
  3:  `${WAP}/vip/vip-3_bg.png`,
  4:  `${WAP}/vip/vip-4_bg.png`,
  5:  `${WAP}/vip/vip-5_bg.png`,
  6:  `${WAP}/vip/vip-6_bg.png`,
  7:  `${WAP}/vip/vip-7_bg.png`,
  8:  `${WAP}/vip/vip-8_bg.png`,
  9:  `${WAP}/vip/vip-9_bg.png`,
  10: `${WAP}/vip/vip-10_bg.png`,
};

// ── Logo ──────────────────────────────────────────────────────────────────
export const LOGO_PNG     = `${WAP}/img/logo.png`;
export const APP_LOGO_PNG = `${WAP}/img/app-logo.png`;
export const LOGO_SVG     = '/logo.svg';

// ── Home UI images ────────────────────────────────────────────────────────
export const HOME_IMGS = {
  notice:     `${WAP}/img/home_notice.png`,
  hotsports:  `${WAP}/img/home_hotsports.png`,
  menu:       `${WAP}/img/home_muen.png`,
  service:    `${WAP}/img/home_service.png`,
  wallet:     `${WAP}/img/walletnew.png`,
  gift:       `${WAP}/img/giftnew.png`,
  vip:        `${WAP}/img/vipnew.png`,
  redPacket:  `${WAP}/img/red-packet.png`,
  grab:       `${WAP}/img/grab.png`,
  hongbao:    `${WAP}/img/hongbao.png`,
  jinbi:      `${WAP}/img/jinbi.png`,
};

// ── Payment method icons ──────────────────────────────────────────────────
export const PAYMENT_ICONS: Record<string, string> = {
  banking:    '/icons/payment/banking.svg',
  momo:       '/icons/payment/momo.svg',
  zalopay:    '/icons/payment/zalopay.svg',
  usdt:       '/icons/payment/usdt.svg',
  viettelpay: '/icons/payment/viettelpay.svg',
};

// ── Dashboard / Quick-action button icons (WAP img) ───────────────────────
export const ACTION_ICONS = {
  deposit:    `${WAP}/img/walletnew.png`,
  withdraw:   `${WAP}/img/walletnew.png`,
  games:      `${WAP}/img/home_muen.png`,
  promotions: `${WAP}/img/giftnew.png`,
  vip:        `${WAP}/img/vipnew.png`,
  service:    `${WAP}/img/home_service.png`,
  download:   `${WAP}/img/home_service.png`,
  gift:       `${WAP}/img/giftnew.png`,
  wallet:     `${WAP}/img/walletnew.png`,
  notice:     `${WAP}/img/home_notice.png`,
  hotsports:  `${WAP}/img/home_hotsports.png`,
  redPacket:  `${WAP}/img/red-packet.png`,
  jinbi:      `${WAP}/img/jinbi.png`,
  grab:       `${WAP}/img/grab.png`,
};

// ── Notification type icons (WAP img) ─────────────────────────────────────
export const NOTIF_TYPE_ICONS: Record<string, string> = {
  system:      `${WAP}/img/home_service.png`,
  transaction: `${WAP}/img/walletnew.png`,
  game:        `${WAP}/img/home_muen.png`,
  promotion:   `${WAP}/img/giftnew.png`,
  vip:         `${WAP}/img/vipnew.png`,
  default:     `${WAP}/img/home_notice.png`,
};

// ── Promotion type icons (WAP img) ────────────────────────────────────────
export const PROMO_TYPE_ICONS: Record<string, string> = {
  bonus:     `${WAP}/img/giftnew.png`,
  cashback:  `${WAP}/img/walletnew.png`,
  vip:       `${WAP}/img/vipnew.png`,
  event:     `${WAP}/img/red-packet.png`,
  deposit:   `${WAP}/img/walletnew.png`,
  free_spin: `${WAP}/img/home_muen.png`,
  default:   `${WAP}/img/giftnew.png`,
};

// ── Category WAP icons (for fallback when no image from API) ─────────────
export const CATEGORY_WAP_ICONS: Record<string, string> = {
  slots:   `${FS}/game/wap/pg.webp`,
  casino:  `${FS}/game/wap/bbin.webp`,
  sports:  `${FS}/sport/wap/1.webp`,
  lottery: `${FS}/lottery/wap/1.webp`,
  fishing: `${FS}/fish/wap/1.webp`,
  live:    `${FS}/live/wap/1.webp`,
  cards:   `${FS}/game/wap/jili.webp`,
  all:     `${WAP}/img/home_muen.png`,
  game:    `${FS}/game/wap/cq9.webp`,
  default: `${FS}/game/wap/pg.webp`,
};

// ── Warning / alert icon ──────────────────────────────────────────────────
export const ICON_WARNING = `${WAP}/img/home_notice.png`;
export const ICON_EMPTY   = `${WAP}/img/home_muen.png`;

// ── Placeholder banners (gradient-based, no external image needed) ────────
export const PLACEHOLDER_BANNERS = [
  { id: 1, gradient: 'from-primary via-secondary to-primary/50', title: 'GAMEX', description: 'Hệ thống giải trí hàng đầu Việt Nam', link: '/register' },
  { id: 2, gradient: 'from-purple-700 via-purple-500 to-indigo-600', title: 'Khuyến Mãi', description: 'Nạp lần đầu tặng 100% bonus', link: '/promotions' },
  { id: 3, gradient: 'from-amber-600 via-orange-500 to-red-500', title: 'VIP Rewards', description: 'Nhận thưởng cao nhất cùng VIP Diamond', link: '/vip' },
];

// ── Vietnamese banks list — re-export từ @lkvip/constants (single source of truth) ─
export type { VNBank } from '@lkvip/types';
export { VN_BANKS, VN_BANK_MAP, VN_BANKS_TRANSFER } from '@lkvip/constants';

// ── Game providers list with real logos ───────────────────────────────────
export const GAME_PROVIDERS = [
  { name: 'JDB',              logo: PROVIDER_LOGO.jdb },
  { name: 'PG Soft',          logo: PROVIDER_LOGO.pg },
  { name: 'JILI',             logo: PROVIDER_LOGO.jili },
  { name: 'Pragmatic Play',   logo: PROVIDER_LOGO.pp },
  { name: 'Evolution',        logo: PROVIDER_LOGO.evo },
  { name: 'Habanero',         logo: PROVIDER_LOGO.hb },
  { name: 'Microgaming',      logo: PROVIDER_LOGO.mg },
  { name: 'CQ9',              logo: PROVIDER_LOGO.cq9 },
  { name: 'BBIN',             logo: PROVIDER_LOGO.bbin },
  { name: 'Joker',            logo: PROVIDER_LOGO.joker },
  { name: 'Spade',            logo: PROVIDER_LOGO.sp },
  { name: 'Playtech',         logo: PROVIDER_LOGO.pt },
  { name: 'SA Gaming',        logo: PROVIDER_LOGO.sa },
  { name: 'Sexy Gaming',      logo: PROVIDER_LOGO.sexy },
  { name: 'NetEnt',           logo: PROVIDER_LOGO.net },
  { name: 'YGG',              logo: PROVIDER_LOGO.ygg },
];
