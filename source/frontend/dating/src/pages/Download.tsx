/**
 * DownloadPage — Dating sub-project
 * ------------------------------------
 * App Store / Play Store–style download page for the Dating app.
 * Route: /download  (public, no DatingLayout)
 */
import { AppDistributionPage } from '@ui';
import type { AppConfig } from '@ui';

const DATING_APP: AppConfig = {
  // ── Branding ────────────────────────────────────────────────────────
  name:        'AppLive18',
  developer:   'AppLive18 Entertainment',
  tagline:     'Kết nối trái tim - Hẹn hò & Live Stream',
  icon:        '/icons/ui/login_logo.png',
  category:    'Hẹn hò · Social',
  inAppPurchases: true,
  primaryColor: '#ec4899',  // pink — matches dating theme

  // ── Stats ────────────────────────────────────────────────────────────
  rating:       4.5,
  reviewsCount: '23 N',
  ageLimit:     18,
  downloads:    '1 Tr+',
  size:         '56 MB',
  version:      '2.1.0',
  updatedAt:    'Tháng 7 năm 2026',

  // ── Download links ───────────────────────────────────────────────────
  androidLink: 'https://yourdomain.com/downloads/applive18.apk',
  iosLink:     'itms-services://?action=download-manifest&url=https://yourdomain.com/ios/applive18-manifest.plist',
  qrCodeUrl:   '',

  // ── Feature badges ───────────────────────────────────────────────────
  features: [
    '💘 Swipe & Kết đôi thông minh',
    '📺 Live Stream tương tác',
    '💬 Chat riêng tư & Video Call',
    '🎁 Tặng quà ảo & Xu thưởng',
    '👑 VIP & Hội viên đặc quyền',
    '🎯 Bộ lọc nâng cao theo vị trí',
    '🎉 Party Room & Sự kiện',
    '🔒 Xác minh danh tính',
  ],

  // ── Screenshots ──────────────────────────────────────────────────────
  screenshots: [
    { url: '/images/screenshots/screen1.png', alt: 'Trang chủ AppLive18' },
    { url: '/images/screenshots/screen2.png', alt: 'Swipe & Kết đôi' },
    { url: '/images/screenshots/screen3.png', alt: 'Live Stream' },
    { url: '/images/screenshots/screen4.png', alt: 'Chat riêng tư' },
    { url: '/images/screenshots/screen5.png', alt: 'Hồ sơ cá nhân' },
  ],

  // ── Description ──────────────────────────────────────────────────────
  description: `AppLive18 là nền tảng hẹn hò và livestream hàng đầu Việt Nam — kết nối hàng triệu người dùng qua AI matching thông minh và trải nghiệm tương tác phong phú.

💘 Kết đôi thông minh:
• AI matching dựa trên sở thích, tính cách, vị trí
• Swipe nhanh & Super Like không giới hạn (VIP)
• Xem profile, ảnh, video trước khi kết nối

📺 Live & Video:
• Live Stream tương tác — tặng quà realtime
• Video Call riêng tư — kết nối gương mặt
• Shorts & Stories — chia sẻ khoảnh khắc

🎁 Đặc quyền thành viên:
• Xu thưởng hàng ngày — đổi quà hấp dẫn
• VIP: xem profile ẩn danh, ưu tiên hiển thị
• Party Room — chơi game nhóm vui nhộn

🔐 An toàn & Uy tín:
• Xác minh danh tính qua CCCD/Passport
• Mã hóa end-to-end mọi tin nhắn
• Báo cáo & chặn tài khoản dễ dàng`,

  // ── Reviews ──────────────────────────────────────────────────────────
  reviews: [
    { author: 'Thu Hà', rating: 5, date: 'Tháng 7, 2026',
      body: 'App thật sự tuyệt vời! Đã tìm được người thương qua đây. Giao diện đẹp, dễ dùng.' },
    { author: 'Đức Anh', rating: 5, date: 'Tháng 7, 2026',
      body: 'Live stream chất lượng cao, quà ảo đa dạng. Cộng đồng thân thiện và vui vẻ.' },
    { author: 'Lan Phương', rating: 4, date: 'Tháng 6, 2026',
      body: 'AI matching rất chuẩn, gợi ý đúng người phù hợp. Sẽ tiếp tục dùng dài dài!' },
  ],
};

export default function DownloadPage() {
  return <AppDistributionPage appData={DATING_APP} />;
}
