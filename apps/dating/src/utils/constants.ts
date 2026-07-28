export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY: '/verify',
  ONBOARDING: '/onboarding',
  DISCOVERY: '/discovery',
  SWIPE: '/swipe',
  MATCHES: '/matches',
  PROFILE_VIEW: '/profile/:id',
  LIVE: '/live',
  LIVE_ROOM: '/live/:id',
  BROADCAST: '/broadcast',
  FEED: '/feed',
  STORIES: '/stories',
  SHORTS: '/shorts',
  CHAT_LIST: '/chat',
  CHAT_ROOM: '/chat/:userId',
  VOICE_CALL: '/voice-call/:userId',
  VIDEO_CALL: '/video-call/:userId',
  WALLET: '/wallet',
  RECHARGE: '/recharge',
  VIP: '/vip',
  SHOP: '/shop',
  DAILY: '/daily',
  LEVEL: '/level',
  PROFILE: '/profile',
  EDIT_PROFILE: '/profile/edit',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  COMMUNITY: '/community',
  NEARBY: '/nearby',
  SEARCH: '/search',
  REFERRAL: '/referral',
  SUPPORT: '/support',
  PARTY: '/party',
  PREMIUM_DATING: '/premium-dating',
  EVENTS: '/events',
  CREATOR: '/creator',
} as const;

export const PAYMENT_METHODS = [
  { id: 'momo',    label: 'MoMo',        icon: 'MoMo',    color: '#a50064' },
  { id: 'zalopay', label: 'ZaloPay',     icon: 'ZaloPay', color: '#0068FF' },
  { id: 'vnpay',   label: 'VNPay',       icon: 'VNPay',   color: '#e41c1c' },
  { id: 'bank',    label: 'Ngân hàng',   icon: 'Bank',    color: '#1a56db' },
  { id: 'qr',      label: 'QR Code',     icon: 'QR',      color: '#0ea5e9' },
];

export const QUICK_AMOUNTS = [10_000, 20_000, 50_000, 100_000, 200_000, 500_000];

export const GOALS = [
  'Tìm bạn', 'Hẹn hò', 'Kết hôn', 'Chat vui',
  'Kết bạn', 'Du lịch', 'Game', 'Tâm sự',
];

export const INTERESTS = [
  'Âm nhạc', 'Du lịch', 'Thể thao', 'Ẩm thực', 'Phim ảnh',
  'Đọc sách', 'Nghệ thuật', 'Gaming', 'Yoga', 'Nấu ăn',
  'Chụp ảnh', 'Khiêu vũ', 'Cafe', 'Mua sắm', 'Fitness',
  'Thiên nhiên', 'Thú cưng', 'Công nghệ', 'Thời trang', 'Thiền định',
];

export const GENDERS = [
  { value: 'male',   label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other',  label: 'Khác' },
];

export const VIP_COLORS: Record<number, string> = {
  1: 'from-yellow-600 to-yellow-400',
  2: 'from-slate-400 to-slate-300',
  3: 'from-yellow-400 to-amber-300',
  4: 'from-pink-500 to-rose-400',
  5: 'from-purple-500 to-pink-400',
};

export const VIP_NAMES: Record<number, string> = {
  0: 'Free',
  1: 'Gold',
  2: 'Diamond',
  3: 'Royal',
};

export const COMMUNITY_TOPICS = [
  { id: 'tamap',    label: 'Tâm sự',  icon: '💬', color: 'bg-pink-100 text-pink-700' },
  { id: 'hedodating', label: 'Hẹn hò', icon: '💕', color: 'bg-red-100 text-red-700' },
  { id: 'game',    label: 'Game',     icon: '🎮', color: 'bg-purple-100 text-purple-700' },
  { id: 'review',  label: 'Review',   icon: '⭐', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'travel',  label: 'Du lịch',  icon: '✈️', color: 'bg-blue-100 text-blue-700' },
  { id: 'general', label: 'Chung',    icon: '💡', color: 'bg-green-100 text-green-700' },
];

// ── Asset paths từ applive18 ─────────────────────────────────────────────────
export const ASSET_NAV = {
  HOME_ACTIVE:    '/icons/nav/zy1.png',
  HOME_INACTIVE:  '/icons/nav/zy.png',
  MATCH_ACTIVE:   '/icons/nav/yh1.png',
  MATCH_INACTIVE: '/icons/nav/yh.png',
  DATE_ACTIVE:    '/icons/nav/dt1.png',
  DATE_INACTIVE:  '/icons/nav/dt.png',
  VIDEO_ACTIVE:   '/icons/nav/video1.png',
  VIDEO_INACTIVE: '/icons/nav/video.png',
  ME_ACTIVE:      '/icons/nav/wd1.png',
  ME_INACTIVE:    '/icons/nav/wd.png',
} as const;

export const ASSET_UI = {
  DEFAULT_AVATAR: '/icons/ui/userpic.png',
  LIVE_BADGE:     '/icons/ui/lives.gif',
  ICON_LOVE:      '/icons/ui/icon_love.png',
  ICON_VIEWS:     '/icons/ui/icon_views.png',
  ICON_NOTICE:    '/icons/ui/notice.png',
  ICON_LOCATION:  '/icons/ui/icon_location.png',
  ICON_MESSAGE:   '/icons/ui/icon_message.png',
  ICON_SERVICE:   '/icons/ui/icon_service.png',
  ICON_USDT_BG:   '/icons/ui/icon_usdt_bg.png',
  ICO_DEPOSIT:    '/icons/ui/ico_czzx.png',
  ICO_WITHDRAW:   '/icons/ui/ico_txzx.png',
  ICO_ORDERS:     '/icons/ui/ico_bb.png',
  ICO_DEP_HIST:   '/icons/ui/ico_czjl.png',
  ICO_WD_HIST:    '/icons/ui/ico_tkjl.png',
  ICO_WALLET:     '/icons/ui/icon_user_card.png',
  EYE_OPEN:       '/icons/ui/openeye.png',
  EYE_CLOSED:     '/icons/ui/closeeye.png',
  LOGIN_BG:       '/images/login/login.jpg',
  LOGIN_LOGO:     '/images/login/login_logo.png',
  KEFU_BG:        '/icons/ui/kefu_bg.jpg',
  ICO_RES_01:     '/icons/ui/ico_res01.png',
  ICO_RES_02:     '/icons/ui/ico_res02.png',
  ICO_RES_03:     '/icons/ui/ico_res03.png',
  ICO_RES_04:     '/icons/ui/ico_res04.png',
  ICON_TELEGRAM:  '/icons/ui/icon_telegram.png',
  ICON_LINE:      '/icons/ui/icon_line.png',
  ICON_WS:        '/icons/ui/icon_ws.png',
} as const;

export const CONTACT_LINKS = {
  LINE:     'https://line.me/ti/p/XXXXXXX',
  TELEGRAM: 'https://t.me/XXXXXXX',
  ZALO:     'https://zalo.me/XXXXXXX',
} as const;
