/**
 * DownloadPage — Game sub-project
 * --------------------------------
 * Renders the App Store / Play Store–style distribution page for the GAMEX app.
 * The AppDistributionPage component comes from shared-ui (@ui) and is reused
 * across all sub-projects. Only the app configuration object is project-specific.
 *
 * Route:  /download  (public, no Layout shell)
 * Update the links below with real APK / OTA manifest URLs before deploying.
 */
import { AppDistributionPage } from '@ui';
import type { AppConfig } from '@ui';

const GAMEX_APP: AppConfig = {
  // ── Branding ─────────────────────────────────────────────────────────
  name:        'GAMEX',
  developer:   'GAMEX Entertainment',
  tagline:     'Hệ thống giải trí trực tuyến hàng đầu Việt Nam',
  icon:        '/logo.svg',
  category:    'Giải trí · 18+',
  inAppPurchases: true,
  primaryColor: '#194C38',   // matches game theme

  // ── Stats ─────────────────────────────────────────────────────────────
  rating:       4.6,
  reviewsCount: '12.5 N',
  ageLimit:     18,
  downloads:    '500 N+',
  size:         '48 MB',
  version:      '1.0.0',
  updatedAt:    'Tháng 7 năm 2026',

  // ── Download links (replace before go-live) ───────────────────────────
  androidLink: 'https://yourdomain.com/downloads/gamex.apk',
  iosLink:     'itms-services://?action=download-manifest&url=https://yourdomain.com/ios/manifest.plist',
  qrCodeUrl:   '', // empty → built-in QR SVG with GAMEX branding

  // ── Feature badges ────────────────────────────────────────────────────
  features: [
    '🎰 Slots 1000+ game',
    '🃏 Casino trực tiếp',
    '⚽ Cá cược thể thao',
    '🎁 VIP Rewards',
    '💳 Nạp/Rút tức thì',
    '🔒 Bảo mật SSL',
  ],

  // ── Screenshots ───────────────────────────────────────────────────────
  screenshots: [
    { url: '/images/screenshots/screen1.png', alt: 'Trang chủ GAMEX' },
    { url: '/images/screenshots/screen2.png', alt: 'Game Slots' },
    { url: '/images/screenshots/screen3.png', alt: 'Nạp tiền' },
    { url: '/images/screenshots/screen4.png', alt: 'VIP Rewards' },
    { url: '/images/screenshots/screen5.png', alt: 'Casino trực tiếp' },
  ],

  // ── Description ───────────────────────────────────────────────────────
  description: `GAMEX là nền tảng giải trí trực tuyến hàng đầu tại Việt Nam, mang đến trải nghiệm chơi game đỉnh cao ngay trên điện thoại của bạn.

✨ Tính năng nổi bật:
• 1,000+ game từ JDB, PG Soft, JILI, Pragmatic Play, Evolution
• Casino trực tiếp với dealer thật — Baccarat, Roulette, Blackjack
• Cá cược thể thao: Bóng đá, Bóng rổ, Esports
• Xổ số & Keno tốc độ cao · Bắn cá đa dạng

💰 Ưu đãi độc quyền:
• Thưởng chào mừng lên đến 100% cho lần nạp đầu
• Hoàn tiền hàng tuần 0.5%–2% tuỳ cấp VIP
• Thưởng sinh nhật & sự kiện hàng tháng

🔐 Bảo mật & Uy tín:
• Mã hóa SSL 256-bit toàn bộ giao dịch
• Nạp/rút qua 20 ngân hàng VN — xử lý trong 15 phút
• Hỗ trợ khách hàng 24/7 qua live chat`,

  // ── Reviews ───────────────────────────────────────────────────────────
  reviews: [
    { author: 'Nguyễn Văn A', rating: 5, date: 'Tháng 7, 2026',
      body: 'App chạy mượt, giao diện đẹp. Nạp/rút tiền rất nhanh. Rất hài lòng!' },
    { author: 'Trần Thị B', rating: 4, date: 'Tháng 6, 2026',
      body: 'Game đa dạng, nhiều thể loại. Nhà cái uy tín, đã chơi 3 tháng không gặp vấn đề gì.' },
    { author: 'Lê Minh C', rating: 5, date: 'Tháng 6, 2026',
      body: 'Casino trực tiếp rất chân thực, dealer nói tiếng Việt. Tỷ lệ thưởng cao.' },
  ],
};

export default function DownloadPage() {
  return <AppDistributionPage appData={GAMEX_APP} />;
}
